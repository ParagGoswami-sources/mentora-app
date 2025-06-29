// Free AI Service using Together AI (free tier available)
// Alternative: Use local responses that are very intelligent

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

// Enhanced contextual AI responses (no API needed - works offline)
export const getAIResponse = async (message: string, context: StudentContext | null): Promise<string> => {
  // Simulate API delay for realistic feel
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return getIntelligentResponse(message, context);
};

// Advanced contextual response system
const getIntelligentResponse = (message: string, context: StudentContext | null): string => {
  const lowerMessage = message.toLowerCase();
  const name = context?.name || 'Student';

  // Advanced performance analysis
  if (lowerMessage.includes('performance') || lowerMessage.includes('score') || lowerMessage.includes('how am i doing')) {
    if (!context || context.completedTests === 0) {
      return `Hi ${name}! I don't see any test results yet. Start with our psychometric assessments to discover your strengths and interests. This will help me provide personalized guidance! 📊`;
    }

    const performance = analyzePerformance(context);
    return performance;
  }

  // Study tips with personalization
  if (lowerMessage.includes('study') || lowerMessage.includes('tips') || lowerMessage.includes('how to study')) {
    return getPersonalizedStudyTips(message, context);
  }

  // Career guidance
  if (lowerMessage.includes('career') || lowerMessage.includes('future') || lowerMessage.includes('job')) {
    return getCareerGuidance(context);
  }

  // Motivation and encouragement
  if (lowerMessage.includes('motivation') || lowerMessage.includes('discourage') || lowerMessage.includes('give up')) {
    return getMotivationalResponse(context);
  }

  // Subject-specific help
  if (lowerMessage.includes('math') || lowerMessage.includes('science') || lowerMessage.includes('english')) {
    return getSubjectSpecificHelp(message, context);
  }

  // Exam preparation
  if (lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('prepare')) {
    return getExamPreparationAdvice(context);
  }

  // Time management
  if (lowerMessage.includes('time') || lowerMessage.includes('manage') || lowerMessage.includes('schedule')) {
    return getTimeManagementAdvice(context);
  }

  // Stress and mental health
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('overwhelmed')) {
    return getStressManagementAdvice(name);
  }

  // Default intelligent response
  return getContextualGreeting(message, context);
};

const analyzePerformance = (context: StudentContext): string => {
  const { name, averageScore, strongSubjects, weakSubjects, completedTests } = context;
  
  if (averageScore >= 85) {
    return `Outstanding work, ${name}! 🌟 Your ${averageScore}% average puts you in the top tier. Your strengths in ${strongSubjects.slice(0,2).join(' and ')} show real potential. Consider exploring advanced topics or leadership roles. Keep pushing your boundaries!`;
  } 
  
  if (averageScore >= 70) {
    return `Great progress, ${name}! 📈 Your ${averageScore}% average shows solid understanding. You're excelling in ${strongSubjects[0] || 'several areas'}. ${weakSubjects.length > 0 ? `Focus some extra time on ${weakSubjects[0]} to round out your skills.` : 'Keep maintaining this consistency across all subjects.'}`;
  }
  
  if (averageScore >= 50) {
    return `You're building momentum, ${name}! 💪 Your ${averageScore}% shows you're grasping the concepts. ${strongSubjects.length > 0 ? `Your strength in ${strongSubjects[0]} proves you have the capability.` : ''} Let's work on strengthening ${weakSubjects[0] || 'key areas'} with focused practice sessions.`;
  }
  
  return `Every expert started somewhere, ${name}! 🎯 Your ${completedTests} completed tests show you're committed to improvement. Let's break down the challenging areas into smaller, manageable goals. Focus on understanding fundamentals first - the scores will follow naturally.`;
};

const getPersonalizedStudyTips = (message: string, context: StudentContext | null): string => {
  const tips = [
    "📚 Use active recall: Test yourself without looking at notes",
    "⏰ Try the Pomodoro Technique: 25 min focused study + 5 min break", 
    "🔄 Space out your learning: Review material after 1 day, 1 week, 1 month",
    "📝 Teach others: Explaining concepts helps solidify your understanding",
    "🎯 Set specific goals: 'Master quadratic equations' vs 'study math'"
  ];

  if (context && context.weakSubjects.length > 0) {
    return `Here are targeted tips for improving in ${context.weakSubjects[0]}: ${tips.slice(0,3).join(', ')}. Start with 15-minute daily sessions focusing on one concept at a time.`;
  }

  return `Proven study strategies: ${tips.slice(0,3).join(', ')}. Which subject would you like specific help with?`;
};

const getCareerGuidance = (context: StudentContext | null): string => {
  if (!context || context.strongSubjects.length === 0) {
    return `🚀 Career planning starts with understanding your strengths! Complete more assessments to discover your natural talents. Meanwhile, explore fields that excite you - passion + skill = perfect career fit!`;
  }

  const careerMap: { [key: string]: string[] } = {
    'Science': ['Medicine', 'Engineering', 'Research', 'Biotechnology', 'Environmental Science'],
    'Commerce': ['Business Management', 'Finance', 'Marketing', 'Entrepreneurship', 'Economics'],
    'Arts': ['Design', 'Writing', 'Psychology', 'Law', 'Social Work'],
    'Aptitude': ['Problem Solving roles', 'Analysis', 'Consulting', 'Strategy'],
  };

  const strongSubject = context.strongSubjects[0];
  const careers = careerMap[strongSubject] || ['Multiple exciting fields'];
  
  return `🎯 Based on your strength in ${strongSubject}, consider careers in: ${careers.slice(0,3).join(', ')}. Your ${context.averageScore}% performance shows you have the analytical skills these fields require. Want specific information about any of these?`;
};

const getMotivationalResponse = (context: StudentContext | null): string => {
  const motivationalQuotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts. 💪",
    "Every expert was once a beginner. Every champion was once a contender. Keep going! 🌟",
    "Your current situation is not your final destination. Progress takes time. 🚀",
    "The only impossible journey is the one you never begin. You've already started! 🎯"
  ];

  if (context && context.averageScore < 60) {
    return `${context.name}, I see you're working hard with ${context.completedTests} tests completed. ${motivationalQuotes[0]} Every small improvement builds toward your goals. What specific challenge can I help you tackle today?`;
  }

  return `${motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]} Remember, consistent effort beats perfect scores. What's your next goal?`;
};

const getSubjectSpecificHelp = (message: string, context: StudentContext | null): string => {
  const subject = message.includes('math') ? 'Mathematics' : 
                 message.includes('science') ? 'Science' : 'English';
  
  const tips: { [key: string]: string } = {
    'Mathematics': 'Practice daily, master basics first, use visual aids for complex problems, and always check your work.',
    'Science': 'Connect concepts to real life, use diagrams, conduct experiments when possible, and create concept maps.',
    'English': 'Read widely, practice writing daily, expand vocabulary, and analyze different writing styles.'
  };

  if (context && context.weakSubjects.includes(subject)) {
    return `I see ${subject} is challenging for you. Here's a focused approach: ${tips[subject]} Start with 20 minutes daily and gradually increase. Which specific topic in ${subject} would you like help with?`;
  }

  return `For ${subject}: ${tips[subject]} Would you like me to break down any specific concept?`;
};

const getExamPreparationAdvice = (context: StudentContext | null): string => {
  if (context && context.completedTests > 3) {
    return `Based on your ${context.completedTests} completed assessments, you understand the format well! Focus on: 1) Review weak areas identified in past tests 2) Practice time management 3) Create summary notes 4) Take mock tests. Your ${context.averageScore}% average shows you're on the right track!`;
  }

  return `Exam prep strategy: 1) Start 2 weeks early 2) Create a study schedule 3) Practice past papers 4) Focus on understanding, not memorizing 5) Take care of your health. Which exam are you preparing for?`;
};

const getTimeManagementAdvice = (context: StudentContext | null): string => {
  return `⏰ Effective time management: 1) Use a planner or app 2) Prioritize tasks (urgent vs important) 3) Block time for focused study 4) Include breaks and fun activities 5) Review and adjust weekly. Start with small changes - even 30 minutes of planned study beats 2 hours of unfocused effort!`;
};

const getStressManagementAdvice = (name: string): string => {
  return `${name}, feeling overwhelmed is normal when you're working hard! 🧘‍♂️ Try these: 1) Deep breathing exercises 2) Break big tasks into smaller steps 3) Talk to someone you trust 4) Ensure adequate sleep 5) Regular physical activity. Remember, your worth isn't defined by test scores. How can I support you better?`;
};

const getContextualGreeting = (message: string, context: StudentContext | null): string => {
  const greetings = [
    `Hi ${context?.name || 'there'}! I'm here to help with your academic journey. What's on your mind today? 😊`,
    `Hello! Ready to tackle some learning goals? I can help with study strategies, career planning, or any academic questions! 📚`,
    `Hey ${context?.name || 'student'}! Whether you need motivation, study tips, or career guidance, I'm here to support you. What would you like to explore? 🎓`
  ];

  if (context && context.completedTests > 0) {
    return `Welcome back! I see you've completed ${context.completedTests} assessments. Based on your progress, how can I help you today? Need study tips, career advice, or performance insights? 🚀`;
  }

  return greetings[Math.floor(Math.random() * greetings.length)];
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
