/**
 * Barrel export for the schema.
 *
 * The driver file imports only from here, so adding a table in a new module is
 * a one-line change and never requires touching the DB client.
 */
export * from './enums.js';
export * from './pg-enums.js';
// Column definitions only — no relation helpers — so there are no cycles.
export * from './users.js';
export * from './help-folders.js';
export * from './help-items.js';
// Relation graphs, imported last.
export * from './relations.js';
