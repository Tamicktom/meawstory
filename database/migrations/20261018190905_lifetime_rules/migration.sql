-- Lifetime rules from database/schema.md.
-- These checks cross tables, so they stay in triggers.

CREATE OR REPLACE FUNCTION enforce_rubric_retirement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM theme
      WHERE theme.rubric_id = NEW.id
        AND theme.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'A rubric can be retired only when no active theme points at it'
        USING ERRCODE = '23514', CONSTRAINT = 'rubric_retire_active_theme';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER rubric_retire_active_theme
BEFORE UPDATE OF deleted_at ON rubric
FOR EACH ROW
EXECUTE FUNCTION enforce_rubric_retirement();--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_theme_retirement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM text
      WHERE text.theme_id = NEW.id
        AND text.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'A theme can be retired only when no active text points at it'
        USING ERRCODE = '23514', CONSTRAINT = 'theme_retire_active_text';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER theme_retire_active_text
BEFORE UPDATE OF deleted_at ON theme
FOR EACH ROW
EXECUTE FUNCTION enforce_theme_retirement();--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_theme_active_rubric()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.rubric_id IS NOT DISTINCT FROM OLD.rubric_id THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM rubric
    WHERE rubric.id = NEW.rubric_id
      AND rubric.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'A theme must point at an active rubric'
      USING ERRCODE = '23514', CONSTRAINT = 'theme_active_rubric';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER theme_active_rubric
BEFORE INSERT OR UPDATE OF rubric_id ON theme
FOR EACH ROW
EXECUTE FUNCTION enforce_theme_active_rubric();--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_text_active_theme()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.theme_id IS NOT DISTINCT FROM OLD.theme_id THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM theme
    WHERE theme.id = NEW.theme_id
      AND theme.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'A text must point at an active theme'
      USING ERRCODE = '23514', CONSTRAINT = 'text_active_theme';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER text_active_theme
BEFORE INSERT OR UPDATE OF theme_id ON text
FOR EACH ROW
EXECUTE FUNCTION enforce_text_active_theme();--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_correction_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_text_content text;
  current_rubric_content text;
BEGIN
  SELECT text.content
  INTO current_text_content
  FROM text
  WHERE text.id = NEW.text_id
    AND text.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A correction must point at an active text'
      USING ERRCODE = '23514', CONSTRAINT = 'correction_active_text';
  END IF;

  SELECT rubric.content
  INTO current_rubric_content
  FROM rubric
  WHERE rubric.id = NEW.rubric_id
    AND rubric.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A correction must point at an active rubric'
      USING ERRCODE = '23514', CONSTRAINT = 'correction_active_rubric';
  END IF;

  IF NEW.text_content IS DISTINCT FROM current_text_content
     OR NEW.rubric_content IS DISTINCT FROM current_rubric_content THEN
    RAISE EXCEPTION 'A correction must freeze the current text and rubric bodies'
      USING ERRCODE = '23514', CONSTRAINT = 'correction_frozen_bodies';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER correction_freeze_on_insert
BEFORE INSERT ON correction
FOR EACH ROW
EXECUTE FUNCTION enforce_correction_insert();
