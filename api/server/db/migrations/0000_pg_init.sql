CREATE TYPE "public"."archive_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('video', 'image', 'pdf', 'text', 'link');--> statement-breakpoint
CREATE TYPE "public"."help_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('created', 'submitted', 'approved', 'rejected', 'resubmitted', 'archived', 'restored');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'manager', 'superadmin');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"description" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_item_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"help_item_id" uuid NOT NULL,
	"action" "review_action" NOT NULL,
	"from_status" "help_status",
	"to_status" "help_status",
	"reason" text,
	"actor_id" uuid NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"folder_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"content_type" "content_type" NOT NULL,
	"content_url" text,
	"context_key" text,
	"related_context" text DEFAULT '' NOT NULL,
	"status" "help_status" DEFAULT 'pending' NOT NULL,
	"archive_status" "archive_status" DEFAULT 'active' NOT NULL,
	"author_id" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejected_by" uuid,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"content_version" integer DEFAULT 1 NOT NULL,
	"approved_content_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"help_item_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "help_folders" ADD CONSTRAINT "help_folders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_item_events" ADD CONSTRAINT "help_item_events_help_item_id_help_items_id_fk" FOREIGN KEY ("help_item_id") REFERENCES "public"."help_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_item_events" ADD CONSTRAINT "help_item_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_items" ADD CONSTRAINT "help_items_folder_id_help_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."help_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_items" ADD CONSTRAINT "help_items_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_items" ADD CONSTRAINT "help_items_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_items" ADD CONSTRAINT "help_items_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_help_item_id_help_items_id_fk" FOREIGN KEY ("help_item_id") REFERENCES "public"."help_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "help_folders_tenant_idx" ON "help_folders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "help_folders_parent_idx" ON "help_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "help_folders_sibling_name_unq" ON "help_folders" USING btree ("tenant_id",coalesce("parent_id", '00000000-0000-0000-0000-000000000000'::uuid),lower("name"));--> statement-breakpoint
CREATE INDEX "help_events_item_idx" ON "help_item_events" USING btree ("help_item_id");--> statement-breakpoint
CREATE INDEX "help_events_tenant_idx" ON "help_item_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "help_items_tenant_status_idx" ON "help_items" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "help_items_context_idx" ON "help_items" USING btree ("context_key");--> statement-breakpoint
CREATE INDEX "help_items_author_idx" ON "help_items" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "help_items_folder_idx" ON "help_items" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "help_items_lookup_idx" ON "help_items" USING btree ("tenant_id","context_key","status") WHERE "help_items"."archive_status" = 'active';--> statement-breakpoint
CREATE INDEX "media_item_idx" ON "media_assets" USING btree ("help_item_id");--> statement-breakpoint
CREATE INDEX "media_tenant_idx" ON "media_assets" USING btree ("tenant_id");