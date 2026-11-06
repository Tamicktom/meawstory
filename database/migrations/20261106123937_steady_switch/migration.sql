ALTER TABLE "correction" ADD COLUMN "revision_intent" text;--> statement-breakpoint
ALTER TABLE "text" ADD COLUMN "revision_intent" text;--> statement-breakpoint
ALTER TABLE "correction" ADD CONSTRAINT "correction_revision_intent_length" CHECK ("revision_intent" IS NULL OR length("revision_intent") <= 2000);--> statement-breakpoint
ALTER TABLE "text" ADD CONSTRAINT "text_revision_intent_length" CHECK ("revision_intent" IS NULL OR length("revision_intent") <= 2000);
--> statement-breakpoint
-- Phase 1-G: the revision intention freezes with the reading snapshot.
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
    IF ROW(NEW.text_id, NEW.text_content, NEW.rubric_id, NEW.rubric_content, NEW.rubric_criteria, NEW.source, NEW.model_id, NEW.prompt_version, NEW.prompt_config, NEW.revision_intent)
      IS DISTINCT FROM ROW(OLD.text_id, OLD.text_content, OLD.rubric_id, OLD.rubric_content, OLD.rubric_criteria, OLD.source, OLD.model_id, OLD.prompt_version, OLD.prompt_config, OLD.revision_intent) THEN
      RAISE EXCEPTION 'Reading snapshot is immutable' USING ERRCODE = '23514', CONSTRAINT = 'correction_immutable_snapshot';
    END IF;
    IF OLD.status IN ('COMPLETED','FAILED') AND ROW(NEW.status, NEW.content, NEW.score, NEW.structured_result, NEW.started_at, NEW.finished_at, NEW.failure_stage, NEW.failure_reason) IS DISTINCT FROM ROW(OLD.status, OLD.content, OLD.score, OLD.structured_result, OLD.started_at, OLD.finished_at, OLD.failure_stage, OLD.failure_reason) THEN
      RAISE EXCEPTION 'Terminal reading is immutable' USING ERRCODE = '23514', CONSTRAINT = 'correction_immutable_result';
    END IF;
  END IF;
  RETURN NEW;
END; $$;