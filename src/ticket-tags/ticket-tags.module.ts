import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketTag } from './ticket-tags.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TicketTag])],
  exports: [TypeOrmModule],
})
export class TicketTagsModule {}
