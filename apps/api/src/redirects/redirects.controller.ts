import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('redirects')
export class RedirectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':encodedPath')
  async handleRedirect(
    @Param('encodedPath') encodedPath: string,
    @Res() res: Response,
  ) {
    const sourcePath = decodeURIComponent(encodedPath);

    const rule = await this.prisma.redirectRule.findFirst({
      where: {
        sourcePath,
        isActive: true,
      },
    });

    if (!rule) {
      return res.status(404).json({ message: 'Redirect not found' });
    }

    return res.redirect(rule.statusCode, rule.targetPath);
  }
}