ALTER TABLE "devices" ALTER COLUMN "model" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "model_verified" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "model_verification_overridden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "model_verification_note" text;