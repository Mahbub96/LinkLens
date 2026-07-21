import { IsString, IsEmail, IsOptional, MinLength, IsBoolean, IsInt, IsArray, IsDateString, IsUrl, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Auth DTOs ───

export class RegisterDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() password: string;
}

export class RefreshTokenDto {
  @ApiProperty() @IsString() refreshToken: string;
}

// ─── Workspace DTOs ───

export class CreateWorkspaceDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiProperty() @IsString() organizationName: string;
}

export class InviteMemberDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional({ enum: ['OWNER', 'ADMIN', 'MANAGER', 'ANALYST'] })
  @IsOptional() @IsString() role?: string;
}

// ─── Link DTOs ───

export class CreateLinkDto {
  @ApiProperty() @IsUrl() destinationUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() domainHost?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() password?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() activatesAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxClicks?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() campaignId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() rules?: CreateMatchRuleDto[];
}

export class UpdateLinkDto {
  @ApiPropertyOptional() @IsOptional() @IsUrl() destinationUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isArchived?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() password?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() activatesAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxClicks?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() campaignId?: string;
}

export class CreateMatchRuleDto {
  @ApiProperty() @IsString() conditionType: string;
  @ApiProperty() @IsString() conditionValue: string; // JSON string
  @ApiProperty() @IsUrl() targetUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() priority?: number;
}

// ─── Campaign DTOs ───

export class CreateCampaignDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

// ─── QR Code DTOs ───

export class CreateQrCodeDto {
  @ApiProperty() @IsString() linkId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() format?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fgColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bgColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(20) cornerRadius?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() errorLevel?: string;
}

// ─── Domain DTOs ───

export class CreateDomainDto {
  @ApiProperty() @IsString() hostname: string;
}

// ─── Webhook DTOs ───

export class CreateWebhookDto {
  @ApiProperty() @IsUrl() url: string;
  @ApiProperty() @IsArray() events: string[];
}

export class UpdateWebhookDto {
  @ApiPropertyOptional() @IsOptional() @IsUrl() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() events?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

// ─── API Key DTOs ───

export class CreateApiKeyDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() scopes?: string[];
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}

// ─── Query DTOs ───

export class PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(365) days?: number = 30;
  @ApiPropertyOptional() @IsOptional() @IsString() linkId?: string;
}
