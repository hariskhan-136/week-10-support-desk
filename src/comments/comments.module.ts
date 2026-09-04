import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from './comments.entity';
import { Ticket } from '../tickets/tickets.entity';
import { User } from '../users/users.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Ticket, User]), AuthModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
