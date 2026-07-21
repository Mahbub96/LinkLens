import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { sha256 } from '../utils';

/**
 * API Key Guard – Authenticates requests using API keys passed via X-API-Key header.
 * Keys are stored as SHA-256 hashes in the database.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const keyHash = sha256(apiKey);
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { workspace: true },
    });

    if (!key) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      throw new UnauthorizedException('API key expired');
    }

    // Update last used timestamp (fire-and-forget)
    this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    request.workspaceId = key.workspaceId;
    request.apiKeyScopes = key.scopes;
    return true;
  }
}
