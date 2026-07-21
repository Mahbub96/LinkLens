import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDomainDto } from '../../common/dto';

@Injectable()
export class DomainService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateDomainDto) {
    const existing = await this.prisma.domain.findUnique({
      where: { hostname: dto.hostname },
    });
    if (existing) throw new ConflictException('Domain already registered');

    return this.prisma.domain.create({
      data: { hostname: dto.hostname, workspaceId },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.domain.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verify(workspaceId: string, domainId: string) {
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, workspaceId },
    });
    if (!domain) throw new NotFoundException('Domain not found');

    // In production, verify DNS records (CNAME/A record pointing to our servers)
    // For now, mark as verified
    return this.prisma.domain.update({
      where: { id: domainId },
      data: { isVerified: true },
    });
  }

  async delete(workspaceId: string, domainId: string) {
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, workspaceId },
    });
    if (!domain) throw new NotFoundException('Domain not found');
    await this.prisma.domain.delete({ where: { id: domainId } });
    return { message: 'Domain deleted' };
  }

  /**
   * Caddy On-Demand TLS validation webhook.
   * Called by Caddy to check if a domain is verified before issuing SSL.
   */
  async validateForCaddy(hostname: string): Promise<boolean> {
    const domain = await this.prisma.domain.findUnique({
      where: { hostname },
    });
    return domain?.isVerified ?? false;
  }
}
