ALTER TABLE "repair_approvals" ADD COLUMN "initial_estimated_cost" integer;--> statement-breakpoint
UPDATE "repair_approvals" AS ra
SET "initial_estimated_cost" = COALESCE(r."estimated_cost", ra."additional_estimated_cost", 0)
FROM "repairs" AS r
WHERE ra."repair_id" = r."id";--> statement-breakpoint
UPDATE "repair_approvals" AS ra
SET "additional_estimated_cost" = GREATEST(0, ra."additional_estimated_cost" - ra."initial_estimated_cost")
WHERE ra."initial_estimated_cost" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_approvals" ALTER COLUMN "initial_estimated_cost" SET NOT NULL;
