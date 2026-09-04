import { TicketPriority, TicketStatus } from './tickets.entity';

describe('Ticket rules', () => {
  it('should allow the valid status transitions', () => {
    const transitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      [TicketStatus.CLOSED]: [TicketStatus.IN_PROGRESS],
    };

    expect(transitions[TicketStatus.OPEN]).toContain(TicketStatus.IN_PROGRESS);

    expect(transitions[TicketStatus.IN_PROGRESS]).toContain(
      TicketStatus.RESOLVED,
    );

    expect(transitions[TicketStatus.RESOLVED]).toContain(TicketStatus.CLOSED);

    expect(transitions[TicketStatus.RESOLVED]).toContain(
      TicketStatus.IN_PROGRESS,
    );

    expect(transitions[TicketStatus.CLOSED]).toContain(
      TicketStatus.IN_PROGRESS,
    );
  });

  it('should contain all required priorities', () => {
    expect(Object.values(TicketPriority)).toEqual(
      expect.arrayContaining([
        TicketPriority.LOW,
        TicketPriority.NORMAL,
        TicketPriority.HIGH,
        TicketPriority.URGENT,
      ]),
    );
  });
});
