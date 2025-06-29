// Utility functions for randomizing exam questions and answers for each user

interface Option {
  option_id: string;
  text: string;
}

interface Question {
  id: string;
  question_text: string;
  options: { [key: string]: string } | Option[];
  correct_answer: string;
  subject?: string;
  difficulty?: string;
}

/**
 * Generates a user-specific seed based on email and test ID
 * This ensures the same user gets the same randomized exam for a specific test
 * but different users get different randomizations
 */
function generateUserSeed(userEmail: string, testId: string): number {
  let hash = 0;
  const str = `${userEmail}_${testId}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator for consistent randomization per user
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Randomizes questions and answers for a specific user and test
 */
export function randomizeExamForUser(
  questions: Question[],
  userEmail: string,
  testId: string,
  maxQuestions?: number
): Question[] {
  if (!questions || questions.length === 0) {
    return [];
  }

  const seed = generateUserSeed(userEmail, testId);
  const rng = new SeededRandom(seed);

  // Shuffle questions for this user
  let shuffledQuestions = rng.shuffle(questions);

  // Limit to max questions if specified
  if (maxQuestions && maxQuestions < shuffledQuestions.length) {
    shuffledQuestions = shuffledQuestions.slice(0, maxQuestions);
  }

  // Shuffle answer options for each question
  const randomizedQuestions = shuffledQuestions.map(question => {
    const randomizedQuestion = { ...question };

    // Handle different option formats
    if (Array.isArray(question.options)) {
      // Array format: [{ option_id: 'A', text: 'Answer 1' }, ...]
      const shuffledOptions = rng.shuffle([...question.options]);
      
      // Find the correct answer in the shuffled options
      
      // Map to new option IDs (A, B, C, D)
      const optionIds = ['A', 'B', 'C', 'D'];
      const newOptions: { [key: string]: string } = {};
      let newCorrectAnswer = 'A';

      shuffledOptions.forEach((option, index) => {
        const newId = optionIds[index] || String.fromCharCode(65 + index);
        newOptions[newId] = option.text;
        
        if (option.option_id === question.correct_answer) {
          newCorrectAnswer = newId;
        }
      });

      randomizedQuestion.options = newOptions;
      randomizedQuestion.correct_answer = newCorrectAnswer;
    } else if (typeof question.options === 'object') {
      // Object format: { 'A': 'Answer 1', 'B': 'Answer 2', ... }
      const optionEntries = Object.entries(question.options);
      const shuffledEntries = rng.shuffle(optionEntries);
      
      const newOptions: { [key: string]: string } = {};
      const optionIds = ['A', 'B', 'C', 'D'];
      let newCorrectAnswer = 'A';

      shuffledEntries.forEach(([originalId, text], index) => {
        const newId = optionIds[index] || String.fromCharCode(65 + index);
        newOptions[newId] = text;
        
        if (originalId === question.correct_answer) {
          newCorrectAnswer = newId;
        }
      });

      randomizedQuestion.options = newOptions;
      randomizedQuestion.correct_answer = newCorrectAnswer;
    }

    return randomizedQuestion;
  });

  return randomizedQuestions;
}

/**
 * Simple fallback randomization when user email is not available
 */
export function simpleRandomizeQuestions(
  questions: Question[],
  maxQuestions?: number
): Question[] {
  if (!questions || questions.length === 0) {
    return [];
  }

  // Use current timestamp as seed for true randomness
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  
  if (maxQuestions && maxQuestions < shuffled.length) {
    return shuffled.slice(0, maxQuestions);
  }
  
  return shuffled;
}
