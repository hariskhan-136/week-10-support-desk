import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/users.entity';
import { Ticket } from './tickets/tickets.entity';
import { Comment } from './comments/comments.entity';
import { Tag } from './tags/tags.entity';
import { TicketTag } from './ticket-tags/ticket-tags.entity';
import { TicketEvent } from './ticket-events/ticket-events.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Ticket, Comment, Tag, TicketTag, TicketEvent],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
