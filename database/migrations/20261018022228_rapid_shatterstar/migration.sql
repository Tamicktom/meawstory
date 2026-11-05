CREATE TYPE "correction_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "correction" (
	"id" text PRIMARY KEY,
	"content" text NOT NULL,
	"score" numeric(6,2) NOT NULL,
	"text_content" text NOT NULL,
	"rubric_id" text NOT NULL,
	"rubric_content" text NOT NULL,
	"text_id" text NOT NULL,
	"status" "correction_status" DEFAULT 'PENDING'::"correction_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "correction_score_range" CHECK ("score" >= 0 AND "score" <= 1000)
);
--> statement-breakpoint
CREATE TABLE "rubric" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"theme_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "theme" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"rubric_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "correction_textId_idx" ON "correction" ("text_id");--> statement-breakpoint
CREATE INDEX "correction_rubricId_idx" ON "correction" ("rubric_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "text_themeId_idx" ON "text" ("theme_id");--> statement-breakpoint
CREATE INDEX "text_userId_idx" ON "text" ("user_id");--> statement-breakpoint
CREATE INDEX "theme_rubricId_idx" ON "theme" ("rubric_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "correction" ADD CONSTRAINT "correction_rubric_id_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubric"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "correction" ADD CONSTRAINT "correction_text_id_text_id_fkey" FOREIGN KEY ("text_id") REFERENCES "text"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "text" ADD CONSTRAINT "text_theme_id_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "theme"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "text" ADD CONSTRAINT "text_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "theme" ADD CONSTRAINT "theme_rubric_id_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubric"("id") ON DELETE RESTRICT;