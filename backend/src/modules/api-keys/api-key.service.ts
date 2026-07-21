import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateApiKeyDto } from '../../common/dto';
import { generateToken, sha256 } from '../../common/utils';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an API key. The raw key is returned ONCE – subsequent requests
   * only expose the prefix for identification.
   */
  async create(workspaceId: string, dto: CreateApiKeyDto) {
    const rawKey = `ll_${generateToken(24)}`;
    const keyHash = sha256(rawKey);
    const keyPrefix = rawKey.slice(0, 11); // "ll_" + 8 chars

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        keyHash,
        keyPrefix,
        scopes: dto.scopes || ['read'],
        workspaceId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // Only returned on creation
      prefix: keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async findAll(workspaceId: string) {
    return this.prisma.apiKey.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(workspaceId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, workspaceId },
    });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.delete({ where: { id: keyId } });
    return { message: 'API key deleted' };
  }

  /** Rotate: delete old and create new. */
  async rotate(workspaceId: string, keyId: string) {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id: keyId, workspaceId },
    });
    if (!existing) throw new NotFoundException('API key not found');

    await this.prisma.apiKey.delete({ where: { id: keyId } });
    return this.create(workspaceId, {
      name: existing.name,
      scopes: existing.scopes,
      expiresAt: existing.expiresAt?.toISOString(),
    });
  }
}
