CREATE TYPE "public"."repair_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TABLE "repair_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"repair_id" text NOT NULL,
	"author_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"repair_id" text NOT NULL,
	"from_status" "repair_status",
	"to_status" "repair_status" NOT NULL,
	"changed_by" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "problem_description" text;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "initial_condition" text;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "diagnosis" text;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "priority" "repair_priority" DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "expected_completion_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "assigned_technician_id" text;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "repair_notes" ADD CONSTRAINT "repair_notes_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_notes" ADD CONSTRAINT "repair_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repair_notes_repair_id_idx" ON "repair_notes" USING btree ("repair_id");--> statement-breakpoint
CREATE INDEX "repair_status_history_repair_id_idx" ON "repair_status_history" USING btree ("repair_id");--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_assigned_technician_id_users_id_fk" FOREIGN KEY ("assigned_technician_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repairs_device_id_idx" ON "repairs" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "repairs_assigned_technician_id_idx" ON "repairs" USING btree ("assigned_technician_id");