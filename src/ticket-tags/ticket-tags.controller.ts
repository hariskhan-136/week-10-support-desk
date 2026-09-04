import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { TicketTagsService } from './ticket-tags.service';
import { AddTicketTagDto } from './dto/add-ticket-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';

@Controller('tickets/:ticketId/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT, UserRole.ADMIN)
export class TicketTagsController {
  constructor(private readonly ticketTagsService: TicketTagsService) {}

  @Post()
  @HttpCode(200)
  addTag(
    @Param('ticketId') ticketId: string,
    @Body() addTicketTagDto: AddTicketTagDto,
  ) {
    return this.ticketTagsService.addTag(
      Number(ticketId),
      addTicketTagDto.tagId,
    );
  }

  @Delete(':tagId')
  @HttpCode(204)
  async removeTag(
    @Param('ticketId') ticketId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.ticketTagsService.removeTag(Number(ticketId), Number(tagId));
  }
}
