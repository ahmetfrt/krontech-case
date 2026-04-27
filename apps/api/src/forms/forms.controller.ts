import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormsService } from './forms.service';
import { Res } from '@nestjs/common';
import type { Response } from 'express';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Body() body: CreateFormDto, @Req() req: AuthenticatedRequest) {
    return this.formsService.create(body, req.user.id);
  }

  @Get()
  findAll() {
    return this.formsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateFormDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.formsService.update(id, body, req.user.id);
  }

  @Get(':id/submissions')
  getSubmissions(@Param('id') id: string) {
    return this.formsService.getSubmissions(id);
  }


  @Get(':id/submissions/export')
  async exportSubmissions(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.formsService.exportSubmissionsCsv(id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="form-${id}-submissions.csv"`,
    );

    res.send(csv);
  }
}
