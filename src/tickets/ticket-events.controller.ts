import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { TicketEventsService } from './ticket-events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tickets/:ticketId/events')
@UseGuards(JwtAuthGuard)
export class TicketEventsController {
  constructor(private readonly ticketEventsService: TicketEventsService) {}

  @Get()
  findAll(@Param('ticketId') ticketId: string, @Req() request: Request) {
    return this.ticketEventsService.findAll(
      Number(ticketId),
      Number(request.user!.sub),
    );
  }
}
