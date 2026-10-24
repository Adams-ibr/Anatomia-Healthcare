-- Let instructors manage the curriculum belonging to their own courses.
-- Admins keep access across every course.

grant select, insert, update, delete on public.course_sections, public.lessons,
  public.course_objectives, public.course_requirements, public.course_faqs,
  public.assessments, public.assessment_questions to authenticated;

drop policy if exists "Course owners manage sections" on public.course_sections;
create policy "Course owners manage sections" on public.course_sections
  for all to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_sections.course_id
        and (c.instructor_id = auth.uid() or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
        ))
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_sections.course_id
        and (c.instructor_id = auth.uid() or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
        ))
    )
  );

drop policy if exists "Course owners manage lessons" on public.lessons;
create policy "Course owners manage lessons" on public.lessons
  for all to authenticated
  using (
    exists (
      select 1 from public.course_sections s
      join public.courses c on c.id = s.course_id
      where s.id = lessons.section_id
        and (c.instructor_id = auth.uid() or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
        ))
    )
  )
  with check (
    exists (
      select 1 from public.course_sections s
      join public.courses c on c.id = s.course_id
      where s.id = lessons.section_id
        and (c.instructor_id = auth.uid() or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
        ))
    )
  );

drop policy if exists "Course owners manage objectives" on public.course_objectives;
create policy "Course owners manage objectives" on public.course_objectives
  for all to authenticated using (
    exists (select 1 from public.courses c where c.id = course_objectives.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  ) with check (
    exists (select 1 from public.courses c where c.id = course_objectives.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  );

drop policy if exists "Course owners manage requirements" on public.course_requirements;
create policy "Course owners manage requirements" on public.course_requirements
  for all to authenticated using (
    exists (select 1 from public.courses c where c.id = course_requirements.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  ) with check (
    exists (select 1 from public.courses c where c.id = course_requirements.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  );

drop policy if exists "Course owners manage FAQs" on public.course_faqs;
create policy "Course owners manage FAQs" on public.course_faqs
  for all to authenticated using (
    exists (select 1 from public.courses c where c.id = course_faqs.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  ) with check (
    exists (select 1 from public.courses c where c.id = course_faqs.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  );

drop policy if exists "Course owners manage assessments" on public.assessments;
create policy "Course owners manage assessments" on public.assessments
  for all to authenticated using (
    exists (select 1 from public.courses c where c.id = assessments.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  ) with check (
    exists (select 1 from public.courses c where c.id = assessments.course_id and (
      c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ))
  );

drop policy if exists "Course owners manage assessment questions" on public.assessment_questions;
create policy "Course owners manage assessment questions" on public.assessment_questions
  for all to authenticated using (
    exists (
      select 1 from public.assessments a join public.courses c on c.id = a.course_id
      where a.id = assessment_questions.assessment_id and (
        c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
      )
    )
  ) with check (
    exists (
      select 1 from public.assessments a join public.courses c on c.id = a.course_id
      where a.id = assessment_questions.assessment_id and (
        c.instructor_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
      )
    )
  );
