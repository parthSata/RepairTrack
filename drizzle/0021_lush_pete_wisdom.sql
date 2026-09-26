ALTER TABLE "repairs" ADD COLUMN "labor_charges" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "additional_charges" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "tax_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "estimated_total" integer;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "final_total" integer;