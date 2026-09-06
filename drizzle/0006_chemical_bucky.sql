CREATE TYPE "public"."device_condition" AS ENUM('GOOD', 'FAIR', 'POOR');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('PHONE', 'LAPTOP', 'TABLET', 'DESKTOP', 'OTHER');--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "device_type" "device_type" DEFAULT 'PHONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "condition" "device_condition" DEFAULT 'GOOD' NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "accessories" text;