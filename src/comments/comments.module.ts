import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment])],
  exports: [TypeOrmModule],
})
export class CommentsModule {}
