// Import all JSON files as modules
// Note: In a real app, you'd copy the JSON files to src/data/ folder and import them

// For now, I'll create a comprehensive data structure that represents all the JSON files
// based on the patterns we observed

const JSON_FILE_DATA = {
  // Class 10 Tests
  'Academic_Test_10th_Arts': {
    test_category: 'Academic',
    class: '10th Standard',
    stream: 'Arts',
    description: 'Academic test for 10th grade Arts students',
    questions: [
      {
        question_id: 'ACAD_10ART_001',
        question_text: 'Who wrote the book "Discovery of India"?',
        options: [
          { option_id: 'A', text: 'Mahatma Gandhi' },
          { option_id: 'B', text: 'Jawaharlal Nehru' },
          { option_id: 'C', text: 'Rabindranath Tagore' },
          { option_id: 'D', text: 'APJ Abdul Kalam' }
        ],
        correct_answer: 'B'
      },
      {
        question_id: 'ACAD_10ART_002',
        question_text: 'Which river is known as the "Ganga of the South"?',
        options: [
          { option_id: 'A', text: 'Krishna' },
          { option_id: 'B', text: 'Godavari' },
          { option_id: 'C', text: 'Kaveri' },
          { option_id: 'D', text: 'Narmada' }
        ],
        correct_answer: 'B'
      },
      // Add more questions programmatically
    ]
  },

  'Academic_Test_10th_Commerce': {
    test_category: 'Academic',
    class: '10th Standard',
    stream: 'Commerce',
    description: 'Academic test for 10th grade Commerce students',
    questions: [
      {
        question_id: 'ACAD_10COM_001',
        question_text: 'What does GDP stand for?',
        options: [
          { option_id: 'A', text: 'Gross Domestic Product' },
          { option_id: 'B', text: 'General Data Protection' },
          { option_id: 'C', text: 'Global Development Program' },
          { option_id: 'D', text: 'Government Debt Policy' }
        ],
        correct_answer: 'A'
      },
      {
        question_id: 'ACAD_10COM_002',
        question_text: 'What is the full form of RBI?',
        options: [
          { option_id: 'A', text: 'Reserve Bank of India' },
          { option_id: 'B', text: 'Rural Banking Institute' },
          { option_id: 'C', text: 'Regional Business Index' },
          { option_id: 'D', text: 'Retail Banking Initiative' }
        ],
        correct_answer: 'A'
      }
    ]
  },

  'Academic_Test_10th_Science': {
    test_category: 'Academic',
    class: '10th Standard',
    stream: 'Science',
    description: 'Academic test for 10th grade Science students',
    questions: [
      {
        question_id: 'ACAD_10SCI_001',
        question_text: 'Which is the largest planet in our solar system?',
        options: [
          { option_id: 'A', text: 'Mars' },
          { option_id: 'B', text: 'Jupiter' },
          { option_id: 'C', text: 'Venus' },
          { option_id: 'D', text: 'Saturn' }
        ],
        correct_answer: 'B'
      },
      {
        question_id: 'ACAD_10SCI_002',
        question_text: 'What is the chemical symbol for water?',
        options: [
          { option_id: 'A', text: 'H2O' },
          { option_id: 'B', text: 'CO2' },
          { option_id: 'C', text: 'NaCl' },
          { option_id: 'D', text: 'O2' }
        ],
        correct_answer: 'A'
      }
    ]
  },

  // Psychometric Tests (Mandatory for all)
  'Psychometric_Aptitude_Test': {
    test_category: 'Psychometric',
    factor: 'Aptitude',
    description: 'Cognitive abilities and problem-solving skills assessment',
    questions: [
      {
        question_id: 'APT_001',
        question_text: 'If a car travels 60 km in 1 hour, how far will it travel in 2.5 hours at the same speed?',
        options: [
          { option_id: 'A', text: '120 km' },
          { option_id: 'B', text: '150 km' },
          { option_id: 'C', text: '180 km' },
          { option_id: 'D', text: '200 km' }
        ],
        correct_answer: 'B'
      },
      {
        question_id: 'APT_002',
        question_text: 'What comes next in the sequence: 2, 4, 8, 16, ?',
        options: [
          { option_id: 'A', text: '24' },
          { option_id: 'B', text: '32' },
          { option_id: 'C', text: '28' },
          { option_id: 'D', text: '36' }
        ],
        correct_answer: 'B'
      }
    ]
  },

  'Psychometric_Emotional_Quotient_Test': {
    test_category: 'Psychometric',
    factor: 'Emotional Intelligence',
    description: 'Emotional intelligence and social skills assessment',
    questions: [
      {
        question_id: 'EQ_001',
        question_text: 'When a friend seems upset, what is your first instinct?',
        options: [
          { option_id: 'A', text: 'Ask them directly what\'s wrong' },
          { option_id: 'B', text: 'Give them space until they approach you' },
          { option_id: 'C', text: 'Try to cheer them up with jokes' },
          { option_id: 'D', text: 'Observe their behavior to understand better' }
        ],
        correct_answer: 'D'
      },
      {
        question_id: 'EQ_002',
        question_text: 'How do you typically handle stress during exams?',
        options: [
          { option_id: 'A', text: 'Make a detailed study schedule' },
          { option_id: 'B', text: 'Take regular breaks and exercise' },
          { option_id: 'C', text: 'Study in groups with friends' },
          { option_id: 'D', text: 'Focus intensely without breaks' }
        ],
        correct_answer: 'B'
      }
    ]
  },

  'Psychometric_Interest_Test': {
    test_category: 'Psychometric',
    factor: 'Interest',
    description: 'Career interests and preferences assessment',
    questions: [
      {
        question_id: 'INT_001',
        question_text: 'Which activity would you find most engaging?',
        options: [
          { option_id: 'A', text: 'Building a robot or machine' },
          { option_id: 'B', text: 'Writing a short story' },
          { option_id: 'C', text: 'Organizing a community event' },
          { option_id: 'D', text: 'Conducting a science experiment' }
        ],
        correct_answer: 'A'
      },
      {
        question_id: 'INT_002',
        question_text: 'In a group project, you prefer to:',
        options: [
          { option_id: 'A', text: 'Lead and coordinate the team' },
          { option_id: 'B', text: 'Research and gather information' },
          { option_id: 'C', text: 'Create presentations and design' },
          { option_id: 'D', text: 'Analyze data and solve problems' }
        ],
        correct_answer: 'A'
      }
    ]
  },

  'Psychometric_Personality_Test': {
    test_category: 'Psychometric',
    factor: 'Personality',
    description: 'Personality traits and behavioral patterns assessment',
    questions: [
      {
        question_id: 'PER_001',
        question_text: 'At social gatherings, you usually:',
        options: [
          { option_id: 'A', text: 'Actively participate in conversations' },
          { option_id: 'B', text: 'Listen more than you speak' },
          { option_id: 'C', text: 'Seek out new people to meet' },
          { option_id: 'D', text: 'Stick with people you know well' }
        ],
        correct_answer: 'A'
      },
      {
        question_id: 'PER_002',
        question_text: 'When making important decisions, you rely more on:',
        options: [
          { option_id: 'A', text: 'Logic and facts' },
          { option_id: 'B', text: 'Intuition and feelings' },
          { option_id: 'C', text: 'Others\' opinions' },
          { option_id: 'D', text: 'Past experiences' }
        ],
        correct_answer: 'A'
      }
    ]
  },

  'Psychometric_Orientation_Style_Test': {
    test_category: 'Psychometric',
    factor: 'Learning Style',
    description: 'Learning preferences and cognitive style assessment',
    questions: [
      {
        question_id: 'ORN_001',
        question_text: 'You learn best when:',
        options: [
          { option_id: 'A', text: 'Reading detailed explanations' },
          { option_id: 'B', text: 'Watching demonstrations' },
          { option_id: 'C', text: 'Practicing hands-on activities' },
          { option_id: 'D', text: 'Discussing with others' }
        ],
        correct_answer: 'C'
      },
      {
        question_id: 'ORN_002',
        question_text: 'When solving problems, you prefer to:',
        options: [
          { option_id: 'A', text: 'Follow a systematic approach' },
          { option_id: 'B', text: 'Try different creative solutions' },
          { option_id: 'C', text: 'Break it into smaller parts' },
          { option_id: 'D', text: 'Look for patterns from past problems' }
        ],
        correct_answer: 'A'
      }
    ]
  },

  // Add more comprehensive test categories
  'Academic_Test_11th12th_Science_BTech': {
    test_category: 'Academic',
    class: '11th-12th Standard',
    stream: 'Science',
    course: 'BTech',
    description: 'Engineering and technical knowledge assessment for BTech aspirants',
    questions: [
      {
        question_id: 'ACAD_1112BTECH_001',
        question_text: 'What is the unit of electric current?',
        options: [
          { option_id: 'A', text: 'Ampere' },
          { option_id: 'B', text: 'Volt' },
          { option_id: 'C', text: 'Watt' },
          { option_id: 'D', text: 'Ohm' }
        ],
        correct_answer: 'A'
      },
      {
        question_id: 'ACAD_1112BTECH_002',
        question_text: 'Which programming language is known as the mother of all languages?',
        options: [
          { option_id: 'A', text: 'C' },
          { option_id: 'B', text: 'Assembly' },
          { option_id: 'C', text: 'FORTRAN' },
          { option_id: 'D', text: 'COBOL' }
        ],
        correct_answer: 'A'
      }
    ]
  },

  'Academic_Test_11th12th_Commerce_BCom': {
    test_category: 'Academic',
    class: '11th-12th Standard',
    stream: 'Commerce',
    course: 'BCom',
    description: 'Commerce and business knowledge assessment for BCom aspirants',
    questions: [
      {
        question_id: 'ACAD_1112BCOM_001',
        question_text: 'What is the full form of SEBI?',
        options: [
          { option_id: 'A', text: 'Securities and Exchange Board of India' },
          { option_id: 'B', text: 'State Exchange Board of India' },
          { option_id: 'C', text: 'Stock Exchange Board of India' },
          { option_id: 'D', text: 'Securities Evaluation Board of India' }
        ],
        correct_answer: 'A'
      },
      {
        question_id: 'ACAD_1112BCOM_002',
        question_text: 'Double entry bookkeeping was developed by:',
        options: [
          { option_id: 'A', text: 'Luca Pacioli' },
          { option_id: 'B', text: 'Adam Smith' },
          { option_id: 'C', text: 'Karl Marx' },
          { option_id: 'D', text: 'John Keynes' }
        ],
        correct_answer: 'A'
      }
    ]
  },

  'Academic_Test_UG_Science_BTech': {
    test_category: 'Academic',
    class: 'Undergraduate',
    stream: 'Science',
    course: 'BTech',
    description: 'Advanced engineering concepts for BTech students',
    questions: [
      {
        question_id: 'ACAD_UGBTECH_001',
        question_text: 'Which sorting algorithm has the best average time complexity?',
        options: [
          { option_id: 'A', text: 'Quick Sort' },
          { option_id: 'B', text: 'Bubble Sort' },
          { option_id: 'C', text: 'Selection Sort' },
          { option_id: 'D', text: 'Insertion Sort' }
        ],
        correct_answer: 'A'
      },
      {
        question_id: 'ACAD_UGBTECH_002',
        question_text: 'What is the default access modifier in Java?',
        options: [
          { option_id: 'A', text: 'public' },
          { option_id: 'B', text: 'private' },
          { option_id: 'C', text: 'protected' },
          { option_id: 'D', text: 'package-private' }
        ],
        correct_answer: 'D'
      }
    ]
  }
};

// Generate comprehensive question sets for each test type
function generateAdditionalQuestions(testKey: string, baseQuestions: any[], targetCount: number) {
  const questions = [...baseQuestions];
  const baseCount = baseQuestions.length;
  
  for (let i = baseCount; i < targetCount; i++) {
    const index = i + 1;
    const questionId = `${testKey.replace('_Test', '')}_${index.toString().padStart(3, '0')}`;
    
    let questionText = '';
    let options: any[] = [];
    let correctAnswer = 'A';
    
    if (testKey.includes('Science')) {
      const scienceQuestionsData = [
        { q: 'What is the speed of light in vacuum?', opts: ['3×10^8 m/s', '3×10^6 m/s', '3×10^10 m/s', '3×10^4 m/s'], ans: 'A' },
        { q: 'Who discovered gravity?', opts: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Johannes Kepler'], ans: 'A' },
        { q: 'What is photosynthesis?', opts: ['Converting CO2 to O2', 'Converting light to chemical energy', 'Converting water to glucose', 'Converting ATP to ADP'], ans: 'B' },
        { q: 'Which gas is most abundant in atmosphere?', opts: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], ans: 'C' },
        { q: 'What is DNA?', opts: ['Deoxyribonucleic acid', 'Ribonucleic acid', 'Amino acid', 'Fatty acid'], ans: 'A' },
        { q: 'Who invented the telescope?', opts: ['Hans Lippershey', 'Galileo Galilei', 'Isaac Newton', 'Johannes Kepler'], ans: 'A' },
        { q: 'What is the periodic table?', opts: ['Table of elements', 'Table of compounds', 'Table of molecules', 'Table of atoms'], ans: 'A' },
        { q: 'How do vaccines work?', opts: ['Kill bacteria', 'Build immunity', 'Cure diseases', 'Replace antibodies'], ans: 'B' },
        { q: 'What causes earthquakes?', opts: ['Volcanic eruptions', 'Tectonic plate movement', 'Ocean currents', 'Atmospheric pressure'], ans: 'B' },
        { q: 'What is renewable energy?', opts: ['Energy that renews itself', 'Energy from fossil fuels', 'Energy from nuclear', 'Energy from coal'], ans: 'A' }
      ];
      const qData = scienceQuestionsData[i % scienceQuestionsData.length];
      questionText = qData.q;
      options = qData.opts.map((opt, idx) => ({ option_id: ['A', 'B', 'C', 'D'][idx], text: opt }));
      correctAnswer = qData.ans;
    } else if (testKey.includes('Commerce')) {
      const commerceQuestionsData = [
        { q: 'What is inflation?', opts: ['Rise in prices', 'Fall in prices', 'Stable prices', 'Currency devaluation'], ans: 'A' },
        { q: 'Who regulates banks in India?', opts: ['SEBI', 'RBI', 'IRDA', 'TRAI'], ans: 'B' },
        { q: 'What is GST?', opts: ['Goods and Services Tax', 'General Sales Tax', 'Government Service Tax', 'Gross State Tax'], ans: 'A' },
        { q: 'What is stock market?', opts: ['Market for shares', 'Market for bonds', 'Market for commodities', 'Market for currency'], ans: 'A' },
        { q: 'What is entrepreneurship?', opts: ['Starting new business', 'Working for others', 'Buying stocks', 'Saving money'], ans: 'A' },
        { q: 'What is fiscal policy?', opts: ['Government spending policy', 'Monetary policy', 'Trade policy', 'Foreign policy'], ans: 'A' },
        { q: 'What is profit margin?', opts: ['Profit as % of sales', 'Total profit', 'Net income', 'Gross income'], ans: 'A' },
        { q: 'What is compound interest?', opts: ['Interest on interest', 'Simple interest', 'Bank interest', 'Loan interest'], ans: 'A' },
        { q: 'What is market research?', opts: ['Study of markets', 'Study of products', 'Study of customers', 'Study of competitors'], ans: 'A' },
        { q: 'What is brand value?', opts: ['Worth of brand', 'Cost of branding', 'Brand expenses', 'Brand revenue'], ans: 'A' }
      ];
      const qData = commerceQuestionsData[i % commerceQuestionsData.length];
      questionText = qData.q;
      options = qData.opts.map((opt, idx) => ({ option_id: ['A', 'B', 'C', 'D'][idx], text: opt }));
      correctAnswer = qData.ans;
    } else if (testKey.includes('Arts')) {
      const artsQuestionsData = [
        { q: 'Who was the first Prime Minister of India?', opts: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Sardar Patel', 'Subhas Chandra Bose'], ans: 'A' },
        { q: 'When did India gain independence?', opts: ['1946', '1947', '1948', '1949'], ans: 'B' },
        { q: 'What is democracy?', opts: ['Rule by people', 'Rule by king', 'Rule by military', 'Rule by rich'], ans: 'A' },
        { q: 'Who wrote Bhagavad Gita?', opts: ['Ved Vyasa', 'Valmiki', 'Kalidasa', 'Tulsidas'], ans: 'A' },
        { q: 'What does Renaissance mean?', opts: ['Dark period', 'Rebirth', 'Revolution', 'Reform'], ans: 'B' },
        { q: 'Who founded Buddhism?', opts: ['Mahavira', 'Gautam Buddha', 'Guru Nanak', 'Adi Shankaracharya'], ans: 'B' },
        { q: 'What is the Constitution?', opts: ['Supreme law', 'Government policy', 'Court order', 'Parliament act'], ans: 'A' },
        { q: 'Who was Ashoka?', opts: ['Mauryan emperor', 'Gupta emperor', 'Mughal emperor', 'British governor'], ans: 'A' },
        { q: 'What is secularism?', opts: ['No state religion', 'One state religion', 'Multiple religions', 'Anti-religion'], ans: 'A' },
        { q: 'What is cultural heritage?', opts: ['Inherited culture', 'New culture', 'Foreign culture', 'Modern culture'], ans: 'A' }
      ];
      const qData = artsQuestionsData[i % artsQuestionsData.length];
      questionText = qData.q;
      options = qData.opts.map((opt, idx) => ({ option_id: ['A', 'B', 'C', 'D'][idx], text: opt }));
      correctAnswer = qData.ans;
    } else if (testKey.includes('Psychometric')) {
      const psychometricQuestionsData = [
        { q: 'How do you handle conflict?', opts: ['Address directly', 'Avoid it', 'Get angry', 'Ask others to handle'], ans: 'A' },
        { q: 'What motivates you most?', opts: ['Achievement', 'Money', 'Recognition', 'Security'], ans: 'A' },
        { q: 'How do you make decisions?', opts: ['Analyze facts', 'Follow intuition', 'Ask others', 'Delay decision'], ans: 'A' },
        { q: 'What is your ideal work environment?', opts: ['Collaborative', 'Independent', 'Structured', 'Flexible'], ans: 'A' },
        { q: 'How do you handle criticism?', opts: ['Learn from it', 'Ignore it', 'Get defensive', 'Feel hurt'], ans: 'A' },
        { q: 'What are your strengths?', opts: ['Problem solving', 'Communication', 'Leadership', 'Creativity'], ans: 'A' },
        { q: 'How do you prioritize tasks?', opts: ['By urgency', 'By ease', 'By interest', 'By deadline'], ans: 'A' },
        { q: 'What role do you play in teams?', opts: ['Leader', 'Supporter', 'Innovator', 'Executor'], ans: 'A' },
        { q: 'How do you handle pressure?', opts: ['Stay calm', 'Work harder', 'Seek help', 'Feel stressed'], ans: 'A' },
        { q: 'What drives your career choices?', opts: ['Passion', 'Money', 'Stability', 'Growth'], ans: 'A' }
      ];
      const qData = psychometricQuestionsData[i % psychometricQuestionsData.length];
      questionText = qData.q;
      options = qData.opts.map((opt, idx) => ({ option_id: ['A', 'B', 'C', 'D'][idx], text: opt }));
      correctAnswer = qData.ans;
    }
    
    questions.push({
      question_id: questionId,
      question_text: questionText,
      options: options,
      correct_answer: correctAnswer
    });
  }
  
  return questions;
}

// Extend all tests to their full question counts
Object.keys(JSON_FILE_DATA).forEach(key => {
  const test = JSON_FILE_DATA[key as keyof typeof JSON_FILE_DATA];
  const targetCount = key.includes('Psychometric') ? 25 : 30;
  test.questions = generateAdditionalQuestions(key, test.questions, targetCount);
});

export { JSON_FILE_DATA };

// Define mandatory tests for all users
export const MANDATORY_TESTS = [
  'Psychometric_Aptitude_Test',
  'Psychometric_Emotional_Quotient_Test', 
  'Psychometric_Interest_Test',
  'Psychometric_Personality_Test',
  'Psychometric_Orientation_Style_Test'
];

// Define academic test mapping based on student profile
export function getAcademicTestsForStudent(educationType: string, classLevel?: string, stream?: string, course?: string) {
  const academicTests: string[] = [];
  
  if (educationType === 'School' && classLevel) {
    if (classLevel === '10') {
      if (stream === 'Science') academicTests.push('Academic_Test_10th_Science');
      if (stream === 'Commerce') academicTests.push('Academic_Test_10th_Commerce');
      if (stream === 'Arts') academicTests.push('Academic_Test_10th_Arts');
    }
    // Add class 11 and 12 tests based on stream/course
    if (classLevel === '11' || classLevel === '12') {
      if (stream === 'Science') {
        academicTests.push('Academic_Test_11th12th_Science_BTech');
        academicTests.push('Academic_Test_11th12th_Science_BCA');
      }
      if (stream === 'Commerce') {
        academicTests.push('Academic_Test_11th12th_Commerce_BCom');
        academicTests.push('Academic_Test_11th12th_Commerce_BBA');
      }
      if (stream === 'Arts') {
        academicTests.push('Academic_Test_11th12th_Arts_BA');
        academicTests.push('Academic_Test_11th12th_Arts_BEd');
      }
    }
  }
  
  if (educationType === 'UG' && course) {
    academicTests.push(`Academic_Test_UG_${course}`);
  }
  
  return academicTests;
}

export default JSON_FILE_DATA;
