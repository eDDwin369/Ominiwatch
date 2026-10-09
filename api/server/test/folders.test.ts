/**
 * Folder tree + file placement.
 *
 * Covers nesting, duplicate names, cycle prevention, delete safety, customer
 * pruning, and moving files between folders.
 */
import { describe, it, expect } from 'vitest';
import { request, provisionRoleAccounts } from './helpers.js';
import { getApp } from './setup.js';

describe('folder tree', () => {
  it('nests folders and guards names, cycles and deletes', async () => {
    const app = await getApp();
    const { superadmin, manager, customer } = await provisionRoleAccounts('folders');

    const mk = async (name: string, parentId?: string) => {
      const res = await request(app)
        .post('/api/folders')
        .set(manager)
        .send(parentId ? { name, parentId } : { name })
        .expect(201);
      return res.body.folder.id as string;
    };

    const root = await mk('Ops Guide');
    const runbooks = await mk('Runbooks', root);
    const incidents = await mk('Incidents', runbooks);

    // Duplicate sibling names are rejected; same name elsewhere is fine.
    await request(app).post('/api/folders').set(manager).send({ name: 'Ops Guide' }).expect(409);
    await request(app)
      .post('/api/folders')
      .set(manager)
      .send({ name: 'Runbooks', parentId: root })
      .expect(409);
    await request(app)
      .post('/api/folders')
      .set(manager)
      .send({ name: 'Runbooks', parentId: incidents })
      .expect(201);

    // A folder cannot become its own ancestor.
    await request(app).patch(`/api/folders/${root}`).set(manager).send({ parentId: root }).expect(400);
    await request(app)
      .patch(`/api/folders/${root}`)
      .set(manager)
      .send({ parentId: incidents })
      .expect(400);

    // Breadcrumb stays finite.
    const crumb = await request(app).get(`/api/folders/${incidents}/breadcrumb`).set(manager).expect(200);
    expect(crumb.body.path.map((f: { name: string }) => f.name)).toEqual([
      'Ops Guide',
      'Runbooks',
      'Incidents',
    ]);

    // A file in the deepest folder; recursive listing reaches it.
    const file = await request(app)
      .post('/api/help')
      .set(manager)
      .send({ title: 'Restart a node', contentType: 'text', body: 'ssh then restart', folderId: incidents })
      .expect(201);
    const fileId = file.body.item.id as string;

    const direct = await request(app).get(`/api/folders/${root}/contents`).set(manager).expect(200);
    expect(direct.body.items).toHaveLength(0);

    const recursive = await request(app)
      .get(`/api/folders/${root}/contents?scope=all`)
      .set(manager)
      .expect(200);
    expect(recursive.body.items.map((i: { title: string }) => i.title)).toContain('Restart a node');

    // Pending-only branches are invisible to customers.
    const hidden = await request(app).get('/api/folders').set(customer).expect(200);
    expect(JSON.stringify(hidden.body)).not.toContain('Incidents');

    // Approving the file publishes the whole branch.
    await request(app)
      .post(`/api/help/${fileId}/review`)
      .set(superadmin)
      .send({ decision: 'approved' })
      .expect(200);
    const published = await request(app).get('/api/folders').set(customer).expect(200);
    expect(JSON.stringify(published.body)).toContain('Incidents');

    // Deleting a non-empty folder requires opting in; content is never lost.
    await request(app).delete(`/api/folders/${incidents}`).set(manager).expect(409);
    await request(app).delete(`/api/folders/${incidents}?moveItemsToRoot=true`).set(manager).expect(200);

    const orphan = await request(app).get(`/api/help/${fileId}`).set(manager).expect(200);
    expect(orphan.body.item.folderId).toBeNull();

    // Customers cannot manage folders at all.
    await request(app).post('/api/folders').set(customer).send({ name: 'Nope' }).expect(403);
  });
});
