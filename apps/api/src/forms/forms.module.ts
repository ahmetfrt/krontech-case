import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { PublicFormsController } from './public-forms.controller';

@Module({
  controllers: [FormsController, PublicFormsController],
  providers: [FormsService],
})
export class FormsModule {}