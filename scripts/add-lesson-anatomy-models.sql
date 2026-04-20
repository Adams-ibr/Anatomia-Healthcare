CREATE TABLE lesson_anatomy_models (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   VARCHAR REFERENCES lessons(id) ON DELETE CASCADE,
  module_id   VARCHAR REFERENCES course_modules(id) ON DELETE CASCADE,
  model_id    VARCHAR NOT NULL REFERENCES anatomy_models(id) ON DELETE CASCADE,
  "order"     INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  CONSTRAINT lesson_or_module CHECK (
    (lesson_id IS NOT NULL AND module_id IS NULL) OR
    (lesson_id IS NULL AND module_id IS NOT NULL)
  )
);
