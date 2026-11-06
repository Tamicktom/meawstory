ALTER TABLE "correction" ADD COLUMN "comparison" jsonb;--> statement-breakpoint
ALTER TABLE "correction" ADD CONSTRAINT "correction_comparison_when_completed" CHECK ("comparison" IS NULL OR "status" = 'COMPLETED');--> statement-breakpoint
ALTER TABLE "reading_call" DROP CONSTRAINT "reading_call_kind", ADD CONSTRAINT "reading_call_kind" CHECK ("kind" IN ('reading', 'comparison'));
--> statement-breakpoint
-- Phase 1-H: the comparison is a frozen result of two completed readings.
CREATE OR REPLACE FUNCTION valid_version_comparison(comparison jsonb, scene text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE entry jsonb; status text; unchanged boolean;
BEGIN
  IF comparison IS NULL THEN RETURN true; END IF;
  IF comparison->>'version' IS DISTINCT FROM '1' THEN RETURN false; END IF;
  IF jsonb_typeof(comparison->'textUnchanged') IS DISTINCT FROM 'boolean' THEN RETURN false; END IF;
  unchanged := (comparison->>'textUnchanged')::boolean;
  IF coalesce(comparison->>'previousCorrectionId', '') = '' THEN RETURN false; END IF;
  status := comparison->'focus'->>'status';
  IF status IS NULL OR status NOT IN ('met', 'unmet', 'unchanged', 'unavailable') THEN RETURN false; END IF;
  IF unchanged IS DISTINCT FROM (status = 'unchanged') THEN RETURN false; END IF;
  IF status IN ('met', 'unmet') THEN
    IF length(trim(coalesce(comparison->'focus'->>'answer', ''))) = 0
      OR length(comparison->'focus'->>'answer') > 400 THEN RETURN false; END IF;
    IF coalesce(comparison->'focus'->>'evidence', '') = ''
      OR position((comparison->'focus'->>'evidence') IN scene) = 0 THEN RETURN false; END IF;
  END IF;
  IF jsonb_typeof(comparison->'criteria') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(comparison->'criteria') LOOP
    IF coalesce(entry->>'id', '') = '' THEN RETURN false; END IF;
    IF entry->>'movement' NOT IN ('improved', 'regressed', 'unchanged') THEN RETURN false; END IF;
    IF entry->>'previousBand' NOT IN ('missing', 'thin', 'working', 'strong') THEN RETURN false; END IF;
    IF entry->>'band' NOT IN ('missing', 'thin', 'working', 'strong') THEN RETURN false; END IF;
    IF jsonb_typeof(entry->'previousScore') IS DISTINCT FROM 'number'
      OR jsonb_typeof(entry->'score') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    IF unchanged AND entry->>'movement' IS DISTINCT FROM 'unchanged' THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END; $$;
--> statement-breakpoint
ALTER TABLE "correction" ADD CONSTRAINT "correction_comparison_shape" CHECK (valid_version_comparison("comparison", "text_content"));
--> statement-breakpoint
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
    IF OLD.status IN ('COMPLETED','FAILED') AND NEW.comparison IS DISTINCT FROM OLD.comparison THEN
      RAISE EXCEPTION 'Reading comparison is immutable' USING ERRCODE = '23514', CONSTRAINT = 'correction_immutable_comparison';
    END IF;
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