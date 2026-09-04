import request from 'supertest';

describe('Support Desk E2E', () => {
  const baseUrl = 'http://localhost:3000';

  let customerToken: string;
  let secondCustomerToken: string;
  let agentToken: string;

  let ticketId: number;
  let agentId: number;

  beforeAll(async () => {
    const customerLogin = await request(baseUrl)
      .post('/auth/login')
      .send({
        email: 'customer1@supportdesk.local',
        password: 'SupportDesk123!',
      })
      .expect(200);

    customerToken = customerLogin.body.accessToken;

    const secondCustomerLogin = await request(baseUrl)
      .post('/auth/login')
      .send({
        email: 'customer2@supportdesk.local',
        password: 'SupportDesk123!',
      })
      .expect(200);

    secondCustomerToken = secondCustomerLogin.body.accessToken;

    const agentLogin = await request(baseUrl)
      .post('/auth/login')
      .send({
        email: 'agent1@supportdesk.local',
        password: 'SupportDesk123!',
      })
      .expect(200);

    agentToken = agentLogin.body.accessToken;

    const me = await request(baseUrl)
      .get('/auth/me')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    agentId = me.body.id;
  });

  it('registers a new customer', async () => {
    const email = `e2e-${Date.now()}@supportdesk.local`;

    const response = await request(baseUrl)
      .post('/auth/register')
      .send({
        email,
        password: 'SupportDesk123!',
        fullName: 'E2E Customer',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.role).toBe('customer');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('creates a ticket', async () => {
    const response = await request(baseUrl)
      .post('/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subject: 'E2E Support Ticket',
        body: 'Ticket created by the E2E test.',
        priority: 'high',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.subject).toBe('E2E Support Ticket');
    expect(response.body.status).toBe('open');
    expect(response.body.priority).toBe('high');
    expect(response.body).toHaveProperty('dueAt');

    ticketId = response.body.id;
  });

  it('lists tickets with filter and pagination', async () => {
    const response = await request(baseUrl)
      .get('/tickets')
      .query({
        priority: 'high',
        page: 1,
        pageSize: 10,
      })
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);

    expect(
      response.body.data.some(
        (ticket: { id: number }) => ticket.id === ticketId,
      ),
    ).toBe(true);
  });

  it('assigns the ticket to an agent', async () => {
    const response = await request(baseUrl)
      .post(`/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        assigneeId: agentId,
      })
      .expect(200);

    expect(response.body.assignee.id).toBe(agentId);
  });

  it('performs a legal status transition', async () => {
    const response = await request(baseUrl)
      .post(`/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'in_progress',
      })
      .expect(200);

    expect(response.body.status).toBe('in_progress');
  });

  it('rejects an illegal status transition with 409', async () => {
    const response = await request(baseUrl)
      .post(`/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'closed',
      })
      .expect(409);

    expect(response.body.statusCode).toBe(409);
  });

  it('adds a public comment', async () => {
    const response = await request(baseUrl)
      .post(`/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        body: 'This is an E2E public comment.',
      })
      .expect(201);

    expect(response.body.body).toBe('This is an E2E public comment.');
    expect(response.body.isInternal).toBe(false);
  });

  it('hides the ticket from another customer', async () => {
    await request(baseUrl)
      .get(`/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${secondCustomerToken}`)
      .expect(404);
  });
});
