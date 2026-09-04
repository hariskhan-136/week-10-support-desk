import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TicketEvent } from '../ticket-events/ticket-events.entity';
import { Ticket } from './tickets.entity';
import { User, UserRole } from '../users/users.entity';

@Injectable()
export class TicketEventsService {
  constructor(
    @InjectRepository(TicketEvent)
    private readonly eventsRepository: Repository<TicketEvent>,

    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(ticketId: number, userId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['requester'],
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

    if (user.role === UserRole.CUSTOMER && ticket.requester.id !== user.id) {
      throw new NotFoundException('Ticket not found');
    }

    const events = await this.eventsRepository.find({
      where: { ticket: { id: ticketId } },
      relations: ['actor'],
      order: { createdAt: 'ASC' },
    });

    return events.map((event) => ({
      ...event,
      actor: event.actor
        ? {
            id: event.actor.id,
            email: event.actor.email,
            fullName: event.actor.fullName,
            role: event.actor.role,
            createdAt: event.actor.createdAt,
          }
        : null,
    }));
  }
}
