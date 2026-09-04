import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comment } from './comments.entity';
import { Ticket } from '../tickets/tickets.entity';
import { User, UserRole } from '../users/users.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,

    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    ticketId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const author = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!author) {
      throw new NotFoundException('User not found');
    }

    if (
      createCommentDto.isInternal === true &&
      author.role === UserRole.CUSTOMER
    ) {
      throw new ForbiddenException('Customers cannot create internal comments');
    }

    const comment = this.commentsRepository.create({
      ticket,
      author,
      body: createCommentDto.body,
      isInternal: createCommentDto.isInternal ?? false,
    });

    const savedComment = await this.commentsRepository.save(comment);

    return this.findOneForUser(savedComment.id, userId);
  }

  async findOneForUser(commentId: number, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: {
        author: true,
        ticket: {
          requester: true,
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (
      user.role === UserRole.CUSTOMER &&
      comment.ticket.requester.id !== userId
    ) {
      throw new NotFoundException('Comment not found');
    }

    if (user.role === UserRole.CUSTOMER && comment.isInternal) {
      throw new NotFoundException('Comment not found');
    }

    return {
      ...comment,
      ticket: {
        ...comment.ticket,
        requester: comment.ticket.requester
          ? {
              id: comment.ticket.requester.id,
              email: comment.ticket.requester.email,
              fullName: comment.ticket.requester.fullName,
              role: comment.ticket.requester.role,
              createdAt: comment.ticket.requester.createdAt,
            }
          : null,
      },
      author: {
        id: comment.author.id,
        email: comment.author.email,
        fullName: comment.author.fullName,
        role: comment.author.role,
        createdAt: comment.author.createdAt,
      },
    };
  }

  async findAll(ticketId: number, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: {
        requester: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (user.role === UserRole.CUSTOMER && ticket.requester.id !== userId) {
      throw new NotFoundException('Ticket not found');
    }

    const queryBuilder = this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.ticket_id = :ticketId', { ticketId })
      .orderBy('comment.created_at', 'ASC');

    if (user.role === UserRole.CUSTOMER) {
      queryBuilder.andWhere('comment.is_internal = false');
    }

    const comments = await queryBuilder.getMany();

    return comments.map((comment) => ({
      ...comment,
      author: {
        id: comment.author.id,
        email: comment.author.email,
        fullName: comment.author.fullName,
        role: comment.author.role,
        createdAt: comment.author.createdAt,
      },
    }));
  }
}
