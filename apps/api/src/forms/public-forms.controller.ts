import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubmitFormDto } from './dto/submit-form.dto';
import { FormsService } from './forms.service';

@ApiTags('public-forms')
@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':id')
  getForm(@Param('id') id: string) {
    return this.formsService.getPublicForm(id);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() body: SubmitFormDto) {
    return this.formsService.submit(id, body);
  }
}