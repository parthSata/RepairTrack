CREATE TYPE "public"."email_status" AS ENUM('SENT', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('REPAIR_RECEIVED', 'APPROVAL_REQUIRED', 'REPAIR_STARTED', 'READY_FOR_PICKUP', 'REPAIR_COMPLETED', 'INVOICE_GENERATED', 'PAYMENT_RECEIVED', 'TEST');--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" text NOT NULL,
	"repair_id" text,
	"type" "email_type" NOT NULL,
	"recipient" text,
	"subject" text NOT NULL,
	"status" "email_status" NOT NULL,
	"skip_reason" text,
	"error" text,
	"dedupe_key" text,
	"gmail_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_logs_shop_id_idx" ON "email_logs" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "email_logs_repair_id_idx" ON "email_logs" USING btree ("repair_id");