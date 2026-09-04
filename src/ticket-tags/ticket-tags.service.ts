import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TicketTag } from './ticket-tags.entity';
import { Ticket } from '../tickets/tickets.entity';
import { Tag } from '../tags/tags.entity';

@Injectable()
export class TicketTagsService {
  constructor(
    @InjectRepository(TicketTag)
    private readonly ticketTagsRepository: Repository<TicketTag>,

    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,

    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async addTag(ticketId: number, tagId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const tag = await this.tagsRepository.findOne({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const existing = await this.ticketTagsRepository.findOne({
      where: { ticketId, tagId },
    });

    if (!existing) {
      await this.ticketTagsRepository.save(
        this.ticketTagsRepository.create({
          ticketId,
          tagId,
        }),
      );
    }

    return {
      ticketId,
      tagId,
      tag,
    };
  }

  async removeTag(ticketId: number, tagId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const tag = await this.tagsRepository.findOne({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const ticketTag = await this.ticketTagsRepository.findOne({
      where: { ticketId, tagId },
    });

    if (!ticketTag) {
      throw new NotFoundException('Ticket tag not found');
    }

    await this.ticketTagsRepository.remove(ticketTag);
  }
}
