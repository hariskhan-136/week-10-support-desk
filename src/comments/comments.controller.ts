import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tickets/:ticketId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Req() request: Request,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      Number(ticketId),
      Number(request.user!.sub),
      createCommentDto,
    );
  }

  @Get()
  findAll(@Param('ticketId') ticketId: string, @Req() request: Request) {
    return this.commentsService.findAll(
      Number(ticketId),
      Number(request.user!.sub),
    );
  }
}
