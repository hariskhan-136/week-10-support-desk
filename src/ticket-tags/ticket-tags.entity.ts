import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Ticket } from '../tickets/tickets.entity';
import { Tag } from '../tags/tags.entity';

@Entity('ticket_tags')
export class TicketTag {
  @PrimaryColumn({ name: 'ticket_id' })
  ticketId: number;

  @PrimaryColumn({ name: 'tag_id' })
  tagId: number;

  @ManyToOne(() => Ticket, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => Tag, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
