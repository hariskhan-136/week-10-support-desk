import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './tickets.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  exports: [TypeOrmModule],
})
export class TicketsModule {}
