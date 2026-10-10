/**
 * Development seed data (PostgreSQL) — content only, never accounts.
 *
 * Idempotent: safe to re-run. Existing rows are skipped, so it never clobbers
 * anything you changed locally.
 *
 * This script creates NO accounts, and cannot: this service has no account API.
 * Accounts are the host system's concern. Help items carry an `authorId` FK, so
 * the seed reuses whichever account already exists. If none does, it exits with
 * an explanation rather than inventing one — creating a user here would put a
 * fixture account into a table this service does not own.
 *
 *   npm run db:seed
 */
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema, runMigrations, closePool } from '../db/client.js';

async function seed() {
  await runMigrations();

  // Reuse an existing account as the author; the FK requires one.
  const author = await db.query.users.findFirst({
    columns: { id: true, email: true, role: true },
    orderBy: (users, { asc }) => [asc(users.createdAt)],
  });

  if (!author) {
    console.error('No user accounts exist, so there is nobody to attribute content to.');
    console.error('Accounts are managed by the host system, not by this service —');
    console.error('create one there first, then re-run this script.');
    await closePool();
    process.exit(1);
  }

  const ids: Record<string, string> = { superadmin: author.id };
  console.log(`= author        ${author.email} (${author.role})`);

  // --- Folder tree ---
  const folderByName = new Map<string, string>();

  const FOLDERS = [
    { name: 'Reports', parent: null },
    { name: 'Exports', parent: 'Reports' },
    { name: 'Team', parent: null },
    { name: 'Billing', parent: null },
  ] as const;

  for (const f of FOLDERS) {
    const existing = await db.query.helpFolders.findFirst({
      where: and(
        eq(schema.helpFolders.name, f.name),
        f.parent === null
          ? isNull(schema.helpFolders.parentId)
          : eq(schema.helpFolders.parentId, folderByName.get(f.parent)!),
      ),
    });
    if (existing) {
      folderByName.set(f.name, existing.id);
      continue;
    }
    const [row] = await db
      .insert(schema.helpFolders)
      .values({
        tenantId: 'default',
        name: f.name,
        parentId: f.parent === null ? null : folderByName.get(f.parent)!,
        createdBy: ids.superadmin,
      })
      .returning({ id: schema.helpFolders.id });
    folderByName.set(f.name, row.id);
    console.log(`+ folder        ${f.parent ? f.parent + ' / ' : ''}${f.name}`);
  }

  // --- 4. One help item per workflow state ---
  const now = new Date();
  const items = [
    {
      title: 'Export a report to PDF',
      description: 'How to generate and download a report.',
      status: 'approved' as const,
      folder: 'Exports',
      contextKey: 'dashboard.reports.export',
      relatedContext: 'Dashboard > Reports > Export',
    },
    {
      title: 'Invite a teammate',
      description: 'Add a new user to your workspace.',
      status: 'pending' as const,
      folder: 'Team',
      contextKey: 'settings.team.invite',
      relatedContext: 'Settings > Team > Invite',
    },
    {
      title: 'Delete a draft invoice',
      description: 'Drafts can be removed before sending.',
      status: 'rejected' as const,
      folder: 'Billing',
      contextKey: 'billing.invoices.delete',
      relatedContext: 'Billing > Invoices > Delete',
    },
  ];

  let added = 0;
  for (const item of items) {
    const dupe = await db.query.helpItems.findFirst({
      where: eq(schema.helpItems.title, item.title),
    });
    if (dupe) continue;

    const approved = item.status === 'approved';
    // No demo author is created any more, so the superadmin authors the samples.
    const authorId = ids.superadmin;
    const nowDate = new Date(now);

    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.helpItems)
        .values({
          tenantId: 'default',
          folderId: folderByName.get(item.folder) ?? null,
          title: item.title,
          description: item.description,
          contentType: 'text',
          contentUrl: item.description,
          contextKey: item.contextKey,
          relatedContext: item.relatedContext,
          status: item.status,
          authorId,
          approvedBy: approved ? ids.superadmin : null,
          approvedAt: approved ? nowDate : null,
          rejectedBy: item.status === 'rejected' ? ids.superadmin : null,
          rejectedAt: item.status === 'rejected' ? nowDate : null,
          rejectionReason:
            item.status === 'rejected' ? 'Recording quality is below standard.' : null,
          contentVersion: 1,
          approvedContentVersion: approved ? 1 : null,
        })
        .returning({ id: schema.helpItems.id });

      await tx.insert(schema.helpItemEvents).values({
        helpItemId: inserted.id,
        action: approved ? 'approved' : item.status === 'pending' ? 'submitted' : 'rejected',
        fromStatus: null,
        toStatus: item.status,
        reason: null,
        actorId: approved ? ids.superadmin : authorId,
        tenantId: 'default',
      });
    });

    added += 1;
    console.log(`+ help item     ${item.title} (${item.status})`);
  }

  console.log(`\nSeed complete. ${added} item(s) added.`);
  console.log(`No accounts were created by this script.`);

  await closePool();
}

seed()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Seed failed:', err);
    try {
      await closePool();
    } catch {
      // ignore — we are already failing
    }
    process.exit(1);
  });
