CREATE TYPE "public"."staff_invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('STAFF', 'TECHNICIAN');--> statement-breakpoint
CREATE TABLE "staff_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"token" text NOT NULL,
	"status" "staff_invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_invitations_shop_id_idx" ON "staff_invitations" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_invitations_token_idx" ON "staff_invitations" USING btree ("token");