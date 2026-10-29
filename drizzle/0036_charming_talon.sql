ALTER TABLE "repairs" ADD COLUMN "work_cycle_id" text;--> statement-breakpoint
ALTER TABLE "repair_approvals" ADD COLUMN "work_cycle_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "work_cycle_id" text;--> statement-breakpoint
CREATE INDEX "repairs_work_cycle_id_idx" ON "repairs" USING btree ("work_cycle_id");--> statement-breakpoint
CREATE INDEX "repair_approvals_work_cycle_id_idx" ON "repair_approvals" USING btree ("work_cycle_id");--> statement-breakpoint
CREATE INDEX "payments_work_cycle_id_idx" ON "payments" USING btree ("work_cycle_id");