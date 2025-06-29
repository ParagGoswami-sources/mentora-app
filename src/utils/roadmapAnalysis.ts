import { CompletedTest } from '../context/TestProgressContext';

export interface FieldAlignment {
  field: string;
  category: string;
  alignmentPercentage: number;
  strengths: string[];
  requirements: string[];
  description: string;
  careerPaths: string[];
  educationPath: string[];
  skills: string[];
  color: string;
}

export interface RoadmapAnalysis {
  isComplete: boolean;
  completionPercentage: number;
  topRecommendations: FieldAlignment[];
  psychometricSummary: {
    aptitude: number;
    emotionalIntelligence: number;
    interests: string[];
    personality: string;
    learningStyle: string;
  };
  academicStrengths: {
    science: number;
    commerce: number;
    arts: number;
  };
  overallRecommendation: string;
  nextSteps: string[];
}

const CAREER_FIELDS = {
  // STEM Fields
  ENGINEERING: {
    field: 'Engineering',
    category: 'STEM',
    description: 'Design, build, and maintain technological solutions to solve real-world problems',
    careerPaths: ['Software Engineer', 'Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Data Scientist'],
    educationPath: ['B.Tech/B.E', 'Specialized Engineering Courses', 'M.Tech (Optional)', 'Industry Certifications'],
    skills: ['Problem-solving', 'Mathematical reasoning', 'Technical analysis', 'Innovation'],
    requirements: ['Strong aptitude (70%+)', 'Good science foundation', 'Logical thinking'],
    color: '#2196F3'
  },
  MEDICINE: {
    field: 'Medicine',
    category: 'Healthcare',
    description: 'Diagnose, treat, and care for patients while advancing medical knowledge',
    careerPaths: ['Doctor', 'Surgeon', 'Specialist', 'Medical Researcher', 'Healthcare Administrator'],
    educationPath: ['MBBS', 'Specialization (MD/MS)', 'Fellowship', 'Continuous Medical Education'],
    skills: ['Empathy', 'Attention to detail', 'Stress management', 'Communication'],
    requirements: ['High emotional intelligence (75%+)', 'Strong science background', 'Excellent memory'],
    color: '#4CAF50'
  },
  COMPUTER_SCIENCE: {
    field: 'Computer Science',
    category: 'Technology',
    description: 'Develop software, algorithms, and computing solutions for digital transformation',
    careerPaths: ['Software Developer', 'Data Scientist', 'AI/ML Engineer', 'Cybersecurity Expert', 'Product Manager'],
    educationPath: ['BCA/B.Tech CSE', 'Programming Certifications', 'M.Tech/MS (Optional)', 'Industry Projects'],
    skills: ['Logical thinking', 'Problem-solving', 'Creativity', 'Continuous learning'],
    requirements: ['High aptitude (75%+)', 'Mathematical foundation', 'Pattern recognition'],
    color: '#9C27B0'
  },
  
  // Business & Commerce
  BUSINESS_MANAGEMENT: {
    field: 'Business Management',
    category: 'Business',
    description: 'Lead organizations, manage teams, and drive strategic business growth',
    careerPaths: ['Business Manager', 'Entrepreneur', 'Consultant', 'Operations Manager', 'Strategy Analyst'],
    educationPath: ['BBA/B.Com', 'MBA', 'Industry Certifications', 'Leadership Programs'],
    skills: ['Leadership', 'Communication', 'Strategic thinking', 'Team management'],
    requirements: ['Good emotional intelligence (65%+)', 'Interest in business', 'People skills'],
    color: '#FF9800'
  },
  FINANCE: {
    field: 'Finance',
    category: 'Business',
    description: 'Manage financial resources, investments, and economic planning for growth',
    careerPaths: ['Financial Analyst', 'Investment Banker', 'CA/CPA', 'Financial Planner', 'Risk Manager'],
    educationPath: ['B.Com/BBA Finance', 'CA/CMA/CS', 'MBA Finance', 'CFA/FRM'],
    skills: ['Numerical ability', 'Risk assessment', 'Attention to detail', 'Analytical thinking'],
    requirements: ['Good aptitude (65%+)', 'Strong commerce background', 'Mathematical skills'],
    color: '#795548'
  },
  
  // Arts & Humanities
  MEDIA_COMMUNICATION: {
    field: 'Media & Communication',
    category: 'Creative',
    description: 'Create content, communicate ideas, and influence public opinion through various media',
    careerPaths: ['Journalist', 'Content Creator', 'Public Relations', 'Digital Marketer', 'Film Director'],
    educationPath: ['Mass Communication', 'Journalism', 'Digital Marketing Courses', 'Portfolio Development'],
    skills: ['Creativity', 'Communication', 'Storytelling', 'Social awareness'],
    requirements: ['High emotional intelligence (70%+)', 'Creative interests', 'Communication skills'],
    color: '#E91E63'
  },
  EDUCATION: {
    field: 'Education',
    category: 'Social Service',
    description: 'Teach, mentor, and shape the next generation while contributing to society',
    careerPaths: ['Teacher', 'Professor', 'Educational Researcher', 'Curriculum Designer', 'School Administrator'],
    educationPath: ['B.Ed', 'Subject Specialization', 'M.Ed', 'Ph.D (For Research)', 'Teaching Certifications'],
    skills: ['Patience', 'Communication', 'Empathy', 'Subject expertise'],
    requirements: ['High emotional intelligence (75%+)', 'Interest in teaching', 'Subject knowledge'],
    color: '#607D8B'
  },
  PSYCHOLOGY: {
    field: 'Psychology',
    category: 'Social Science',
    description: 'Understand human behavior and mental processes to help individuals and society',
    careerPaths: ['Clinical Psychologist', 'Counselor', 'Organizational Psychologist', 'Researcher', 'Therapist'],
    educationPath: ['B.A/B.Sc Psychology', 'M.A/M.Sc Psychology', 'Clinical Training', 'Ph.D (Optional)'],
    skills: ['Empathy', 'Observation', 'Analysis', 'Communication'],
    requirements: ['Very high emotional intelligence (80%+)', 'Interest in human behavior', 'Patience'],
    color: '#3F51B5'
  },
  
  // Creative Fields
  DESIGN: {
    field: 'Design',
    category: 'Creative',
    description: 'Create visual solutions, user experiences, and aesthetic products',
    careerPaths: ['Graphic Designer', 'UX/UI Designer', 'Product Designer', 'Fashion Designer', 'Interior Designer'],
    educationPath: ['BFA/B.Des', 'Portfolio Development', 'Design Certifications', 'Industry Projects'],
    skills: ['Creativity', 'Visual thinking', 'Innovation', 'Technical skills'],
    requirements: ['Creative interests', 'Visual orientation', 'Innovation mindset'],
    color: '#FF5722'
  }
};

export function analyzeRoadmap(completedTests: CompletedTest[], studentData: any): RoadmapAnalysis {
  console.log('Analyzing roadmap for completed tests:', completedTests.length);
  
  const psychometricTests = completedTests.filter(test => test.testType === 'psychometric');
  const academicTests = completedTests.filter(test => test.testType === 'academic');
  
  const isComplete = psychometricTests.length >= 5; // All 5 mandatory psychometric tests
  const completionPercentage = Math.min((psychometricTests.length / 5) * 100, 100);
  
  if (!isComplete) {
    return {
      isComplete: false,
      completionPercentage,
      topRecommendations: [],
      psychometricSummary: {
        aptitude: 0,
        emotionalIntelligence: 0,
        interests: [],
        personality: 'Unknown',
        learningStyle: 'Unknown',
      },
      academicStrengths: {
        science: 0,
        commerce: 0,
        arts: 0,
      },
      overallRecommendation: 'Complete all mandatory psychometric tests to get your personalized roadmap.',
      nextSteps: ['Complete remaining psychometric assessments', 'Take academic tests', 'Review results']
    };
  }
  
  // Analyze psychometric results
  const psychometricSummary = analyzePsychometricResults(psychometricTests);
  
  // Analyze academic results
  const academicStrengths = analyzeAcademicResults(academicTests);
  
  // Calculate field alignments
  const fieldAlignments = calculateFieldAlignments(psychometricSummary, academicStrengths, studentData);
  
  // Sort by alignment percentage
  const topRecommendations = fieldAlignments
    .sort((a, b) => b.alignmentPercentage - a.alignmentPercentage)
    .slice(0, 5);
    
  const overallRecommendation = generateOverallRecommendation(topRecommendations[0], psychometricSummary);
  const nextSteps = generateNextSteps(topRecommendations, psychometricSummary, academicStrengths);
  
  return {
    isComplete: true,
    completionPercentage: 100,
    topRecommendations,
    psychometricSummary,
    academicStrengths,
    overallRecommendation,
    nextSteps
  };
}

function analyzePsychometricResults(tests: CompletedTest[]) {
  const aptitudeTest = tests.find(t => t.testId.includes('Aptitude'));
  const emotionalTest = tests.find(t => t.testId.includes('Emotional'));
  const interestTest = tests.find(t => t.testId.includes('Interest'));
  const personalityTest = tests.find(t => t.testId.includes('Personality'));
  const orientationTest = tests.find(t => t.testId.includes('Orientation'));
  
  return {
    aptitude: aptitudeTest?.percentage || 0,
    emotionalIntelligence: emotionalTest?.percentage || 0,
    interests: deriveInterests(interestTest?.percentage || 0),
    personality: derivePersonality(personalityTest?.percentage || 0),
    learningStyle: deriveLearningStyle(orientationTest?.percentage || 0),
  };
}

function analyzeAcademicResults(tests: CompletedTest[]) {
  const scienceTests = tests.filter(t => t.testId.includes('Science'));
  const commerceTests = tests.filter(t => t.testId.includes('Commerce'));
  const artsTests = tests.filter(t => t.testId.includes('Arts'));
  
  return {
    science: scienceTests.length > 0 ? scienceTests.reduce((sum, t) => sum + t.percentage, 0) / scienceTests.length : 0,
    commerce: commerceTests.length > 0 ? commerceTests.reduce((sum, t) => sum + t.percentage, 0) / commerceTests.length : 0,
    arts: artsTests.length > 0 ? artsTests.reduce((sum, t) => sum + t.percentage, 0) / artsTests.length : 0,
  };
}

function calculateFieldAlignments(psychometric: any, academic: any, _studentData: any): FieldAlignment[] {
  const alignments: FieldAlignment[] = [];
  
  Object.entries(CAREER_FIELDS).forEach(([key, field]) => {
    let alignmentScore = 0;
    let matchingFactors: string[] = [];
    
    // Engineering alignment
    if (key === 'ENGINEERING') {
      alignmentScore += Math.min(psychometric.aptitude * 0.4, 40); // Max 40 points from aptitude
      alignmentScore += Math.min(academic.science * 0.3, 30); // Max 30 points from science
      alignmentScore += psychometric.aptitude > 70 ? 20 : 0; // Bonus for high aptitude
      alignmentScore += academic.science > 65 ? 10 : 0; // Bonus for good science
      
      if (psychometric.aptitude > 70) matchingFactors.push('Strong analytical skills');
      if (academic.science > 65) matchingFactors.push('Good science foundation');
      if (psychometric.learningStyle.includes('Systematic')) matchingFactors.push('Systematic learning approach');
    }
    
    // Medicine alignment
    else if (key === 'MEDICINE') {
      alignmentScore += Math.min(psychometric.emotionalIntelligence * 0.3, 30);
      alignmentScore += Math.min(academic.science * 0.3, 30);
      alignmentScore += Math.min(psychometric.aptitude * 0.2, 20);
      alignmentScore += psychometric.emotionalIntelligence > 75 ? 15 : 0;
      alignmentScore += academic.science > 70 ? 5 : 0;
      
      if (psychometric.emotionalIntelligence > 75) matchingFactors.push('High emotional intelligence');
      if (academic.science > 70) matchingFactors.push('Strong science background');
      if (psychometric.interests.includes('Helping others')) matchingFactors.push('Interest in helping others');
    }
    
    // Computer Science alignment
    else if (key === 'COMPUTER_SCIENCE') {
      alignmentScore += Math.min(psychometric.aptitude * 0.4, 40);
      alignmentScore += Math.min(academic.science * 0.2, 20);
      alignmentScore += psychometric.aptitude > 75 ? 25 : 0;
      alignmentScore += psychometric.interests.includes('Technology') ? 15 : 0;
      
      if (psychometric.aptitude > 75) matchingFactors.push('Excellent problem-solving skills');
      if (psychometric.interests.includes('Technology')) matchingFactors.push('Strong interest in technology');
      if (psychometric.learningStyle.includes('Analytical')) matchingFactors.push('Analytical learning style');
    }
    
    // Business Management alignment
    else if (key === 'BUSINESS_MANAGEMENT') {
      alignmentScore += Math.min(psychometric.emotionalIntelligence * 0.3, 30);
      alignmentScore += Math.min(academic.commerce * 0.25, 25);
      alignmentScore += Math.min(psychometric.aptitude * 0.2, 20);
      alignmentScore += psychometric.personality.includes('Leader') ? 20 : 0;
      alignmentScore += psychometric.emotionalIntelligence > 65 ? 5 : 0;
      
      if (psychometric.emotionalIntelligence > 65) matchingFactors.push('Good interpersonal skills');
      if (psychometric.personality.includes('Leader')) matchingFactors.push('Natural leadership qualities');
      if (academic.commerce > 60) matchingFactors.push('Business acumen');
    }
    
    // Finance alignment
    else if (key === 'FINANCE') {
      alignmentScore += Math.min(psychometric.aptitude * 0.3, 30);
      alignmentScore += Math.min(academic.commerce * 0.3, 30);
      alignmentScore += Math.min(psychometric.aptitude * 0.2, 20);
      alignmentScore += academic.commerce > 70 ? 15 : 0;
      alignmentScore += psychometric.aptitude > 65 ? 5 : 0;
      
      if (psychometric.aptitude > 65) matchingFactors.push('Strong numerical abilities');
      if (academic.commerce > 70) matchingFactors.push('Excellent commerce foundation');
      if (psychometric.interests.includes('Analytics')) matchingFactors.push('Interest in data analysis');
    }
    
    // Media & Communication alignment
    else if (key === 'MEDIA_COMMUNICATION') {
      alignmentScore += Math.min(psychometric.emotionalIntelligence * 0.3, 30);
      alignmentScore += Math.min(academic.arts * 0.25, 25);
      alignmentScore += psychometric.interests.includes('Creative') ? 25 : 0;
      alignmentScore += psychometric.emotionalIntelligence > 70 ? 15 : 0;
      alignmentScore += academic.arts > 65 ? 5 : 0;
      
      if (psychometric.emotionalIntelligence > 70) matchingFactors.push('Excellent communication skills');
      if (psychometric.interests.includes('Creative')) matchingFactors.push('Creative interests');
      if (academic.arts > 65) matchingFactors.push('Strong arts background');
    }
    
    // Education alignment
    else if (key === 'EDUCATION') {
      alignmentScore += Math.min(psychometric.emotionalIntelligence * 0.4, 40);
      alignmentScore += Math.min(academic.arts * 0.2, 20);
      alignmentScore += psychometric.interests.includes('Teaching') ? 25 : 0;
      alignmentScore += psychometric.emotionalIntelligence > 75 ? 10 : 0;
      alignmentScore += psychometric.personality.includes('Patient') ? 5 : 0;
      
      if (psychometric.emotionalIntelligence > 75) matchingFactors.push('Excellent empathy and patience');
      if (psychometric.interests.includes('Teaching')) matchingFactors.push('Passion for teaching');
      if (psychometric.personality.includes('Patient')) matchingFactors.push('Patient personality');
    }
    
    // Psychology alignment
    else if (key === 'PSYCHOLOGY') {
      alignmentScore += Math.min(psychometric.emotionalIntelligence * 0.5, 50);
      alignmentScore += Math.min(academic.arts * 0.15, 15);
      alignmentScore += psychometric.interests.includes('Human behavior') ? 20 : 0;
      alignmentScore += psychometric.emotionalIntelligence > 80 ? 10 : 0;
      alignmentScore += psychometric.personality.includes('Empathetic') ? 5 : 0;
      
      if (psychometric.emotionalIntelligence > 80) matchingFactors.push('Exceptional emotional intelligence');
      if (psychometric.interests.includes('Human behavior')) matchingFactors.push('Interest in human psychology');
      if (psychometric.personality.includes('Empathetic')) matchingFactors.push('Naturally empathetic');
    }
    
    // Design alignment
    else if (key === 'DESIGN') {
      alignmentScore += psychometric.interests.includes('Creative') ? 40 : 0;
      alignmentScore += Math.min(academic.arts * 0.2, 20);
      alignmentScore += psychometric.interests.includes('Visual') ? 25 : 0;
      alignmentScore += psychometric.personality.includes('Creative') ? 10 : 0;
      alignmentScore += academic.arts > 70 ? 5 : 0;
      
      if (psychometric.interests.includes('Creative')) matchingFactors.push('Strong creative interests');
      if (psychometric.interests.includes('Visual')) matchingFactors.push('Visual orientation');
      if (psychometric.personality.includes('Creative')) matchingFactors.push('Creative personality');
    }
    
    // Ensure alignment doesn't exceed 100%
    alignmentScore = Math.min(alignmentScore, 100);
    
    alignments.push({
      field: field.field,
      category: field.category,
      alignmentPercentage: Math.round(alignmentScore),
      strengths: matchingFactors,
      requirements: field.requirements,
      description: field.description,
      careerPaths: field.careerPaths,
      educationPath: field.educationPath,
      skills: field.skills,
      color: field.color
    });
  });
  
  return alignments;
}

function deriveInterests(score: number): string[] {
  const interests = [];
  if (score > 70) {
    interests.push('Creative', 'Analytical', 'Technology');
  } else if (score > 50) {
    interests.push('Helping others', 'Teaching');
  } else {
    interests.push('Practical', 'Structured');
  }
  return interests;
}

function derivePersonality(score: number): string {
  if (score > 80) return 'Leader, Empathetic, Creative';
  if (score > 60) return 'Collaborative, Patient, Analytical';
  return 'Independent, Focused, Systematic';
}

function deriveLearningStyle(score: number): string {
  if (score > 70) return 'Systematic, Analytical';
  if (score > 50) return 'Visual, Interactive';
  return 'Practical, Hands-on';
}

function generateOverallRecommendation(topField: FieldAlignment, psychometric: any): string {
  return `Based on your comprehensive assessment, ${topField.field} shows the highest alignment (${topField.alignmentPercentage}%) with your aptitude and interests. Your strong ${psychometric.aptitude > 70 ? 'analytical abilities' : 'interpersonal skills'} and ${psychometric.emotionalIntelligence > 70 ? 'emotional intelligence' : 'problem-solving skills'} make you well-suited for this field.`;
}

function generateNextSteps(recommendations: FieldAlignment[], psychometric: any, _academic: any): string[] {
  const steps = [];
  const topField = recommendations[0];
  
  steps.push(`Research ${topField.field} career opportunities and requirements`);
  steps.push(`Connect with professionals in ${topField.field} for mentorship`);
  steps.push(`Consider ${topField.educationPath[0]} as your next educational step`);
  
  if (psychometric.aptitude < 70 && topField.field.includes('Engineering')) {
    steps.push('Strengthen mathematical and analytical skills');
  }
  
  if (psychometric.emotionalIntelligence < 70 && ['Medicine', 'Education', 'Psychology'].some(f => topField.field.includes(f))) {
    steps.push('Develop emotional intelligence and interpersonal skills');
  }
  
  steps.push('Take relevant online courses or certifications');
  steps.push('Build a portfolio of projects in your chosen field');
  
  return steps;
}
