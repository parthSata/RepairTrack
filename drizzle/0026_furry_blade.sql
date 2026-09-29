CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('ADVANCE', 'PAYMENT');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"repair_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"amount" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"type" "payment_type" NOT NULL,
	"reference" text,
	"note" text,
	"received_by" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_shop_id_idx" ON "payments" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "payments_repair_id_idx" ON "payments" USING btree ("repair_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");