CREATE TABLE "operation_alert" (
	"kind" text PRIMARY KEY,
	"last_sent_at" timestamp NOT NULL,
	"detail" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_call" (
	"id" text PRIMARY KEY,
	"correction_id" text NOT NULL,
	"kind" text DEFAULT 'reading' NOT NULL,
	"sequence" integer NOT NULL,
	"outcome" text NOT NULL,
	"rejection" text,
	"detail" text,
	"discarded_quotes" integer DEFAULT 0 NOT NULL,
	"model_id" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_tokens" integer,
	"cached_input_tokens" integer,
	"output_tokens" integer,
	"reasoning_tokens" integer,
	"price" jsonb,
	"cost_usd" numeric(12,8),
	"started_at" timestamp NOT NULL,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_call_outcome" CHECK ("outcome" IN ('accepted', 'rejected', 'error')),
	CONSTRAINT "reading_call_kind" CHECK ("kind" IN ('reading'))
);
--> statement-breakpoint
ALTER TABLE "correction" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "correction" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "correction" ADD COLUMN "failure_stage" text;--> statement-breakpoint
ALTER TABLE "correction" ADD COLUMN "failure_reason" text;--> statement-breakpoint
CREATE INDEX "correction_createdAt_idx" ON "correction" ("created_at");--> statement-breakpoint
CREATE INDEX "reading_call_correctionId_idx" ON "reading_call" ("correction_id");--> statement-breakpoint
CREATE INDEX "reading_call_startedAt_idx" ON "reading_call" ("started_at");--> statement-breakpoint
ALTER TABLE "reading_call" ADD CONSTRAINT "reading_call_correction_id_correction_id_fkey" FOREIGN KEY ("correction_id") REFERENCES "correction"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "correction" ADD CONSTRAINT "correction_failure_stage" CHECK ("failure_stage" IS NULL OR "failure_stage" IN ('dispatch', 'queue_timeout', 'processing_timeout', 'admission', 'grading', 'validation', 'saving'));
--> statement-breakpoint
-- Phase 1-C: monitoring fields freeze with the terminal result.
CREATE OR REPLACE FUNCTION enforce_reading_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_criteria jsonb; current_source jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT criteria INTO current_criteria FROM rubric WHERE id = NEW.rubric_id;
    SELECT jsonb_build_object('themeTitle', theme.title, 'themeDescription', theme.description, 'rubricTitle', rubric.title)
      INTO current_source FROM text JOIN theme ON theme.id = text.theme_id JOIN rubric ON rubric.id = NEW.rubric_id WHERE text.id = NEW.text_id;
    IF (NEW.rubric_criteria IS NOT NULL AND NEW.rubric_criteria IS DISTINCT FROM current_criteria)
      OR (NEW.source IS NOT NULL AND NEW.source IS DISTINCT FROM current_source) THEN
      RAISE EXCEPTION 'Reading must freeze current criteria and source' USING ERRCODE = '23514', CONSTRAINT = 'correction_frozen_source';
    END IF;
    NEW.rubric_criteria := current_criteria; NEW.source := current_source;
  ELSE
    IF ROW(NEW.text_id, NEW.text_content, NEW.rubric_id, NEW.rubric_content, NEW.rubric_criteria, NEW.source, NEW.model_id, NEW.prompt_version, NEW.prompt_config)
      IS DISTINCT FROM ROW(OLD.text_id, OLD.text_content, OLD.rubric_id, OLD.rubric_content, OLD.rubric_criteria, OLD.source, OLD.model_id, OLD.prompt_version, OLD.prompt_config) THEN
      RAISE EXCEPTION 'Reading snapshot is immutable' USING ERRCODE = '23514', CONSTRAINT = 'correction_immutable_snapshot';
    END IF;
    IF OLD.status IN ('COMPLETED','FAILED') AND ROW(NEW.status, NEW.content, NEW.score, NEW.structured_result, NEW.started_at, NEW.finished_at, NEW.failure_stage, NEW.failure_reason) IS DISTINCT FROM ROW(OLD.status, OLD.content, OLD.score, OLD.structured_result, OLD.started_at, OLD.finished_at, OLD.failure_stage, OLD.failure_reason) THEN
      RAISE EXCEPTION 'Terminal reading is immutable' USING ERRCODE = '23514', CONSTRAINT = 'correction_immutable_result';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
--> statement-breakpoint
-- Phase 1-C: every criterion carries one or two quotations from the scene.
CREATE OR REPLACE FUNCTION valid_structured_reading(result jsonb, criteria jsonb, total numeric)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE entry jsonb; c jsonb; b jsonb; points numeric; sum_score numeric := 0; ids text[] := '{}'; item jsonb; k text;
BEGIN
  IF result IS NULL THEN RETURN true; END IF;
  IF criteria IS NULL OR NOT valid_rubric_criteria(criteria) OR result->'version' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(result->'criteria') IS DISTINCT FROM 'array' OR jsonb_array_length(result->'criteria') <> 5 THEN RETURN false; END IF;
  FOREACH k IN ARRAY ARRAY['opening','revision'] LOOP
    IF jsonb_typeof(result->k) IS DISTINCT FROM 'string' OR length(trim(result->>k)) = 0 THEN RETURN false; END IF;
  END LOOP;
  FOREACH k IN ARRAY ARRAY['description','evidence'] LOOP
    IF jsonb_typeof(result->'highlight'->k) IS DISTINCT FROM 'string' OR length(trim(result->'highlight'->>k)) = 0 THEN RETURN false; END IF;
  END LOOP;
  FOR entry IN SELECT value FROM jsonb_array_elements(result->'criteria') LOOP
    IF coalesce(entry->>'id','') = '' OR entry->>'id' = ANY(ids) OR jsonb_typeof(entry->'score') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    SELECT value INTO c FROM jsonb_array_elements(criteria) WHERE value->>'id' = entry->>'id';
    SELECT value INTO b FROM jsonb_array_elements(c->'bands') WHERE value->>'id' = entry->>'band';
    points := (entry->>'score')::numeric;
    IF c IS NULL OR b IS NULL OR points < 0 OR (b->>'id' <> 'missing' AND points <= (b->>'min')::numeric - 1) OR points > (b->>'max')::numeric OR points <> round(points, 2) THEN RETURN false; END IF;
    FOREACH k IN ARRAY ARRAY['strengths','gaps'] LOOP
      IF jsonb_typeof(entry->k) IS DISTINCT FROM 'string' OR length(trim(entry->>k)) = 0 THEN RETURN false; END IF;
    END LOOP;
    IF jsonb_typeof(entry->'evidence') IS DISTINCT FROM 'array' OR jsonb_array_length(entry->'evidence') NOT BETWEEN 1 AND 2 THEN RETURN false; END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(entry->'evidence') LOOP
      IF jsonb_typeof(item) <> 'string' OR length(trim(item #>> '{}')) = 0 THEN RETURN false; END IF;
    END LOOP;
    ids := array_append(ids, entry->>'id'); sum_score := sum_score + points;
  END LOOP;
  RETURN sum_score = total;
EXCEPTION WHEN OTHERS THEN RETURN false;
END; $$;
--> statement-breakpoint
-- Phase 1-C: every stored quotation is a literal stretch of the frozen scene.
CREATE OR REPLACE FUNCTION structured_evidence_in_scene(result jsonb, scene text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE quote text;
BEGIN
  IF result IS NULL THEN RETURN true; END IF;
  IF position((result->'highlight'->>'evidence') IN scene) = 0 THEN RETURN false; END IF;
  FOR quote IN SELECT jsonb_array_elements_text(entry->'evidence') FROM jsonb_array_elements(result->'criteria') AS entry LOOP
    IF position(quote IN scene) = 0 THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END; $$;
--> statement-breakpoint
ALTER TABLE correction ADD CONSTRAINT correction_evidence_in_scene CHECK (structured_evidence_in_scene(structured_result, text_content));
