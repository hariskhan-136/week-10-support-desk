import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketPriority, TicketStatus } from './tickets.entity';
import { User } from '../users/users.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { TicketEvent } from '../ticket-events/ticket-events.entity';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { TicketTag } from '../ticket-tags/ticket-tags.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(TicketEvent)
    private readonly ticketEventsRepository: Repository<TicketEvent>,

    @InjectRepository(TicketTag)
    private readonly ticketTagsRepository: Repository<TicketTag>,
  ) {}

  async create(userId: number, createTicketDto: CreateTicketDto) {
    const requester = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!requester) {
      throw new Error('Requester not found');
    }

    const createdAt = new Date();

    const dueAt = this.calculateDueAt(createTicketDto.priority, createdAt);

    const ticket = this.ticketsRepository.create({
      subject: createTicketDto.subject,
      body: createTicketDto.body,
      priority: createTicketDto.priority,
      status: TicketStatus.OPEN,
      requester,
      assignee: null,
      dueAt,
    });

    const savedTicket = await this.ticketsRepository.save(ticket);

    return this.findOne(savedTicket.id, userId);
  }

  private calculateDueAt(priority: TicketPriority, createdAt: Date): Date {
    const dueAt = new Date(createdAt);

    const hoursByPriority: Record<TicketPriority, number> = {
      [TicketPriority.URGENT]: 4,
      [TicketPriority.HIGH]: 24,
      [TicketPriority.NORMAL]: 72,
      [TicketPriority.LOW]: 168,
    };

    dueAt.setHours(dueAt.getHours() + hoursByPriority[priority]);

    return dueAt;
  }

  async findOne(id: number, userId?: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: {
        requester: true,
        assignee: true,
      },
    });

    if (!ticket) {
      return null;
    }

    if (
      userId &&
      ticket.requester.role === 'customer' &&
      ticket.requester.id !== userId
    ) {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (user?.role === 'customer') {
        return null;
      }
    }

    return {
      ...ticket,
      requester: ticket.requester
        ? {
            id: ticket.requester.id,
            email: ticket.requester.email,
            fullName: ticket.requester.fullName,
            role: ticket.requester.role,
            createdAt: ticket.requester.createdAt,
          }
        : null,
      assignee: ticket.assignee
        ? {
            id: ticket.assignee.id,
            email: ticket.assignee.email,
            fullName: ticket.assignee.fullName,
            role: ticket.assignee.role,
            createdAt: ticket.assignee.createdAt,
          }
        : null,
    };
  }

  async findAll(userId: number, listTicketsDto: ListTicketsDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const page = listTicketsDto.page ?? 1;
    const pageSize = listTicketsDto.pageSize ?? 20;

    const queryBuilder = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.requester', 'requester')
      .leftJoinAndSelect('ticket.assignee', 'assignee');

    if (user.role === 'customer') {
      queryBuilder.andWhere('requester.id = :userId', { userId });
    }

    if (listTicketsDto.status) {
      queryBuilder.andWhere('ticket.status = :status', {
        status: listTicketsDto.status,
      });
    }

    if (listTicketsDto.priority) {
      queryBuilder.andWhere('ticket.priority = :priority', {
        priority: listTicketsDto.priority,
      });
    }

    if (listTicketsDto.assigneeId) {
      queryBuilder.andWhere('assignee.id = :assigneeId', {
        assigneeId: listTicketsDto.assigneeId,
      });
    }

    if (listTicketsDto.q) {
      queryBuilder.andWhere(
        '(LOWER(ticket.subject) LIKE LOWER(:q) OR LOWER(ticket.body) LIKE LOWER(:q))',
        {
          q: `%${listTicketsDto.q}%`,
        },
      );
    }

    if (listTicketsDto.overdue !== undefined) {
      if (listTicketsDto.overdue !== 'true') {
        throw new BadRequestException('overdue must be true when provided');
      }

      queryBuilder.andWhere('ticket.due_at < CURRENT_TIMESTAMP');
      queryBuilder.andWhere('ticket.status NOT IN (:...closedStatuses)', {
        closedStatuses: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
      });
    }

    if (listTicketsDto.tag) {
      queryBuilder
        .innerJoin(
          'ticket_tags',
          'ticketTag',
          'ticketTag.ticket_id = ticket.id',
        )
        .innerJoin('tags', 'tag', 'tag.id = ticketTag.tag_id')
        .andWhere('LOWER(tag.name) = LOWER(:tag)', {
          tag: listTicketsDto.tag,
        });
    }

    const allowedSortFields = ['createdAt', 'dueAt', 'priority'];

    const sort = listTicketsDto.sort ?? 'createdAt';
    const order = (listTicketsDto.order ?? 'desc').toLowerCase();

    if (!allowedSortFields.includes(sort)) {
      throw new BadRequestException(
        'sort must be createdAt, dueAt, or priority',
      );
    }

    if (order !== 'asc' && order !== 'desc') {
      throw new BadRequestException('order must be asc or desc');
    }

    const sortColumnMap: Record<string, string> = {
      createdAt: 'ticket.createdAt',
      dueAt: 'ticket.dueAt',
      priority: 'ticket.priority',
    };

    queryBuilder.orderBy(
      sortColumnMap[sort],
      order.toUpperCase() as 'ASC' | 'DESC',
    );

    const [tickets, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const data = tickets.map((ticket) => ({
      ...ticket,
      requester: ticket.requester
        ? {
            id: ticket.requester.id,
            email: ticket.requester.email,
            fullName: ticket.requester.fullName,
            role: ticket.requester.role,
            createdAt: ticket.requester.createdAt,
          }
        : null,
      assignee: ticket.assignee
        ? {
            id: ticket.assignee.id,
            email: ticket.assignee.email,
            fullName: ticket.assignee.fullName,
            role: ticket.assignee.role,
            createdAt: ticket.assignee.createdAt,
          }
        : null,
    }));

    return {
      data,
      page,
      pageSize,
      total,
    };
  }

  async update(id: number, userId: number, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: {
        requester: true,
        assignee: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'customer' && ticket.requester.id !== userId) {
      throw new NotFoundException('Ticket not found');
    }

    if (user.role !== 'customer' && user.role !== 'agent') {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (updateTicketDto.subject !== undefined) {
      ticket.subject = updateTicketDto.subject;
    }

    if (updateTicketDto.body !== undefined) {
      ticket.body = updateTicketDto.body;
    }

    if (updateTicketDto.priority !== undefined) {
      ticket.priority = updateTicketDto.priority;
    }

    const savedTicket = await this.ticketsRepository.save(ticket);

    return this.findOne(savedTicket.id, userId);
  }

  async assign(id: number, actorId: number, assigneeId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: {
        requester: true,
        assignee: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const assignee = await this.usersRepository.findOne({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    if (assignee.role !== 'agent' && assignee.role !== 'admin') {
      throw new UnprocessableEntityException(
        'Assignee must be an agent or admin',
      );
    }

    ticket.assignee = assignee;

    const savedTicket = await this.ticketsRepository.save(ticket);

    const actor = await this.usersRepository.findOne({
      where: { id: actorId },
    });

    const event = this.ticketEventsRepository.create({
      ticket: savedTicket,
      actor,
      fromStatus: null,
      toStatus: null,
      note: `Ticket assigned to ${assignee.email}`,
    });

    await this.ticketEventsRepository.save(event);

    return this.findOne(savedTicket.id);
  }

  async changeStatus(
    id: number,
    actorId: number,
    changeStatusDto: ChangeStatusDto,
  ) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: {
        requester: true,
        assignee: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const currentStatus = ticket.status;
    const nextStatus = changeStatusDto.status;

    const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      [TicketStatus.CLOSED]: [TicketStatus.IN_PROGRESS],
    };

    if (!allowedTransitions[currentStatus].includes(nextStatus)) {
      throw new ConflictException(
        `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      );
    }

    if (
      currentStatus === TicketStatus.CLOSED &&
      nextStatus === TicketStatus.IN_PROGRESS &&
      !changeStatusDto.note?.trim()
    ) {
      throw new BadRequestException(
        'A note is required when reopening a closed ticket',
      );
    }

    ticket.status = nextStatus;

    const savedTicket = await this.ticketsRepository.save(ticket);

    const actor = await this.usersRepository.findOne({
      where: { id: actorId },
    });

    const event = this.ticketEventsRepository.create({
      ticket: savedTicket,
      actor,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      note: changeStatusDto.note?.trim() || null,
    });

    await this.ticketEventsRepository.save(event);

    return this.findOne(savedTicket.id);
  }

  async remove(ticketId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.ticketsRepository.remove(ticket);
  }
}
