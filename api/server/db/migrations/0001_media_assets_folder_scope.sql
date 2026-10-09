-- Folder-level media uploads.
--
-- An asset may now belong to a folder instead of a help item, so `help_item_id`
-- becomes nullable and `folder_id` is added. Existing rows are unaffected: they
-- all carry a help_item_id, which the CHECK below accepts.
--
-- The CHECK forbids an asset from having BOTH owners, which would be ambiguous
-- for every read path. It deliberately allows neither owner too: those are the
-- `root` pseudo-folder assets, which belong to no folder and no item. The
-- matching service-layer invariant is "at most one owner", not "exactly one".
ALTER TABLE "media_assets" ALTER COLUMN "help_item_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "folder_id" uuid;
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_help_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."help_folders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "media_folder_idx" ON "media_assets" USING btree ("folder_id");
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_exactly_one_owner" CHECK (num_nonnulls("help_item_id", "folder_id") <= 1);