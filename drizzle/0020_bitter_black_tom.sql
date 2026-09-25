CREATE TYPE "public"."stock_movement_reason" AS ENUM('PURCHASE', 'RETURN', 'DAMAGED', 'LOST', 'CORRECTION', 'REPAIR_USAGE', 'REPAIR_REVERSAL');--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"inventory_id" text NOT NULL,
	"delta" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"reason" "stock_movement_reason" NOT NULL,
	"note" text,
	"repair_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_parts" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"repair_id" text NOT NULL,
	"inventory_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_selling_price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_movements_shop_id_idx" ON "stock_movements" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "stock_movements_inventory_id_idx" ON "stock_movements" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "stock_movements_inventory_id_created_at_idx" ON "stock_movements" USING btree ("inventory_id","created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_repair_id_idx" ON "stock_movements" USING btree ("repair_id");--> statement-breakpoint
CREATE INDEX "repair_parts_shop_id_idx" ON "repair_parts" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "repair_parts_repair_id_idx" ON "repair_parts" USING btree ("repair_id");--> statement-breakpoint
CREATE INDEX "repair_parts_inventory_id_idx" ON "repair_parts" USING btree ("inventory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repair_parts_repair_id_inventory_id_uidx" ON "repair_parts" USING btree ("repair_id","inventory_id");