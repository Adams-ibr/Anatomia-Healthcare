-- Base categories for the Hama Academy catalog.
-- Idempotent: unique slug prevents duplicates.
insert into public.categories (slug, name, description, icon, color, course_count)
values
  ('cybersecurity', 'Cybersecurity', 'Defensive and offensive security skills for the modern enterprise.', 'Shield', '#1B4E9B', 0),
  ('programming', 'Programming', 'Languages, frameworks, and software craftsmanship.', 'Code2', '#123564', 0),
  ('data-science', 'Data Science', 'Analytics, machine learning, and data storytelling.', 'BarChart3', '#4F7FBE', 0),
  ('cloud-engineering', 'Cloud Engineering', 'Architecture, DevOps, and infrastructure at scale.', 'Cloud', '#16417F', 0),
  ('business', 'Business', 'Strategy, operations, and leadership fundamentals.', 'Briefcase', '#0E294E', 0),
  ('design', 'Design', 'Product, UX, and visual communication.', 'Palette', '#8AADD9', 0),
  ('finance', 'Finance', 'Markets, investing, and financial modeling.', 'TrendingUp', '#5B6472', 0),
  ('personal-development', 'Personal Development', 'Productivity, communication, and career growth.', 'Sparkles', '#B7791F', 0)
on conflict (slug) do nothing;

-- Verify
select slug, name from public.categories order by name;