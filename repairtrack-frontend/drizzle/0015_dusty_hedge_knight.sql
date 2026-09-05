CREATE TYPE "public"."repair_assignment_status" AS ENUM('ACTIVE', 'ON_HOLD', 'REASSIGNED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "repair_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" text NOT NULL,
	"repair_id" text NOT NULL,
	"technician_id" text NOT NULL,
	"status" "repair_assignment_status" DEFAULT 'ACTIVE' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"held_at" timestamp with time zone,
	"held_reason" text,
	"reassigned_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repair_assignments" ADD CONSTRAINT "repair_assignments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_assignments" ADD CONSTRAINT "repair_assignments_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_assignments" ADD CONSTRAINT "repair_assignments_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_assignments" ADD CONSTRAINT "repair_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repair_assignments_shop_id_idx" ON "repair_assignments" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "repair_assignments_repair_id_idx" ON "repair_assignments" USING btree ("repair_id");--> statement-breakpoint
CREATE INDEX "repair_assignments_technician_id_status_idx" ON "repair_assignments" USING btree ("technician_id","status");--> statement-breakpoint
INSERT INTO "repair_assignments" ("shop_id", "repair_id", "technician_id", "status", "assigned_at", "created_by", "created_at", "updated_at")
SELECT
	r."shop_id",
	r."id",
	r."assigned_technician_id",
	'ACTIVE',
	COALESCE(r."created_at", now()),
	COALESCE(r."created_by", r."assigned_technician_id"),
	now(),
	now()
FROM "repairs" AS r
WHERE r."assigned_technician_id" IS NOT NULL
	AND r."status" NOT IN ('COMPLETED', 'CANCELLED')
	AND NOT EXISTS (
		SELECT 1 FROM "repair_assignments" AS ra
		WHERE ra."repair_id" = r."id" AND ra."status" = 'ACTIVE'
	);
