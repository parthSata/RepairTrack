CREATE TYPE "public"."repair_photo_type" AS ENUM('BEFORE', 'AFTER');--> statement-breakpoint
CREATE TABLE "repair_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"repair_id" text NOT NULL,
	"type" "repair_photo_type" NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "customer_photos_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_photos" ADD CONSTRAINT "repair_photos_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_photos" ADD CONSTRAINT "repair_photos_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_photos" ADD CONSTRAINT "repair_photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repair_photos_shop_id_idx" ON "repair_photos" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "repair_photos_repair_id_idx" ON "repair_photos" USING btree ("repair_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repair_photos_repair_id_type_uidx" ON "repair_photos" USING btree ("repair_id","type");