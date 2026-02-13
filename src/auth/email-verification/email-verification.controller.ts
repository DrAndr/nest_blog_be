import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { ConfirmationDto } from './dto/confirmation.dto';
import type { Request } from 'express';
import { PublicUserDto } from '../../user/dto/publick-user.dto';
import { Serialize } from '../../libs/common/decorators/serialize.decorator';

@Controller('email-verification')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Serialize(PublicUserDto)
  @Post()
  public async newVerification(
    @Req() req: Request,
    @Body() dto: ConfirmationDto,
  ) {
    return await this.emailVerificationService.newVerification(req, dto);
  }
}
