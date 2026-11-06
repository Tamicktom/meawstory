CREATE TABLE "reading_disagreement" (
	"correction_id" text,
	"criterion_id" text,
	"reason" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_disagreement_pkey" PRIMARY KEY("correction_id","criterion_id"),
	CONSTRAINT "reading_disagreement_reason_length" CHECK (length("reason") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "reading_feedback" (
	"correction_id" text PRIMARY KEY,
	"usefulness" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_feedback_choice" CHECK ("usefulness" IN ('yes', 'partly', 'no'))
);
--> statement-breakpoint
ALTER TABLE "reading_disagreement" ADD CONSTRAINT "reading_disagreement_correction_id_correction_id_fkey" FOREIGN KEY ("correction_id") REFERENCES "correction"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reading_feedback" ADD CONSTRAINT "reading_feedback_correction_id_correction_id_fkey" FOREIGN KEY ("correction_id") REFERENCES "correction"("id") ON DELETE CASCADE;