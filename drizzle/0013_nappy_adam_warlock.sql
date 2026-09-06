CREATE TYPE "public"."repair_status_history_actor_type" AS ENUM('STAFF', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."repair_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "repair_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_id" text NOT NULL,
	"status" "repair_approval_status" NOT NULL,
	"additional_estimated_cost" integer NOT NULL,
	"diagnosis_snapshot" text NOT NULL,
	"requested_by" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repair_status_history" DROP CONSTRAINT "repair_status_history_changed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "repair_status_history" ALTER COLUMN "changed_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD COLUMN "actor_type" "repair_status_history_actor_type" DEFAULT 'STAFF' NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_approvals" ADD CONSTRAINT "repair_approvals_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_approvals" ADD CONSTRAINT "repair_approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repair_approvals_repair_id_idx" ON "repair_approvals" USING btree ("repair_id");--> statement-breakpoint
CREATE INDEX "repair_approvals_repair_id_requested_at_idx" ON "repair_approvals" USING btree ("repair_id","requested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "repair_approvals_one_pending_per_repair_idx" ON "repair_approvals" USING btree ("repair_id") WHERE "repair_approvals"."status" = 'PENDING';--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;