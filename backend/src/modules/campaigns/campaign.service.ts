import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto } from '../../common/dto';
import { paginate } from '../../common/utils';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        tags: dto.tags || [],
        color: dto.color || '#6366f1',
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        workspaceId,
      },
    });
  }

  async findAll(workspaceId: string, page = 1, limit = 20) {
    const where = { workspaceId };
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { links: true } } },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findById(workspaceId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      include: {
        links: { orderBy: { createdAt: 'desc' }, take: 50 },
        _count: { select: { links: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(workspaceId: string, campaignId: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: dto.name,
        description: dto.description,
        tags: dto.tags,
        color: dto.color,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async delete(workspaceId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.prisma.campaign.delete({ where: { id: campaignId } });
    return { message: 'Campaign deleted' };
  }
}
