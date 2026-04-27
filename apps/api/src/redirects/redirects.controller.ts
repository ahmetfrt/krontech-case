import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRedirectRuleDto } from './dto/create-redirect-rule.dto';
import { UpdateRedirectRuleDto } from './dto/update-redirect-rule.dto';

@Controller('redirects')
export class RedirectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  findAll() {
    return this.prisma.redirectRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  create(@Body() body: CreateRedirectRuleDto) {
    return this.prisma.redirectRule.create({
      data: {
        sourcePath: body.sourcePath,
        targetPath: body.targetPath,
        statusCode: body.statusCode,
        isActive: body.isActive ?? true,
      },
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  update(@Param('id') id: string, @Body() body: UpdateRedirectRuleDto) {
    return this.prisma.redirectRule.update({
      where: { id },
      data: body,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  delete(@Param('id') id: string) {
    return this.prisma.redirectRule.delete({
      where: { id },
    });
  }

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
