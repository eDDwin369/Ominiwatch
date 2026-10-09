/**
 * Help approval workflow.
 *
 * The lifecycle under test:
 *   manager drafts (pending) -> customer cannot see it ->
 *   superadmin approves -> customer sees it ->
 *   manager edits -> back to pending, hidden again
 */
import { describe, it, expect } from 'vitest';
import { request, provisionRoleAccounts } from './helpers.js';
import { getApp } from './setup.js';

describe('help approval workflow', () => {
  it('hides pending items from customers and publishes them on approval', async () => {
    const app = await getApp();
    const { superadmin, manager, customer } = await provisionRoleAccounts('help');

    const title = `Rotate an API key ${Date.now()}`;

    const created = await request(app)
      .post('/api/help')
      .set(manager)
      .send({ title, contentType: 'text', body: '1. Open settings' })
      .expect(201);
    expect(created.body.item.status).toBe('pending');
    const id = created.body.item.id as string;

    // Customer list excludes it, and direct fetch 404s (not 403s).
    const list = await request(app).get('/api/help').set(customer).expect(200);
    expect(list.body.items.map((i: { title: string }) => i.title)).not.toContain(title);
    await request(app).get(`/api/help/${id}`).set(customer).expect(404);

    // Rejection requires a reason; approval records the reviewed version.
    await request(app)
      .post(`/api/help/${id}/review`)
      .set(superadmin)
      .send({ decision: 'rejected' })
      .expect(422);
    const rejected = await request(app)
      .post(`/api/help/${id}/review`)
      .set(superadmin)
      .send({ decision: 'rejected', reason: 'Needs screenshots' })
      .expect(200);
    expect(rejected.body.item.status).toBe('rejected');

    await request(app).post(`/api/help/${id}/resubmit`).set(manager).expect(200);

    const approved = await request(app)
      .post(`/api/help/${id}/review`)
      .set(superadmin)
      .send({ decision: 'approved' })
      .expect(200);
    expect(approved.body.item.status).toBe('approved');
    expect(approved.body.item.approvedContentVersion).toBe(1);

    // Now the customer sees it.
    const visible = await request(app).get('/api/help').set(customer).expect(200);
    expect(visible.body.items.map((i: { title: string }) => i.title)).toContain(title);

    // Manager edits approved content -> un-published until re-approved.
    const edited = await request(app)
      .patch(`/api/help/${id}`)
      .set(manager)
      .send({ body: '1. Open settings, then rotate' })
      .expect(200);
    expect(edited.body.item.status).toBe('pending');
    expect(edited.body.item.contentVersion).toBe(2);
    expect(edited.body.item.approvedBy).toBeNull();

    const hidden = await request(app).get('/api/help').set(customer).expect(200);
    expect(hidden.body.items.map((i: { title: string }) => i.title)).not.toContain(title);

    // Audit trail recorded every transition.
    const history = await request(app).get(`/api/help/${id}/history`).set(manager).expect(200);
    const actions = history.body.events.map((e: { action: string }) => e.action);
    expect(actions).toEqual(
      expect.arrayContaining(['submitted', 'rejected', 'resubmitted', 'approved']),
    );
  });

  it('enforces role boundaries on every write', async () => {
    const app = await getApp();
    const { manager, customer } = await provisionRoleAccounts('roles');

    await request(app)
      .post('/api/help')
      .set(customer)
      .send({ title: 'Sneaky', contentType: 'text', body: 'x' })
      .expect(403);

    const item = await request(app)
      .post('/api/help')
      .set(manager)
      .send({ title: 'Boundary check', contentType: 'text', body: 'x' })
      .expect(201);
    const id = item.body.item.id as string;

    await request(app)
      .post(`/api/help/${id}/review`)
      .set(manager)
      .send({ decision: 'approved' })
      .expect(403);

    await request(app).get(`/api/help/${id}/history`).set(customer).expect(403);
  });
});
