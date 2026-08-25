/**
 * Seed script to populate database with course content from sample data
 * This script will add sections and lessons to courses in the database
 * 
 * Run with: npx tsx scripts/seed-courses.ts
 */

import { createClient } from '@supabase/supabase-js'
import { COURSES } from '../src/lib/data'

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  console.error('Please set them in your .env.local file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function seedCourses() {
  console.log('🌱 Starting course content seeding...\n')

  let coursesSeeded = 0
  let sectionsAdded = 0
  let lessonsAdded = 0

  for (const course of COURSES) {
    console.log(`📚 Processing: ${course.title}`)

    // Check if course exists in database by slug
    const { data: dbCourse, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', course.slug)
      .maybeSingle()

    if (courseError) {
      console.error(`  ⚠️  Error checking course: ${courseError.message}`)
      continue
    }

    if (!dbCourse) {
      console.log(`  ⏭️  Course not found in database, skipping`)
      continue
    }

    const courseId = dbCourse.id

    // Delete existing sections/lessons for this course to avoid duplicates
    const { error: deleteError } = await supabase
      .from('course_sections')
      .delete()
      .eq('course_id', courseId)

    if (deleteError) {
      console.error(`  ⚠️  Error deleting existing sections: ${deleteError.message}`)
    }

    // Add sections and lessons
    if (course.sections && course.sections.length > 0) {
      for (let sectionIndex = 0; sectionIndex < course.sections.length; sectionIndex++) {
        const section = course.sections[sectionIndex]

        // Insert section
        const { data: newSection, error: sectionError } = await supabase
          .from('course_sections')
          .insert({
            course_id: courseId,
            title: section.title,
            position: sectionIndex
          })
          .select('id')
          .single()

        if (sectionError) {
          console.error(`  ⚠️  Error creating section "${section.title}": ${sectionError.message}`)
          continue
        }

        sectionsAdded++
        const sectionId = newSection.id

        // Insert lessons
        if (section.lessons && section.lessons.length > 0) {
          for (let lessonIndex = 0; lessonIndex < section.lessons.length; lessonIndex++) {
            const lesson = section.lessons[lessonIndex]

            const { error: lessonError } = await supabase
              .from('lessons')
              .insert({
                section_id: sectionId,
                title: lesson.title,
                type: lesson.type,
                duration: lesson.duration || 0,
                content: lesson.content || 'Sample content for this lesson.',
                video_url: lesson.videoUrl || null,
                resource_url: lesson.resourceUrl || null,
                position: lessonIndex
              })

            if (lessonError) {
              console.error(`    ⚠️  Error creating lesson "${lesson.title}": ${lessonError.message}`)
            } else {
              lessonsAdded++
            }
          }
        }
      }
    }

    // Add objectives
    if (course.objectives && course.objectives.length > 0) {
      for (let i = 0; i < course.objectives.length; i++) {
        const obj = course.objectives[i]
        await supabase.from('course_objectives').insert({
          course_id: courseId,
          text: obj.text,
          position: i
        })
      }
    }

    // Add requirements
    if (course.requirements && course.requirements.length > 0) {
      for (let i = 0; i < course.requirements.length; i++) {
        const req = course.requirements[i]
        await supabase.from('course_requirements').insert({
          course_id: courseId,
          text: req.text,
          position: i
        })
      }
    }

    // Add FAQs
    if (course.faqs && course.faqs.length > 0) {
      for (const faq of course.faqs) {
        await supabase.from('course_faqs').insert({
          course_id: courseId,
          question: faq.q,
          answer: faq.a
        })
      }
    }

    coursesSeeded++
    console.log(`  ✅ Added ${course.sections?.length || 0} sections with lessons\n`)
  }

  console.log('✨ Seeding complete!')
  console.log(`📊 Summary:`)
  console.log(`   - Courses processed: ${coursesSeeded}`)
  console.log(`   - Sections added: ${sectionsAdded}`)
  console.log(`   - Lessons added: ${lessonsAdded}`)
}

seedCourses()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
