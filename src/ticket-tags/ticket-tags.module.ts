import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketTag } from './ticket-tags.entity';
import { Ticket } from '../tickets/tickets.entity';
import { Tag } from '../tags/tags.entity';
import { TicketTagsService } from './ticket-tags.service';
import { TicketTagsController } from './ticket-tags.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TicketTag, Ticket, Tag]), AuthModule],
  controllers: [TicketTagsController],
  providers: [TicketTagsService],
  exports: [TicketTagsService],
})
export class TicketTagsModule {}
