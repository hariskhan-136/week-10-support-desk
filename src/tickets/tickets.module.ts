import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket } from './tickets.entity';
import { User } from '../users/users.entity';
import { AuthModule } from '../auth/auth.module';
import { TicketEvent } from '../ticket-events/ticket-events.entity';
import { TicketTag } from '../ticket-tags/ticket-tags.entity';
import { TicketEventsController } from './ticket-events.controller';
import { TicketEventsService } from './ticket-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, User, TicketEvent, TicketTag]),
    AuthModule,
  ],
  controllers: [TicketsController, TicketEventsController],
  providers: [TicketsService, TicketEventsService],
  exports: [TicketsService],
})
export class TicketsModule {}
