import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../users/users.entity';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../tickets/tickets.entity';
import { Comment } from '../comments/comments.entity';
import { Tag } from '../tags/tags.entity';
import { TicketTag } from '../ticket-tags/ticket-tags.entity';
import { TicketEvent } from '../ticket-events/ticket-events.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Ticket, Comment, Tag, TicketTag, TicketEvent],
  synchronize: false,
});

function calculateDueAt(priority: TicketPriority, createdAt: Date): Date {
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

async function seed() {
  await dataSource.initialize();

  try {
    const usersRepository = dataSource.getRepository(User);
    const ticketsRepository = dataSource.getRepository(Ticket);
    const commentsRepository = dataSource.getRepository(Comment);
    const tagsRepository = dataSource.getRepository(Tag);
    const ticketTagsRepository = dataSource.getRepository(TicketTag);
    const ticketEventsRepository = dataSource.getRepository(TicketEvent);

    console.log('Database connected.');

    // ============================================================
    // USERS
    // ============================================================

    const password = 'SupportDesk123!';
    const passwordHash = await bcrypt.hash(password, 12);

    const userDefinitions = [
      {
        email: 'admin@supportdesk.local',
        fullName: 'Support Desk Admin',
        role: UserRole.ADMIN,
      },
      {
        email: 'agent1@supportdesk.local',
        fullName: 'Support Agent One',
        role: UserRole.AGENT,
      },
      {
        email: 'agent2@supportdesk.local',
        fullName: 'Support Agent Two',
        role: UserRole.AGENT,
      },
      {
        email: 'customer1@supportdesk.local',
        fullName: 'Customer One',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'customer2@supportdesk.local',
        fullName: 'Customer Two',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'customer3@supportdesk.local',
        fullName: 'Customer Three',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'customer4@supportdesk.local',
        fullName: 'Customer Four',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'customer5@supportdesk.local',
        fullName: 'Customer Five',
        role: UserRole.CUSTOMER,
      },
    ];

    const users: User[] = [];

    for (const definition of userDefinitions) {
      let user = await usersRepository.findOne({
        where: { email: definition.email },
      });

      if (!user) {
        user = usersRepository.create({
          email: definition.email,
          passwordHash,
          fullName: definition.fullName,
          role: definition.role,
        });

        user = await usersRepository.save(user);
      }

      users.push(user);
    }

    const admin = users.find((user) => user.role === UserRole.ADMIN)!;

    const agents = users.filter((user) => user.role === UserRole.AGENT);

    const customers = users.filter((user) => user.role === UserRole.CUSTOMER);

    console.log(`Users ready: ${users.length}`);

    // ============================================================
    // TAGS
    // ============================================================

    const tagNames = [
      'billing',
      'technical',
      'account',
      'bug',
      'feature-request',
      'urgent',
    ];

    const tags: Tag[] = [];

    for (const name of tagNames) {
      let tag = await tagsRepository.findOne({
        where: { name },
      });

      if (!tag) {
        tag = tagsRepository.create({ name });
        tag = await tagsRepository.save(tag);
      }

      tags.push(tag);
    }

    console.log(`Tags ready: ${tags.length}`);

    // ============================================================
    // TICKETS
    // ============================================================

    const ticketDefinitions = [
      {
        subject: 'Unable to login to account',
        body: 'I cannot log into my account even though my password is correct.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Payment failed',
        body: 'My card payment failed while purchasing the subscription.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.HIGH,
      },
      {
        subject: 'Application crashes on startup',
        body: 'The application closes immediately after I open it.',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.URGENT,
      },
      {
        subject: 'Request account information',
        body: 'I would like to update my account information.',
        status: TicketStatus.CLOSED,
        priority: TicketPriority.LOW,
      },
      {
        subject: 'Dashboard loading slowly',
        body: 'The dashboard takes more than a minute to load.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
      },
      {
        subject: 'Incorrect invoice amount',
        body: 'The amount shown on my latest invoice is incorrect.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Password reset email not received',
        body: 'I requested a password reset but have not received the email.',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Feature request for dark mode',
        body: 'Please consider adding a dark mode to the application.',
        status: TicketStatus.CLOSED,
        priority: TicketPriority.LOW,
      },
      {
        subject: 'Unexpected error during checkout',
        body: 'An unexpected error appears when I try to complete checkout.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.URGENT,
      },
      {
        subject: 'Cannot update profile',
        body: 'The profile update form does not save my changes.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.HIGH,
      },
      {
        subject: 'Subscription cancellation',
        body: 'I would like to cancel my current subscription.',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Missing transaction',
        body: 'A recent transaction is missing from my account history.',
        status: TicketStatus.CLOSED,
        priority: TicketPriority.HIGH,
      },
      {
        subject: 'Mobile layout issue',
        body: 'Some buttons overlap when viewing the application on mobile.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Account verification problem',
        body: 'I am unable to complete account verification.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.URGENT,
      },
      {
        subject: 'Report a broken link',
        body: 'The documentation link on the help page is broken.',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.LOW,
      },
      {
        subject: 'Request additional feature',
        body: 'I would like to request an export feature.',
        status: TicketStatus.CLOSED,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Server error while saving',
        body: 'I receive a server error whenever I save a form.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
      },
      {
        subject: 'Duplicate charge',
        body: 'I believe I was charged twice for the same order.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.URGENT,
      },
      {
        subject: 'Change email address',
        body: 'Please help me change the email address associated with my account.',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Notifications not working',
        body: 'I am no longer receiving notification emails.',
        status: TicketStatus.CLOSED,
        priority: TicketPriority.HIGH,
      },
      {
        subject: 'Search is not returning results',
        body: 'The search feature does not return expected results.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.NORMAL,
      },
      {
        subject: 'Slow report generation',
        body: 'Reports are taking a very long time to generate.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.LOW,
      },
      {
        subject: 'Broken image on dashboard',
        body: 'An image on the dashboard is not loading correctly.',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.LOW,
      },
      {
        subject: 'Cannot access billing page',
        body: 'The billing page shows an error when I try to open it.',
        status: TicketStatus.CLOSED,
        priority: TicketPriority.HIGH,
      },
      {
        subject: 'Critical production issue',
        body: 'A critical issue is affecting an important production workflow.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.URGENT,
      },
    ];

    let tickets = await ticketsRepository.find({
      order: {
        id: 'ASC',
      },
      take: 25,
    });

    if (tickets.length < 25) {
      for (
        let index = tickets.length;
        index < ticketDefinitions.length;
        index++
      ) {
        const definition = ticketDefinitions[index];

        const requester = customers[index % customers.length];

        let assignee: User | null = null;

        if (index % 4 !== 0) {
          assignee = agents[index % agents.length];
        }

        const createdAt = new Date();

        // Make the first three tickets clearly overdue.
        if (index < 3) {
          createdAt.setHours(createdAt.getHours() - 200);
        } else {
          createdAt.setHours(createdAt.getHours() - index * 24);
        }

        const dueAt = calculateDueAt(definition.priority, createdAt);

        const ticket = ticketsRepository.create({
          subject: definition.subject,
          body: definition.body,
          status: definition.status,
          priority: definition.priority,
          requester,
          assignee,
          dueAt,
          createdAt,
          updatedAt: createdAt,
        });

        await ticketsRepository.save(ticket);
      }

      tickets = await ticketsRepository.find({
        order: {
          id: 'ASC',
        },
        take: 25,
      });
    }

    console.log(`Tickets ready: ${tickets.length}`);

    // ============================================================
    // COMMENTS
    // ============================================================

    const existingCommentCount = await commentsRepository.count();

    if (existingCommentCount < 20) {
      const commentsToCreate: Comment[] = [];

      for (let index = 0; index < 20; index++) {
        const ticket = tickets[index % tickets.length];

        const author =
          index % 3 === 0
            ? agents[index % agents.length]
            : customers[index % customers.length];

        const isInternal = [2, 4, 7, 10, 13, 15].includes(index);

        const comment = commentsRepository.create({
          ticket,
          author,
          body: isInternal
            ? `Internal support note for ticket #${ticket.id}.`
            : `Customer-facing comment for ticket #${ticket.id}.`,
          isInternal,
        });

        commentsToCreate.push(comment);
      }

      await commentsRepository.save(commentsToCreate);
    }

    console.log(`Comments ready: ${await commentsRepository.count()}`);

    // ============================================================
    // TICKET TAG LINKS
    // ============================================================

    const existingTicketTags = await ticketTagsRepository.count();

    if (existingTicketTags < 20) {
      const ticketTagPairs = [
        [0, 0],
        [0, 2],

        [1, 0],
        [1, 5],

        [2, 1],
        [2, 3],
        [2, 5],

        [3, 2],

        [4, 1],
        [4, 3],

        [5, 0],

        [6, 2],
        [6, 1],

        [7, 4],

        [8, 1],
        [8, 3],
        [8, 5],

        [9, 1],
        [10, 0],
        [11, 0],
        [12, 1],
        [13, 2],
        [14, 4],
        [15, 4],
        [16, 1],
        [17, 0],
        [17, 5],
        [18, 2],
        [19, 1],
        [20, 3],
        [21, 1],
        [22, 1],
        [23, 0],
        [24, 5],
      ];

      for (const [ticketIndex, tagIndex] of ticketTagPairs) {
        const ticket = tickets[ticketIndex];
        const tag = tags[tagIndex];

        if (!ticket || !tag) {
          continue;
        }

        const existingLink = await ticketTagsRepository.findOne({
          where: {
            ticketId: ticket.id,
            tagId: tag.id,
          },
        });

        if (!existingLink) {
          const ticketTag = ticketTagsRepository.create({
            ticketId: ticket.id,
            tagId: tag.id,
          });

          await ticketTagsRepository.save(ticketTag);
        }
      }
    }

    console.log(
      `Ticket-tag links ready: ${await ticketTagsRepository.count()}`,
    );

    // ============================================================
    // TICKET EVENTS
    // ============================================================

    /*
     * Every ticket that is not currently OPEN has, by definition,
     * left the OPEN state at some point.
     *
     * The seed creates one audit event representing:
     *
     * OPEN -> current status
     *
     * For CLOSED tickets, an additional RESOLVED -> CLOSED event
     * is created so the status history is realistic.
     */

    const ticketsThatLeftOpen = tickets.filter(
      (ticket) => ticket.status !== TicketStatus.OPEN,
    );

    for (const ticket of ticketsThatLeftOpen) {
      const existingOpenEvent = await ticketEventsRepository.findOne({
        where: {
          ticket: { id: ticket.id },
          fromStatus: TicketStatus.OPEN,
        },
      });

      if (!existingOpenEvent) {
        const actor = ticket.assignee ?? agents[0];

        let toStatus: TicketStatus;

        if (ticket.status === TicketStatus.IN_PROGRESS) {
          toStatus = TicketStatus.IN_PROGRESS;
        } else {
          toStatus = TicketStatus.IN_PROGRESS;
        }

        const event = ticketEventsRepository.create({
          ticket,
          actor,
          fromStatus: TicketStatus.OPEN,
          toStatus,
          note: 'Seeded initial status transition.',
        });

        await ticketEventsRepository.save(event);
      }

      if (
        ticket.status === TicketStatus.RESOLVED ||
        ticket.status === TicketStatus.CLOSED
      ) {
        const existingResolvedEvent = await ticketEventsRepository.findOne({
          where: {
            ticket: { id: ticket.id },
            fromStatus: TicketStatus.IN_PROGRESS,
            toStatus: TicketStatus.RESOLVED,
          },
        });

        if (!existingResolvedEvent) {
          const actor = ticket.assignee ?? agents[0];

          const event = ticketEventsRepository.create({
            ticket,
            actor,
            fromStatus: TicketStatus.IN_PROGRESS,
            toStatus: TicketStatus.RESOLVED,
            note: 'Seeded resolution status transition.',
          });

          await ticketEventsRepository.save(event);
        }
      }

      if (ticket.status === TicketStatus.CLOSED) {
        const existingClosedEvent = await ticketEventsRepository.findOne({
          where: {
            ticket: { id: ticket.id },
            fromStatus: TicketStatus.RESOLVED,
            toStatus: TicketStatus.CLOSED,
          },
        });

        if (!existingClosedEvent) {
          const actor = ticket.assignee ?? agents[0];

          const event = ticketEventsRepository.create({
            ticket,
            actor,
            fromStatus: TicketStatus.RESOLVED,
            toStatus: TicketStatus.CLOSED,
            note: 'Seeded ticket closure transition.',
          });

          await ticketEventsRepository.save(event);
        }
      }
    }

    console.log(`Ticket events ready: ${await ticketEventsRepository.count()}`);

    // ============================================================
    // COMPLETE
    // ============================================================

    console.log('');
    console.log('======================================');
    console.log('Seed completed successfully.');
    console.log('======================================');
    console.log('');
    console.log('Seed login password: SupportDesk123!');
    console.log('');
    console.log('Admin:    admin@supportdesk.local');
    console.log('Agent 1:  agent1@supportdesk.local');
    console.log('Agent 2:  agent2@supportdesk.local');
    console.log('Customer: customer1@supportdesk.local');
    console.log('Customer: customer2@supportdesk.local');
    console.log('Customer: customer3@supportdesk.local');
    console.log('Customer: customer4@supportdesk.local');
    console.log('Customer: customer5@supportdesk.local');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
