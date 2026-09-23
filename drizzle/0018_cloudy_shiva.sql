CREATE TABLE "inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"purchase_price" integer NOT NULL,
	"selling_price" integer NOT NULL,
	"supplier" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_shop_id_idx" ON "inventory" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_shop_id_sku_idx" ON "inventory" USING btree ("shop_id","sku");