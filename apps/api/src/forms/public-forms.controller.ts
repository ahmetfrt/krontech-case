import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FormType } from '@prisma/client';
import { SubmitFormDto } from './dto/submit-form.dto';
import { FormsService } from './forms.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('public-forms')
@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get('type/:formType')
  getFormByType(
    @Param('formType', new ParseEnumPipe(FormType)) formType: FormType,
  ) {
    return this.formsService.getPublicFormByType(formType);
  }

  @Get(':id')
  getForm(@Param('id') id: string) {
    return this.formsService.getPublicForm(id);
  }

  @Post(':id/submit')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  submit(@Param('id') id: string, @Body() body: SubmitFormDto) {
    return this.formsService.submit(id, body);
  }
}
