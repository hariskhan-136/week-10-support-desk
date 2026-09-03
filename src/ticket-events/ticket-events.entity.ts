import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from '../tickets/tickets.entity';
import { User } from '../users/users.entity';

@Entity('ticket_events')
export class TicketEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    nullable: true,
  })
  fromStatus: string | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    nullable: true,
  })
  toStatus: string | null;

  @Column('text', { nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
