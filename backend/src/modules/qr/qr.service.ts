import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateQrCodeDto } from '../../common/dto';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async generate(workspaceId: string, dto: CreateQrCodeDto) {
    // Verify the link belongs to the workspace
    const link = await this.prisma.link.findFirst({
      where: { id: dto.linkId, workspaceId },
    });
    if (!link) throw new NotFoundException('Link not found');

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const url = `${appUrl}/r/${link.slug}`;
    const format = dto.format || 'svg';

    // Save QR code config to database
    const qrCode = await this.prisma.qrCode.create({
      data: {
        linkId: dto.linkId,
        format,
        logoUrl: dto.logoUrl,
        fgColor: dto.fgColor || '#000000',
        bgColor: dto.bgColor || '#ffffff',
        cornerRadius: dto.cornerRadius || 0,
        errorLevel: dto.errorLevel || 'M',
      },
    });

    // Generate the QR code
    const qrOptions: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: (dto.errorLevel as any) || 'M',
      margin: 2,
      color: {
        dark: dto.fgColor || '#000000',
        light: dto.bgColor || '#ffffff',
      },
      width: 512,
    };

    let data: string;
    if (format === 'svg') {
      data = await QRCode.toString(url, { ...qrOptions, type: 'svg' });
    } else if (format === 'png') {
      data = await QRCode.toDataURL(url, qrOptions);
    } else {
      throw new BadRequestException('Supported formats: svg, png');
    }

    return { id: qrCode.id, format, data, url };
  }

  async findByLink(workspaceId: string, linkId: string) {
    const link = await this.prisma.link.findFirst({ where: { id: linkId, workspaceId } });
    if (!link) throw new NotFoundException('Link not found');
    return this.prisma.qrCode.findMany({ where: { linkId } });
  }

  async delete(workspaceId: string, qrId: string) {
    const qr = await this.prisma.qrCode.findUnique({
      where: { id: qrId },
      include: { link: true },
    });
    if (!qr || qr.link.workspaceId !== workspaceId) {
      throw new NotFoundException('QR code not found');
    }
    await this.prisma.qrCode.delete({ where: { id: qrId } });
    return { message: 'QR code deleted' };
  }
}
