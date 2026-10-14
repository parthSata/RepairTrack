CREATE TABLE "pending_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"owner_name" text NOT NULL,
	"shop_name" text NOT NULL,
	"password_encrypted" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"processing_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_registrations_email_unique" UNIQUE("email"),
	CONSTRAINT "pending_registrations_token_hash_unique" UNIQUE("token_hash")
);
