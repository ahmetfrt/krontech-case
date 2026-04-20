import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePreviewTokenDto } from './dto/create-preview-token.dto';
import { PreviewService } from './preview.service';

@ApiTags('preview')
@Controller('preview')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('token')
  createToken(@Body() body: CreatePreviewTokenDto) {
    return this.previewService.createToken(body);
  }

  @Get(':token')
  getPreview(@Param('token') token: string) {
    return this.previewService.getPreviewData(token);
  }
}