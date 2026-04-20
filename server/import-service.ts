import { supabase, toSnakeCase } from "./db";
import {
  QuizQuestion,
  FlashcardDeck,
  Flashcard,
  LessonAnatomyModel,
} from "../shared/schema";

// ─── Result types ────────────────────────────────────────────────────────────

export interface ImportQuestionsResult {
  created: QuizQuestion[];
  duplicateWarnings: string[];
}

export interface ImportFlashcardDecksResult {
  created: FlashcardDeck[];
  duplicateWarnings: string[];
}

export interface ImportFlashcardsResult {
  created: Flashcard[];
  duplicateWarnings: string[];
}

export interface ImportModelsResult {
  created: LessonAnatomyModel[];
  duplicateWarnings: string[];
}

// ─── ImportService ────────────────────────────────────────────────────────────

export class ImportService {
  /**
   * Import question bank items into a quiz.
   * - Copies question + options as new quiz_question + quiz_options records.
   * - Detects duplicates by comparing question text against existing quiz questions.
   * - Assigns sequential order values after the current max.
   * - Returns a warning for questions that have no options (Req 3.4).
   *
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.4
   */
  async importQuestionsToQuiz(
    quizId: string,
    questionIds: string[]
  ): Promise<ImportQuestionsResult> {
    // 1. Fetch source question_bank items
    const { data: sourceQuestions, error: srcErr } = await supabase
      .from("question_bank")
      .select(
        "id, question, questionType:question_type, explanation, points"
      )
      .in("id", questionIds);

    if (srcErr) throw srcErr;

    // 2. Validate all requested IDs exist
    const foundIds = new Set((sourceQuestions ?? []).map((q: any) => q.id));
    const invalidIds = questionIds.filter((id) => !foundIds.has(id));
    if (invalidIds.length > 0) {
      const err: any = new Error("Invalid IDs");
      err.status = 422;
      err.invalidIds = invalidIds;
      throw err;
    }

    // 3. Fetch options for all source questions
    const { data: sourceOptions, error: optErr } = await supabase
      .from("question_bank_options")
      .select(
        "id, questionId:question_id, optionText:option_text, isCorrect:is_correct, order"
      )
      .in("question_id", questionIds);

    if (optErr) throw optErr;

    // Group options by source question id
    const optionsByQuestion = new Map<string, any[]>();
    for (const opt of sourceOptions ?? []) {
      const list = optionsByQuestion.get(opt.questionId) ?? [];
      list.push(opt);
      optionsByQuestion.set(opt.questionId, list);
    }

    // 4. Fetch existing quiz questions to detect duplicates and determine max order
    const { data: existingQuestions, error: exErr } = await supabase
      .from("quiz_questions")
      .select("id, question, order")
      .eq("quiz_id", quizId);

    if (exErr) throw exErr;

    const existingTexts = new Set(
      (existingQuestions ?? []).map((q: any) => q.question as string)
    );
    const maxOrder = (existingQuestions ?? []).reduce(
      (max: number, q: any) => Math.max(max, q.order ?? 0),
      0
    );

    // 5. Copy each question + options
    const created: QuizQuestion[] = [];
    const duplicateWarnings: string[] = [];
    let orderCounter = maxOrder + 1;

    for (const src of sourceQuestions ?? []) {
      // Duplicate detection (Req 9.1, 9.4)
      if (existingTexts.has(src.question)) {
        duplicateWarnings.push(src.question);
      }

      // Insert quiz_question (Req 3.1, 3.3)
      const { data: newQuestion, error: qErr } = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id: quizId,
          question: src.question,
          question_type: src.questionType,
          explanation: src.explanation ?? null,
          points: src.points ?? 1,
          order: orderCounter,
        })
        .select(
          "id, quizId:quiz_id, question, questionType:question_type, explanation, points, order"
        )
        .single();

      if (qErr) throw qErr;

      const opts = optionsByQuestion.get(src.id) ?? [];

      // Warn if no options (Req 3.4)
      if (opts.length === 0) {
        duplicateWarnings.push(
          `Question "${src.question}" has no options and was imported without answer choices.`
        );
      } else {
        // Insert quiz_options (Req 3.2)
        const optionRows = opts.map((opt: any) => ({
          question_id: newQuestion.id,
          option_text: opt.optionText,
          is_correct: opt.isCorrect ?? false,
          order: opt.order ?? 0,
        }));

        const { error: oErr } = await supabase
          .from("quiz_options")
          .insert(optionRows);

        if (oErr) throw oErr;
      }

      created.push(newQuestion as QuizQuestion);
      orderCounter++;
    }

    return { created, duplicateWarnings };
  }

  // ─── Stubs for future tasks ──────────────────────────────────────────────

  /**
   * Import flashcard decks into a course (optionally scoped to a module).
   * - Copies deck + cards as new flashcard_deck + flashcard records.
   * - Detects duplicates by comparing deck title against existing decks in the target course/module.
   * - Sets courseId (and optional moduleId) on each new deck.
   * - Warns if source deck has zero cards (Req 5.4).
   *
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.2, 9.4
   */
  async importFlashcardDecksToTarget(
    courseId: string,
    deckIds: string[],
    moduleId?: string
  ): Promise<ImportFlashcardDecksResult> {
    // 1. Fetch source flashcard_decks
    const { data: sourceDecks, error: srcErr } = await supabase
      .from("flashcard_decks")
      .select("id, title, description, category")
      .in("id", deckIds);

    if (srcErr) throw srcErr;

    // 2. Validate all requested IDs exist
    const foundIds = new Set((sourceDecks ?? []).map((d: any) => d.id));
    const invalidIds = deckIds.filter((id) => !foundIds.has(id));
    if (invalidIds.length > 0) {
      const err: any = new Error("Invalid IDs");
      err.status = 422;
      err.invalidIds = invalidIds;
      throw err;
    }

    // 3. Fetch all flashcards for the source decks
    const { data: sourceCards, error: cardsErr } = await supabase
      .from("flashcards")
      .select(
        "id, deckId:deck_id, front, back, cardType:card_type, options, correctAnswer:correct_answer, explanation, imageUrl:image_url, audioUrl:audio_url, order"
      )
      .in("deck_id", deckIds);

    if (cardsErr) throw cardsErr;

    // Group cards by source deck id
    const cardsByDeck = new Map<string, any[]>();
    for (const card of sourceCards ?? []) {
      const list = cardsByDeck.get(card.deckId) ?? [];
      list.push(card);
      cardsByDeck.set(card.deckId, list);
    }

    // 4. Fetch existing decks in the target course/module to detect duplicates (Req 9.2)
    let existingDecksQuery = supabase
      .from("flashcard_decks")
      .select("id, title")
      .eq("course_id", courseId);

    if (moduleId) {
      existingDecksQuery = existingDecksQuery.eq("module_id", moduleId);
    }

    const { data: existingDecks, error: exErr } = await existingDecksQuery;
    if (exErr) throw exErr;

    const existingTitles = new Set(
      (existingDecks ?? []).map((d: any) => d.title as string)
    );

    // 5. Copy each deck + its cards
    const created: FlashcardDeck[] = [];
    const duplicateWarnings: string[] = [];

    for (const src of sourceDecks ?? []) {
      // Duplicate detection (Req 9.2, 9.4)
      if (existingTitles.has(src.title)) {
        duplicateWarnings.push(src.title);
      }

      // Build insert row for new deck (Req 5.1, 5.2)
      const deckInsert: Record<string, any> = {
        title: src.title,
        description: src.description ?? null,
        category: src.category ?? null,
        course_id: courseId,
      };
      if (moduleId) {
        deckInsert.module_id = moduleId;
      }

      const { data: newDeck, error: deckErr } = await supabase
        .from("flashcard_decks")
        .insert(deckInsert)
        .select("id, title, description, category, courseId:course_id, moduleId:module_id")
        .single();

      if (deckErr) throw deckErr;

      const cards = cardsByDeck.get(src.id) ?? [];

      // Warn if deck has zero cards (Req 5.4)
      if (cards.length === 0) {
        duplicateWarnings.push(
          `Deck "${src.title}" has no flashcards and was imported as an empty deck.`
        );
      } else {
        // Copy all cards into the new deck (Req 5.3)
        const cardRows = cards.map((card: any) => ({
          deck_id: newDeck.id,
          front: card.front,
          back: card.back,
          card_type: card.cardType ?? null,
          options: card.options ?? null,
          correct_answer: card.correctAnswer ?? null,
          explanation: card.explanation ?? null,
          image_url: card.imageUrl ?? null,
          audio_url: card.audioUrl ?? null,
          order: card.order ?? 0,
        }));

        const { error: cErr } = await supabase
          .from("flashcards")
          .insert(cardRows);

        if (cErr) throw cErr;
      }

      created.push(newDeck as FlashcardDeck);
    }

    return { created, duplicateWarnings };
  }

  /**
   * Import individual flashcards into an existing deck.
   * - Fetches source flashcards by IDs.
   * - Copies each card into the target deck, assigning sequential order after the current max.
   * - Returns { created, duplicateWarnings }.
   *
   * Requirements: 6.4, 6.5, 9.4
   */
  async importFlashcardsToDecks(
    targetDeckId: string,
    flashcardIds: string[]
  ): Promise<ImportFlashcardsResult> {
    // 1. Fetch source flashcards by IDs
    const { data: sourceCards, error: srcErr } = await supabase
      .from("flashcards")
      .select(
        "id, deckId:deck_id, front, back, cardType:card_type, options, correctAnswer:correct_answer, explanation, imageUrl:image_url, audioUrl:audio_url, order"
      )
      .in("id", flashcardIds);

    if (srcErr) throw srcErr;

    // 2. Validate all requested IDs exist
    const foundIds = new Set((sourceCards ?? []).map((c: any) => c.id));
    const invalidIds = flashcardIds.filter((id) => !foundIds.has(id));
    if (invalidIds.length > 0) {
      const err: any = new Error("Invalid IDs");
      err.status = 422;
      err.invalidIds = invalidIds;
      throw err;
    }

    // 3. Fetch existing cards in the target deck to determine max order
    const { data: existingCards, error: exErr } = await supabase
      .from("flashcards")
      .select("id, order")
      .eq("deck_id", targetDeckId);

    if (exErr) throw exErr;

    const maxOrder = (existingCards ?? []).reduce(
      (max: number, c: any) => Math.max(max, c.order ?? 0),
      0
    );

    // 4. Copy each card into the target deck with sequential order (Req 6.4)
    const created: Flashcard[] = [];
    const duplicateWarnings: string[] = [];
    let orderCounter = maxOrder + 1;

    for (const src of sourceCards ?? []) {
      const { data: newCard, error: cErr } = await supabase
        .from("flashcards")
        .insert({
          deck_id: targetDeckId,
          front: src.front,
          back: src.back,
          card_type: src.cardType ?? null,
          options: src.options ?? null,
          correct_answer: src.correctAnswer ?? null,
          explanation: src.explanation ?? null,
          image_url: src.imageUrl ?? null,
          audio_url: src.audioUrl ?? null,
          order: orderCounter,
        })
        .select(
          "id, deckId:deck_id, front, back, cardType:card_type, options, correctAnswer:correct_answer, explanation, imageUrl:image_url, audioUrl:audio_url, order"
        )
        .single();

      if (cErr) throw cErr;

      created.push(newCard as Flashcard);
      orderCounter++;
    }

    return { created, duplicateWarnings };
  }

  /**
   * Link anatomy models to a lesson via lesson_anatomy_models join records.
   * Requirements: 8.1, 8.3, 8.4, 8.5, 9.3, 9.4
   */
  async importModelsToLesson(
    lessonId: string,
    modelIds: string[]
  ): Promise<ImportModelsResult> {
    // 1. Validate all modelIds exist and are published (Req 8.4)
    const { data: sourceModels, error: srcErr } = await supabase
      .from("anatomy_models")
      .select("id")
      .in("id", modelIds)
      .eq("is_published", true);

    if (srcErr) throw srcErr;

    const foundIds = new Set((sourceModels ?? []).map((m: any) => m.id));
    const invalidIds = modelIds.filter((id) => !foundIds.has(id));
    if (invalidIds.length > 0) {
      const err: any = new Error("Invalid IDs");
      err.status = 422;
      err.invalidIds = invalidIds;
      throw err;
    }

    // 2. Fetch existing lesson_anatomy_models rows to detect duplicates and determine max order (Req 9.3)
    const { data: existingRefs, error: exErr } = await supabase
      .from("lesson_anatomy_models")
      .select("id, model_id, order")
      .eq("lesson_id", lessonId);

    if (exErr) throw exErr;

    const existingModelIds = new Set(
      (existingRefs ?? []).map((r: any) => r.model_id as string)
    );
    const maxOrder = (existingRefs ?? []).reduce(
      (max: number, r: any) => Math.max(max, r.order ?? 0),
      0
    );

    // 3. Insert reference records with sequential order (Req 8.1, 8.3)
    const created: LessonAnatomyModel[] = [];
    const duplicateWarnings: string[] = [];
    let orderCounter = maxOrder + 1;

    for (const modelId of modelIds) {
      // Duplicate detection (Req 9.3, 9.4)
      if (existingModelIds.has(modelId)) {
        duplicateWarnings.push(modelId);
      }

      const { data: newRef, error: refErr } = await supabase
        .from("lesson_anatomy_models")
        .insert({
          lesson_id: lessonId,
          module_id: null,
          model_id: modelId,
          order: orderCounter,
        })
        .select(
          "id, lessonId:lesson_id, moduleId:module_id, modelId:model_id, order, createdAt:created_at"
        )
        .single();

      if (refErr) throw refErr;

      created.push(newRef as LessonAnatomyModel);
      orderCounter++;
    }

    return { created, duplicateWarnings };
  }

  /**
   * Link anatomy models to a module via lesson_anatomy_models join records.
   * Requirements: 8.2, 8.3, 8.4, 8.5, 9.3, 9.4
   */
  async importModelsToModule(
    moduleId: string,
    modelIds: string[]
  ): Promise<ImportModelsResult> {
    // 1. Validate all modelIds exist and are published (Req 8.4)
    const { data: sourceModels, error: srcErr } = await supabase
      .from("anatomy_models")
      .select("id")
      .in("id", modelIds)
      .eq("is_published", true);

    if (srcErr) throw srcErr;

    const foundIds = new Set((sourceModels ?? []).map((m: any) => m.id));
    const invalidIds = modelIds.filter((id) => !foundIds.has(id));
    if (invalidIds.length > 0) {
      const err: any = new Error("Invalid IDs");
      err.status = 422;
      err.invalidIds = invalidIds;
      throw err;
    }

    // 2. Fetch existing lesson_anatomy_models rows to detect duplicates and determine max order (Req 9.3)
    const { data: existingRefs, error: exErr } = await supabase
      .from("lesson_anatomy_models")
      .select("id, model_id, order")
      .eq("module_id", moduleId);

    if (exErr) throw exErr;

    const existingModelIds = new Set(
      (existingRefs ?? []).map((r: any) => r.model_id as string)
    );
    const maxOrder = (existingRefs ?? []).reduce(
      (max: number, r: any) => Math.max(max, r.order ?? 0),
      0
    );

    // 3. Insert reference records with sequential order (Req 8.2, 8.3)
    const created: LessonAnatomyModel[] = [];
    const duplicateWarnings: string[] = [];
    let orderCounter = maxOrder + 1;

    for (const modelId of modelIds) {
      // Duplicate detection (Req 9.3, 9.4)
      if (existingModelIds.has(modelId)) {
        duplicateWarnings.push(modelId);
      }

      const { data: newRef, error: refErr } = await supabase
        .from("lesson_anatomy_models")
        .insert({
          lesson_id: null,
          module_id: moduleId,
          model_id: modelId,
          order: orderCounter,
        })
        .select(
          "id, lessonId:lesson_id, moduleId:module_id, modelId:model_id, order, createdAt:created_at"
        )
        .single();

      if (refErr) throw refErr;

      created.push(newRef as LessonAnatomyModel);
      orderCounter++;
    }

    return { created, duplicateWarnings };
  }
}

export const importService = new ImportService();
