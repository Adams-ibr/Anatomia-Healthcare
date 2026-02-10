import { db } from "./db";
import bcrypt from "bcrypt";
import {
  users,
  members,
  teamMembers,
  articles,
  faqItems,
  careers,
  courseCategories,
  courses,
  courseModules,
  lessons,
} from "../shared/schema";

const SALT_ROUNDS = 12;

async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    const hashedAdminPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
    const hashedMemberPassword = await bcrypt.hash("member123", SALT_ROUNDS);

    const existingAdmin = await db.select().from(users).limit(1);
    if (existingAdmin.length === 0) {
      console.log("Seeding admin users...");
      await db.insert(users).values([
        {
          email: "admin@anatomia.com",
          password: hashedAdminPassword,
          firstName: "Super",
          lastName: "Admin",
          role: "super_admin",
        },
        {
          email: "content@anatomia.com",
          password: hashedAdminPassword,
          firstName: "Content",
          lastName: "Manager",
          role: "content_admin",
        },
      ]);
    }

    const existingMembers = await db.select().from(members).limit(1);
    if (existingMembers.length === 0) {
      console.log("Seeding demo members...");
      await db.insert(members).values([
        {
          email: "student@demo.com",
          password: hashedMemberPassword,
          firstName: "Demo",
          lastName: "Student",
          membershipTier: "bronze",
        },
        {
          email: "premium@demo.com",
          password: hashedMemberPassword,
          firstName: "Premium",
          lastName: "User",
          membershipTier: "gold",
          membershipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      ]);
    }

    const existingTeam = await db.select().from(teamMembers).limit(1);
    if (existingTeam.length === 0) {
      console.log("Seeding team members...");
      await db.insert(teamMembers).values([
        {
          name: "Dr. Sarah Johnson",
          slug: "sarah-johnson",
          role: "Chief Medical Officer",
          description: "Leading anatomist with 15+ years of experience",
          bio: "Dr. Sarah Johnson is a distinguished anatomist and medical educator with over 15 years of experience in medical education. She received her MD from Johns Hopkins University and completed her residency at Mayo Clinic. Her passion for anatomy education led her to develop innovative 3D learning methodologies that have transformed how students learn complex anatomical concepts. She has published over 50 peer-reviewed papers and authored two textbooks on clinical anatomy.",
          imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
          email: "sarah.johnson@anatomia.com",
          linkedinUrl: "https://linkedin.com/in/sarahjohnson",
          twitterUrl: "https://twitter.com/drsarahjohnson",
          order: 1,
          isActive: true,
        },
        {
          name: "Prof. Michael Chen",
          slug: "michael-chen",
          role: "Head of Curriculum",
          description: "Expert in medical curriculum development",
          bio: "Professor Michael Chen brings two decades of expertise in medical curriculum development to Anatomia. With a PhD in Medical Education from Harvard University, he has revolutionized how anatomy is taught across medical schools globally. His research focuses on adaptive learning technologies and their application in medical education. He has trained over 10,000 medical students and continues to inspire the next generation of healthcare professionals.",
          imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
          email: "michael.chen@anatomia.com",
          linkedinUrl: "https://linkedin.com/in/michaelchen",
          order: 2,
          isActive: true,
        },
        {
          name: "Dr. Emily Rodriguez",
          slug: "emily-rodriguez",
          role: "Director of Research",
          description: "Pioneering researcher in anatomical sciences",
          bio: "Dr. Emily Rodriguez leads our research initiatives with a focus on integrating cutting-edge technology into anatomy education. Her groundbreaking work on virtual reality in medical training has been featured in Nature Medicine and The Lancet. She holds patents for several educational technologies and has secured over $5 million in research grants. Her vision drives our commitment to evidence-based educational innovation.",
          imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
          email: "emily.rodriguez@anatomia.com",
          linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
          twitterUrl: "https://twitter.com/dremilyrodriguez",
          facebookUrl: "https://facebook.com/dremilyrodriguez",
          order: 3,
          isActive: true,
        },
        {
          name: "Dr. David Okonkwo",
          slug: "david-okonkwo",
          role: "Clinical Advisor",
          description: "Practicing surgeon and anatomy expert",
          bio: "Dr. David Okonkwo is a practicing orthopedic surgeon who brings clinical relevance to our educational content. With 12 years of surgical experience and a passion for teaching, he ensures our courses prepare students for real-world clinical scenarios. He serves on the board of several medical education institutions and is a sought-after speaker at international medical conferences.",
          imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
          email: "david.okonkwo@anatomia.com",
          linkedinUrl: "https://linkedin.com/in/davidokonkwo",
          instagramUrl: "https://instagram.com/drdavidokonkwo",
          order: 4,
          isActive: true,
        },
      ]);
    }

    const existingCategories = await db.select().from(courseCategories).limit(1);
    let categoryMap: Record<string, string> = {};
    if (existingCategories.length === 0) {
      console.log("Seeding course categories...");
      const insertedCategories = await db.insert(courseCategories).values([
        { name: "Gross Anatomy", slug: "gross-anatomy", description: "Study of structures visible to the naked eye", iconName: "Bone", order: 1 },
        { name: "Neuroanatomy", slug: "neuroanatomy", description: "Anatomy of the nervous system", iconName: "Brain", order: 2 },
        { name: "Histology", slug: "histology", description: "Study of tissues at the microscopic level", iconName: "Microscope", order: 3 },
        { name: "Embryology", slug: "embryology", description: "Study of developmental anatomy", iconName: "Baby", order: 4 },
        { name: "Clinical Anatomy", slug: "clinical-anatomy", description: "Applied anatomy for clinical practice", iconName: "Stethoscope", order: 5 },
      ]).returning();
      
      insertedCategories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });
    }

    const existingCourses = await db.select().from(courses).limit(1);
    if (existingCourses.length === 0) {
      console.log("Seeding courses...");
      const insertedCourses = await db.insert(courses).values([
        {
          title: "Introduction to Human Anatomy",
          slug: "introduction-human-anatomy",
          description: "A comprehensive introduction to the fundamentals of human anatomy. This course covers the basic terminology, body systems overview, and foundational concepts essential for any medical student.",
          shortDescription: "Master the fundamentals of human anatomy",
          category: "Gross Anatomy",
          level: "beginner",
          duration: "8 weeks",
          isFree: true,
          isPublished: true,
          isFeatured: true,
          requiredMembershipTier: "bronze",
        },
        {
          title: "Upper Limb Anatomy",
          slug: "upper-limb-anatomy",
          description: "Detailed study of the bones, muscles, nerves, and blood vessels of the upper extremity. Includes clinical correlations and practical applications for physical examination.",
          shortDescription: "Complete upper extremity anatomy course",
          category: "Gross Anatomy",
          level: "intermediate",
          duration: "6 weeks",
          price: 4999,
          isFree: false,
          isPublished: true,
          isFeatured: true,
          requiredMembershipTier: "silver",
        },
        {
          title: "Neuroanatomy Essentials",
          slug: "neuroanatomy-essentials",
          description: "Explore the complex anatomy of the brain, spinal cord, and peripheral nervous system. Learn about neural pathways, cranial nerves, and clinical conditions affecting the nervous system.",
          shortDescription: "Master the anatomy of the nervous system",
          category: "Neuroanatomy",
          level: "advanced",
          duration: "10 weeks",
          price: 7999,
          isFree: false,
          isPublished: true,
          isFeatured: false,
          requiredMembershipTier: "gold",
        },
        {
          title: "Head and Neck Anatomy",
          slug: "head-neck-anatomy",
          description: "Comprehensive coverage of the anatomical structures of the head and neck region, including the skull, facial muscles, blood supply, and innervation patterns.",
          shortDescription: "Detailed head and neck anatomy study",
          category: "Gross Anatomy",
          level: "intermediate",
          duration: "8 weeks",
          price: 5999,
          isFree: false,
          isPublished: true,
          requiredMembershipTier: "silver",
        },
        {
          title: "Basic Histology",
          slug: "basic-histology",
          description: "Learn to identify and understand the microscopic structure of tissues and organs. Covers all major tissue types and organ systems at the cellular level.",
          shortDescription: "Microscopic anatomy fundamentals",
          category: "Histology",
          level: "beginner",
          duration: "6 weeks",
          isFree: true,
          isPublished: true,
          requiredMembershipTier: "bronze",
        },
      ]).returning();

      console.log("Seeding course modules and lessons...");
      for (const course of insertedCourses) {
        const moduleData = await db.insert(courseModules).values([
          { courseId: course.id, title: "Introduction", description: "Getting started with the course", order: 1 },
          { courseId: course.id, title: "Core Concepts", description: "Fundamental concepts and terminology", order: 2 },
          { courseId: course.id, title: "Practical Applications", description: "Real-world applications and case studies", order: 3 },
        ]).returning();

        for (const mod of moduleData) {
          await db.insert(lessons).values([
            { moduleId: mod.id, title: "Welcome and Overview", content: "Welcome to this course module. In this section, we will cover the learning objectives and course structure.", contentType: "text", order: 1, isFree: true },
            { moduleId: mod.id, title: "Key Terminology", content: "Understanding the essential terminology is crucial for mastering this subject area.", contentType: "text", order: 2 },
            { moduleId: mod.id, title: "Visual Learning", content: "Interactive 3D models and diagrams to enhance your understanding.", contentType: "interactive", order: 3 },
          ]);
        }
      }
    }

    const existingArticles = await db.select().from(articles).limit(1);
    if (existingArticles.length === 0) {
      console.log("Seeding blog articles...");
      await db.insert(articles).values([
        {
          title: "The Future of 3D Anatomy Learning",
          slug: "future-3d-anatomy-learning",
          excerpt: "Discover how 3D technology is revolutionizing medical education",
          content: "The integration of 3D technology in anatomy education represents a paradigm shift in how medical students learn. Traditional cadaver-based learning, while invaluable, has limitations in terms of accessibility, repeatability, and visualization of dynamic processes. 3D anatomy models offer unlimited exploration opportunities, allowing students to dissect virtual specimens multiple times, view structures from any angle, and understand spatial relationships in ways not possible with physical specimens.",
          category: "Technology",
          author: "Dr. Sarah Johnson",
          readTime: "5 min read",
          isFeatured: true,
          isPublished: true,
        },
        {
          title: "Essential Study Tips for Medical Students",
          slug: "study-tips-medical-students",
          excerpt: "Proven strategies to master complex anatomical concepts",
          content: "Medical education is demanding, but with the right strategies, you can excel. Start by understanding concepts rather than memorizing facts. Use spaced repetition for long-term retention. Create visual associations and mnemonics. Study in groups to benefit from peer teaching. Most importantly, apply what you learn through clinical correlations and case studies.",
          category: "Study Tips",
          author: "Prof. Michael Chen",
          readTime: "7 min read",
          isFeatured: false,
          isPublished: true,
        },
        {
          title: "Understanding the Brachial Plexus",
          slug: "understanding-brachial-plexus",
          excerpt: "A comprehensive guide to this complex nerve network",
          content: "The brachial plexus is one of the most complex anatomical structures, and understanding it is crucial for any healthcare professional. This nerve network, formed from the ventral rami of C5-T1, supplies the entire upper limb. In this article, we break down its organization into roots, trunks, divisions, cords, and branches using memory aids and clinical correlations.",
          category: "Anatomy",
          author: "Dr. David Okonkwo",
          readTime: "10 min read",
          isFeatured: true,
          isPublished: true,
        },
      ]);
    }

    const existingFaq = await db.select().from(faqItems).limit(1);
    if (existingFaq.length === 0) {
      console.log("Seeding FAQ items...");
      await db.insert(faqItems).values([
        { question: "How do I access the 3D anatomy models?", answer: "3D anatomy models are available in the Anatomy Viewer section. Simply navigate to the viewer and select the body system you want to explore. Premium members have access to detailed models with annotations.", category: "Features", order: 1 },
        { question: "What's included in each membership tier?", answer: "Bronze (Free): Basic courses and limited 3D models. Silver: All courses, full 3D library, and quizzes. Gold: Everything in Silver plus flashcards, practice mode, and certificates. Diamond: Full access including cadaveric videos and priority support.", category: "Pricing", order: 2 },
        { question: "Can I download course materials for offline use?", answer: "Yes, Gold and Diamond tier members can download course PDFs, flashcard decks, and quiz questions for offline study. Video content requires an internet connection.", category: "Features", order: 3 },
        { question: "How do certificates work?", answer: "Upon completing a course with a passing grade on all assessments, you'll receive a verifiable certificate with a unique ID. Certificates can be shared on LinkedIn and verified on our platform.", category: "Certificates", order: 4 },
        { question: "What payment methods do you accept?", answer: "We accept payments through Paystack and Flutterwave, which support credit/debit cards, bank transfers, and mobile money depending on your region.", category: "Payment", order: 5 },
      ]);
    }

    const existingCareers = await db.select().from(careers).limit(1);
    if (existingCareers.length === 0) {
      console.log("Seeding career listings...");
      await db.insert(careers).values([
        {
          title: "Medical Content Developer",
          department: "Education",
          location: "Remote",
          type: "Full-time",
          description: "We're looking for a medical professional to develop high-quality educational content for our anatomy courses.",
          requirements: "MD or equivalent medical degree, 3+ years teaching experience, excellent writing skills, familiarity with digital learning tools",
          isActive: true,
        },
        {
          title: "3D Artist - Medical Visualization",
          department: "Creative",
          location: "Hybrid",
          type: "Full-time",
          description: "Create stunning 3D anatomical models and visualizations for our learning platform.",
          requirements: "Proficiency in Blender, Maya, or ZBrush. Understanding of human anatomy. Portfolio demonstrating medical visualization work.",
          isActive: true,
        },
      ]);
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
