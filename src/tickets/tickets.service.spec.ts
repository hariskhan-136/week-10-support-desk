jest.mock('@nestjs/common', () => {
  class HttpException extends Error {
    constructor(message: string) {
      super(message);
    }
  }

  class ConflictException extends HttpException {}
  class BadRequestException extends HttpException {}
  class ForbiddenException extends HttpException {}
  class NotFoundException extends HttpException {}
  class UnprocessableEntityException extends HttpException {}

  return {
    ConflictException,
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    UnprocessableEntityException,
    Injectable: () => () => {},
  };
});

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => {},
}));

import { ConflictException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketPriority, TicketStatus } from './tickets.entity';
import { UserRole } from '../users/users.entity';

describe('TicketsService', () => {
  let service: TicketsService;

  const ticketsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const usersRepository = {
    findOne: jest.fn(),
  };

  const ticketEventsRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const ticketTagsRepository = {};

  beforeEach(() => {
    jest.clearAllMocks();

    service = new TicketsService(
      ticketsRepository as any,
      usersRepository as any,
      ticketEventsRepository as any,
      ticketTagsRepository as any,
    );
  });

  describe('status machine', () => {
    const transitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      [TicketStatus.CLOSED]: [TicketStatus.IN_PROGRESS],
    };

    it('allows every legal status transition', async () => {
      for (const [from, allowed] of Object.entries(transitions)) {
        for (const to of allowed) {
          const ticket = {
            id: 1,
            status: from as TicketStatus,
            requester: {
              id: 1,
              role: UserRole.CUSTOMER,
            },
            assignee: null,
          };

          ticketsRepository.findOne.mockResolvedValue(ticket);

          ticketsRepository.save.mockResolvedValue({
            ...ticket,
            status: to,
          });

          usersRepository.findOne.mockResolvedValue({
            id: 2,
            role: UserRole.AGENT,
          });

          ticketEventsRepository.create.mockReturnValue({});
          ticketEventsRepository.save.mockResolvedValue({});

          jest.spyOn(service, 'findOne').mockResolvedValue({} as any);

          await expect(
            service.changeStatus(1, 2, {
              status: to,
              ...(from === TicketStatus.CLOSED &&
              to === TicketStatus.IN_PROGRESS
                ? { note: 'Reopening ticket for testing' }
                : {}),
            }),
          ).resolves.not.toThrow();
        }
      }
    });

    it('rejects every illegal status transition with 409', async () => {
      const illegalTransitions: Array<[TicketStatus, TicketStatus]> = [
        [TicketStatus.OPEN, TicketStatus.RESOLVED],
        [TicketStatus.OPEN, TicketStatus.CLOSED],
        [TicketStatus.IN_PROGRESS, TicketStatus.OPEN],
        [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
        [TicketStatus.RESOLVED, TicketStatus.OPEN],
        [TicketStatus.CLOSED, TicketStatus.OPEN],
        [TicketStatus.CLOSED, TicketStatus.RESOLVED],
      ];

      for (const [from, to] of illegalTransitions) {
        ticketsRepository.findOne.mockResolvedValue({
          id: 1,
          status: from,
          requester: {
            id: 1,
            role: UserRole.CUSTOMER,
          },
          assignee: null,
        });

        await expect(
          service.changeStatus(1, 2, {
            status: to,
          }),
        ).rejects.toBeInstanceOf(ConflictException);
      }
    });

    it('requires a note when reopening a closed ticket', async () => {
      ticketsRepository.findOne.mockResolvedValue({
        id: 1,
        status: TicketStatus.CLOSED,
        requester: {
          id: 1,
          role: UserRole.CUSTOMER,
        },
        assignee: null,
      });

      await expect(
        service.changeStatus(1, 2, {
          status: TicketStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow('A note is required when reopening a closed ticket');
    });
  });

  describe('due date calculation', () => {
    it('calculates the correct due date for urgent priority', () => {
      const createdAt = new Date('2026-09-04T10:00:00.000Z');

      const dueAt = (service as any).calculateDueAt(
        TicketPriority.URGENT,
        createdAt,
      );

      expect(dueAt).toEqual(new Date('2026-09-04T14:00:00.000Z'));
    });

    it('calculates the correct due date for high priority', () => {
      const createdAt = new Date('2026-09-04T10:00:00.000Z');

      const dueAt = (service as any).calculateDueAt(
        TicketPriority.HIGH,
        createdAt,
      );

      expect(dueAt).toEqual(new Date('2026-09-05T10:00:00.000Z'));
    });

    it('calculates the correct due date for normal priority', () => {
      const createdAt = new Date('2026-09-04T10:00:00.000Z');

      const dueAt = (service as any).calculateDueAt(
        TicketPriority.NORMAL,
        createdAt,
      );

      expect(dueAt).toEqual(new Date('2026-09-07T10:00:00.000Z'));
    });

    it('calculates the correct due date for low priority', () => {
      const createdAt = new Date('2026-09-04T10:00:00.000Z');

      const dueAt = (service as any).calculateDueAt(
        TicketPriority.LOW,
        createdAt,
      );

      expect(dueAt).toEqual(new Date('2026-09-11T10:00:00.000Z'));
    });
  });

  describe('customer visibility', () => {
    it('allows a customer to see their own ticket', async () => {
      const customer = {
        id: 1,
        email: 'customer1@test.com',
        fullName: 'Customer One',
        role: UserRole.CUSTOMER,
        createdAt: new Date(),
      };

      ticketsRepository.findOne.mockResolvedValue({
        id: 10,
        subject: 'My ticket',
        body: 'My issue',
        requester: customer,
        assignee: null,
      });

      const result = await service.findOne(10, 1);

      expect(result).not.toBeNull();
      expect(result?.requester?.id).toBe(1);
    });

    it("hides another customer's ticket", async () => {
      const customer = {
        id: 2,
        email: 'customer2@test.com',
        fullName: 'Customer Two',
        role: UserRole.CUSTOMER,
        createdAt: new Date(),
      };

      ticketsRepository.findOne.mockResolvedValue({
        id: 10,
        subject: 'Private ticket',
        body: 'Private issue',
        requester: customer,
        assignee: null,
      });

      const result = await service.findOne(10, 1);

      expect(result).toBeNull();
    });

    it('returns null when the ticket does not exist', async () => {
      ticketsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).resolves.toBeNull();
    });
  });
});
