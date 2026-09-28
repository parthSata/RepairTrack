CREATE TYPE "public"."invoice_status" AS ENUM('ISSUED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_repair_id_unique";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "status" "invoice_status" DEFAULT 'ISSUED' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cancelled_by" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_repair_id_idx" ON "invoices" USING btree ("repair_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_one_issued_per_repair_uidx" ON "invoices" USING btree ("repair_id") WHERE "invoices"."status" = 'ISSUED';