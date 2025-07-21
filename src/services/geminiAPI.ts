// Google Gemini API Service (Primary AI)
// Get your free API key from: https://makersuite.google.com/app/apikey
// Gemini API is free with generous limits (60 requests per minute)

// API Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const OLLAMA_API_URL = 'http://192.168.103.221:11434/api/generate'; // Your PC's WiFi IP
const USE_GEMINI_PRIMARY = true; // Primary: Gemini 1.5, Fallback: OLLAMA
const GEMINI_API_KEY = 'AIzaSyBKcPLtuJ3egSgEKPUCWf0RNB2tCf7Mmnc'; // Replace with your actual Gemini API key

// AI Response Configuration
const AI_CONFIG = {
  OLLAMA_TIMEOUT: 60000, // 60 seconds
  OLLAMA_NUM_PREDICT: 100,
  GEMINI_MAX_TOKENS: 150,
  GEMINI_TEMPERATURE: 0.7,
  OLLAMA_TEMPERATURE: 0.7,
  PROMPT_PREVIEW_LENGTH: 200,
} as const;

// Performance Thresholds
const PERFORMANCE_THRESHOLDS = {
  HIGH_SCORE: 80,
  MEDIUM_SCORE: 60,
  STRONG_SUBJECT: 70,
  WEAK_SUBJECT: 60,
} as const;
// Gemini API key temporarily disabled
// const GEMINI_API_KEY = 'AIzaSyBeaR4gJFvqV0MpGZcaAxo-4XAVbKNJkpk';

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

  const contextInfo = `You are an AI tutor helping ${context.name}, a ${context.educationType} student${
    context.class ? ` in class ${context.class}` : ''
  }${context.stream ? ` studying ${context.stream}` : ''}. 

Student Performance:
- Completed ${context.completedTests} tests
- Average score: ${context.averageScore}%
- Strong in: ${context.strongSubjects.join(', ') || 'No strong subjects identified yet'}
- Needs improvement in: ${context.weakSubjects.join(', ') || 'No weak areas identified yet'}

Student Question: "${message}"

Provide a helpful, personalized, and encouraging response in 2-3 sentences. Reference their performance when relevant.`;

  return contextInfo;
};

// Call Ollama local API
const getOllamaResponse = async (message: string, context: StudentContext | null): Promise<string> => {
  try {
    const prompt = buildContextPrompt(message, context);
    console.log('Ollama: Student context received:', context);
    console.log('Ollama: Full prompt being sent:', prompt.substring(0, AI_CONFIG.PROMPT_PREVIEW_LENGTH) + '...');
    console.log('Ollama: Sending request to', OLLAMA_API_URL);

    // Add timeout to prevent hanging (longer for first request)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.OLLAMA_TIMEOUT);

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'phi3',
        prompt: prompt, // Full context with student details
        stream: false,
        options: {
          temperature: AI_CONFIG.OLLAMA_TEMPERATURE,
          num_predict: AI_CONFIG.OLLAMA_NUM_PREDICT
        }
      })
    });

    clearTimeout(timeoutId);
    console.log('Ollama: Response status', response.status);

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Ollama: Response received', result);
    
    const aiResponse = result.response?.trim();
    if (!aiResponse) {
      throw new Error('Empty response from Ollama');
    }
    
    console.log('Ollama: Success! Response length:', aiResponse.length);
    return aiResponse;

  } catch (error) {
    console.error('Ollama API error:', error);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Ollama request timed out (30s)');
    }
    throw error; // Let main function handle fallback
  }
};

// Call Gemini 1.5 API
const getGeminiResponse = async (message: string, context: StudentContext | null): Promise<string> => {
  try {
    const prompt = buildContextPrompt(message, context);
    console.log('Gemini: Student context received:', context);
    console.log('Gemini: Full prompt being sent:', prompt.substring(0, AI_CONFIG.PROMPT_PREVIEW_LENGTH) + '...');
    
    // API key is configured
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: AI_CONFIG.GEMINI_MAX_TOKENS,
        temperature: AI_CONFIG.GEMINI_TEMPERATURE,
      }
    };

    console.log('Gemini: Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Gemini: Raw response:', responseText);

    if (!response.ok) {
      console.error('Gemini API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      throw new Error(`Gemini API Error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log('Gemini: Parsed response:', result);

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Extract response text from Gemini format
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!aiResponse) {
      throw new Error('Empty response from Gemini');
    }

    console.log('Gemini: Success! Response length:', aiResponse.length);
    return aiResponse;

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error; // Let main function handle fallback
  }
};

// Main AI Response function - Gemini 1.5 primary with OLLAMA fallback
export const getAIResponse = async (message: string, context: StudentContext | null): Promise<string> => {
  try {
    console.log('Main function: Received context:', context);
    console.log('Main function: Student name in context:', context?.name);
    
    // Try Gemini 1.5 first
    if (USE_GEMINI_PRIMARY) {
      try {
        console.log('Trying Gemini 1.5 API...');
        return await getGeminiResponse(message, context);
      } catch (geminiError) {
        console.warn('Gemini failed, falling back to OLLAMA:', geminiError);
        
        // Fallback to OLLAMA
        try {
          console.log('Using OLLAMA as fallback...');
          return await getOllamaResponse(message, context);
        } catch (ollamaError) {
          console.warn('OLLAMA also failed:', ollamaError);
          throw new Error('Both AI services failed');
        }
      }
    }

    // If Gemini is disabled, use OLLAMA directly
    console.log('Using OLLAMA directly...');
    return await getOllamaResponse(message, context);

  } catch (error) {
    console.error('AI error:', error);
    return getContextualFallback(message, context);
  }
};

// Contextual fallback responses when API fails
const getContextualFallback = (message: string, context: StudentContext | null): string => {
  const lowerMessage = message.toLowerCase();

  // Performance-related questions
  if (lowerMessage.includes('performance') || lowerMessage.includes('score')) {
    if (context && context.averageScore >= PERFORMANCE_THRESHOLDS.HIGH_SCORE) {
      return `Great work ${context.name}! Your ${context.averageScore}% average shows excellent progress. Keep challenging yourself with advanced topics. 🌟`;
    } else if (context && context.averageScore >= PERFORMANCE_THRESHOLDS.MEDIUM_SCORE) {
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
    if (context?.educationType === 'School') {
      return `Focus on discovering your interests first! Explore different subjects, try projects, and talk to professionals. Your ${context?.stream || 'current'} stream offers many paths. 🚀`;
    } else {
      return `Build practical skills alongside your studies! Consider internships, projects, and networking in your field. Your ${context?.stream || 'chosen field'} has great opportunities. 💼`;
    }
  }

  // Motivation
  if (lowerMessage.includes('motivat') || lowerMessage.includes('discourag') || lowerMessage.includes('difficult')) {
    return `Every expert was once a beginner! ${context?.name ? `${context.name}, you've` : 'You\'ve'} already taken the first step by seeking help. Small consistent efforts lead to big results. Keep going! 💪✨`;
  }

  // Subject-specific help
  if (lowerMessage.includes('math') || lowerMessage.includes('calculus') || lowerMessage.includes('algebra')) {
    return `Math builds step by step! Start with fundamentals, practice daily problems, and don't skip steps in solutions. Understanding concepts is more important than memorizing formulas. 🔢`;
  }

  if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry') || lowerMessage.includes('biology')) {
    return `Science is about understanding how things work! Connect concepts to real life, do experiments when possible, and create visual diagrams. Practice makes perfect! 🔬`;
  }

  if (lowerMessage.includes('english') || lowerMessage.includes('language') || lowerMessage.includes('writing')) {
    return `Language skills improve with practice! Read regularly, write daily, and don't fear making mistakes. Start with topics you enjoy to build confidence. 📝`;
  }

  // Default encouraging response
  if (context) {
    return `Hi ${context.name}! I'm here to help with your studies. Whether it's ${context?.stream || 'your subjects'}, exam prep, or study strategies, feel free to ask specific questions! 🎓`;
  }

  return `I'm here to help with your studies! Ask me about specific subjects, study techniques, exam preparation, or career guidance. Let's achieve your academic goals together! 🎯`;
};

// Helper function to extract subject from test title
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

// Get student context from app data
export const buildStudentContext = (studentData: any, completedTests: any[]): StudentContext | null => {
  if (!studentData) return null;

  const averageScore = completedTests.length > 0
    ? completedTests.reduce((sum, test) => sum + test.percentage, 0) / completedTests.length
    : 0;

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
    .filter((s) => s.average >= PERFORMANCE_THRESHOLDS.STRONG_SUBJECT)
    .sort((a, b) => b.average - a.average)
    .map((s) => s.subject);

  const weakSubjects = subjectAverages
    .filter((s) => s.average < PERFORMANCE_THRESHOLDS.WEAK_SUBJECT)
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
