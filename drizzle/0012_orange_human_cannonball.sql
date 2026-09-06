ALTER TABLE "repairs" ADD COLUMN "tracking_token" text;--> statement-breakpoint
CREATE INDEX "repairs_tracking_token_idx" ON "repairs" USING btree ("tracking_token");--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_tracking_token_unique" UNIQUE("tracking_token");