CREATE TYPE "public"."repair_status" AS ENUM('RECEIVED', 'DIAGNOSING', 'WAITING_FOR_APPROVAL', 'APPROVED', 'WAITING_FOR_PARTS', 'IN_REPAIR', 'QUALITY_CHECK', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"serial_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repairs" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"device_id" text NOT NULL,
	"ticket_number" text NOT NULL,
	"status" "repair_status" DEFAULT 'RECEIVED' NOT NULL,
	"issue_description" text,
	"estimated_cost" integer,
	"final_cost" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repairs_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_shop_id_idx" ON "customers" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_shop_id_phone_idx" ON "customers" USING btree ("shop_id","phone");--> statement-breakpoint
CREATE INDEX "devices_shop_id_idx" ON "devices" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "devices_customer_id_idx" ON "devices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "repairs_shop_id_idx" ON "repairs" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "repairs_customer_id_idx" ON "repairs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "repairs_status_idx" ON "repairs" USING btree ("status");