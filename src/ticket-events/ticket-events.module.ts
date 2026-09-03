import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEvent } from './ticket-events.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEvent])],
  exports: [TypeOrmModule],
})
export class TicketEventsModule {}
