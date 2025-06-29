// Google Gemini API Service
// Get your free API key from: https://makersuite.google.com/app/apikey
// Gemini API is free with generous limits (60 requests per minute)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_API_KEY = 'AIzaSyDtRgASZ0DxWVJ-IYkXUxWjqoDHS4jZG9Q';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface StudentContext {
  name: string;
  completedTests: number;
  averageScore: number;
  strongSubjects: string[];
  weakSubjects: string[];
  educationType: string;
  class?: string;
  stream?: string;
}

// Build context prompt for better responses
const buildContextPrompt = (message: string, context: StudentContext | null): string => {
  if (!context) {
    return `You are a helpful AI tutor for students. The student asks: "${message}". Provide helpful, encouraging study advice in 2-3 sentences.`;
  }

  const contextInfo = `You are an AI tutor helping a student. Here's their profile:

Student: ${context.name}
Education: ${context.educationType} ${context.class ? `Class ${context.class}` : ''} ${context.stream || ''}
Tests Completed: ${context.completedTests}
Average Score: ${context.averageScore}%
Strong Subjects: ${context.strongSubjects.join(', ') || 'None identified yet'}
Weak Subjects: ${context.weakSubjects.join(', ') || 'None identified yet'}

Student Question: "${message}"

Provide a helpful, personalized, and encouraging response in 2-3 sentences. Reference their performance when relevant.`;

  return contextInfo;
};

// Call Google Gemini API
export const getAIResponse = async (message: string, context: StudentContext | null): Promise<string> => {
  try {
    // API key check removed - proceeding directly to Gemini API
    const prompt = buildContextPrompt(message, context);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Extract response text from Gemini format
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!aiResponse) {
      throw new Error('No response generated');
    }

    return aiResponse;

  } catch (error) {
    console.error('Gemini API error:', {
      message: (error as Error)?.message ?? String(error),
      stack: (error as Error)?.stack,
    });
    return getContextualFallback(message, context);
  }
};

// Contextual fallback responses when API fails
const getContextualFallback = (message: string, context: StudentContext | null): string => {
  const lowerMessage = message.toLowerCase();

  // Performance-related questions
  if (lowerMessage.includes('performance') || lowerMessage.includes('score')) {
    if (context && context.averageScore >= 80) {
      return `Great work ${context.name}! Your ${context.averageScore}% average shows excellent progress. Keep challenging yourself with advanced topics. 🌟`;
    } else if (context && context.averageScore >= 60) {
      return `You're doing well with ${context.averageScore}% average! Focus on consistency and practice in weaker areas to reach the next level. 📈`;
    } else {
      return `Let's work on improving your performance together! Start with focused practice sessions and don't hesitate to ask for help. 💪`;
    }
  }

  // Study tips
  if (lowerMessage.includes('study') || lowerMessage.includes('tips')) {
    return `Here are proven study tips: 1) Create a schedule 2) Take regular breaks 3) Practice active recall 4) Use spaced repetition 5) Stay consistent. What subject needs help? 📚`;
  }

  // Career guidance
  if (lowerMessage.includes('career') || lowerMessage.includes('future')) {
    if (context && Array.isArray(context.strongSubjects) && context.strongSubjects.length > 0) {
      return `Based on your strength in ${context.strongSubjects.join(', ')}, consider careers in related fields. Would you like specific suggestions? 🎯`;
    }
    return `Career planning is exciting! Let's explore options based on your interests and strengths. What subjects do you enjoy most? 🚀`;
  }

  // Motivation
  if (lowerMessage.includes('motivation') || lowerMessage.includes('help')) {
    return `Remember, every expert was once a beginner! Your effort matters more than perfect scores. Small consistent improvements lead to big results. You've got this! 🌟`;
  }

  // Weak subjects
  if (lowerMessage.includes('weak') || lowerMessage.includes('difficult')) {
    if (context && Array.isArray(context.weakSubjects) && context.weakSubjects.length > 0) {
      return `I see you're working on ${context.weakSubjects.join(', ')}. Try breaking these into smaller topics and practice regularly. Need specific strategies? 📖`;
    }
    return `Struggling with a subject? Break it down into smaller parts, practice consistently, and ask for help. What specific topic is challenging? 🤔`;
  }

  // Default responses
  const defaultResponses = [
    `Hi ${context?.name || 'there'}! I'm here to help with your studies and career planning. What would you like to discuss? 😊`,
    `Feel free to ask me about study strategies, career options, or any academic concerns you have! 📚`,
    `I'm your AI tutor ready to support your educational journey. How can I assist you today? 🎓`,
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Get student context from app data
export const buildStudentContext = (studentData: any, completedTests: any[]): StudentContext | null => {
  if (!studentData) return null;

  // Calculate performance metrics
  const averageScore = completedTests.length > 0
    ? completedTests.reduce((sum, test) => sum + test.percentage, 0) / completedTests.length
    : 0;

  // Analyze subject performance
  const subjectScores: { [key: string]: number[] } = {};
  completedTests.forEach((test) => {
    const subject = extractSubject(test.title);
    if (!subjectScores[subject]) subjectScores[subject] = [];
    subjectScores[subject].push(test.percentage);
  });

  const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
    subject,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const strongSubjects = subjectAverages
    .filter((s) => s.average >= 70)
    .sort((a, b) => b.average - a.average)
    .map((s) => s.subject);

  const weakSubjects = subjectAverages
    .filter((s) => s.average < 60)
    .sort((a, b) => a.average - b.average)
    .map((s) => s.subject);

  return {
    name: studentData.name,
    completedTests: completedTests.length,
    averageScore: Math.round(averageScore),
    strongSubjects,
    weakSubjects,
    educationType: studentData.educationType,
    class: studentData.class,
    stream: studentData.stream,
  };
};

// Extract subject from test title
const extractSubject = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes('science')) return 'Science';
  if (lower.includes('commerce')) return 'Commerce';
  if (lower.includes('arts')) return 'Arts';
  if (lower.includes('aptitude')) return 'Aptitude';
  if (lower.includes('emotional')) return 'Emotional Intelligence';
  if (lower.includes('interest')) return 'Interest';
  if (lower.includes('personality')) return 'Personality';
  return title.split(' ')[0] || 'General';
};
