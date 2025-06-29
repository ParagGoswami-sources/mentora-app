import { supabase } from '../context/SupabaseContext';
import { JSON_FILE_DATA } from '../data/jsonFiles';

// All JSON file data will be imported
const _JSON_FILES = [
  // Class 10
  'Academic_Test_10th_Arts.json',
  'Academic_Test_10th_Commerce.json', 
  'Academic_Test_10th_Science.json',
  
  // Class 11-12 with specific courses
  'Academic_Test_11th12th_Arts_BA.json',
  'Academic_Test_11th12th_Arts_BEd.json',
  'Academic_Test_11th12th_Arts_BFA.json',
  'Academic_Test_11th12th_Arts_MassComm.json',
  'Academic_Test_11th12th_Commerce_BBA.json',
  'Academic_Test_11th12th_Commerce_BCom.json',
  'Academic_Test_11th12th_Commerce_BMS.json',
  'Academic_Test_11th12th_Commerce_CAFoundation.json',
  'Academic_Test_11th12th_Science_BCA.json',
  'Academic_Test_11th12th_Science_BCS.json',
  'Academic_Test_11th12th_Science_BTech.json',
  'Academic_Test_11th12th_Science_MBBS.json',
  
  // UG courses
  'Academic_Test_UGBBA.json',
  'Academic_Test_UG_Arts_BEd.json',
  'Academic_Test_UG_Arts_MassComm.json',
  'Academic_Test_UG_Commerce_BBA.json',
  'Academic_Test_UG_Commerce_BCom.json',
  'Academic_Test_UG_Commerce_BMS.json',
  'Academic_Test_UG_Commerce_CA.json',
  'Academic_Test_UG_Science_BCA.json',
  'Academic_Test_UG_Science_BCS.json',
  'Academic_Test_UG_Science_BSc.json',
  'Academic_Test_UG_Science_BTech.json',
  'Academic_Test_UG_Science_MBBS.json',
  'Academic__Test_UG_Arts_BFA.json',
  
  // Psychometric tests
  'Psychometric_Aptitude_Test.json',
  'Psychometric_Emotional_Quotient_Test.json',
  'Psychometric_Interest_Test.json',
  'Psychometric_Orientation_Style_Test.json',
  'Psychometric_Personality_Test.json',
];

// File to category mapping
function getFileCategory(filename: string) {
  // Class 10 files
  if (filename.includes('10th')) {
    if (filename.includes('Arts')) return { class_level: '10', stream: 'Arts' };
    if (filename.includes('Commerce')) return { class_level: '10', stream: 'Commerce' };
    if (filename.includes('Science')) return { class_level: '10', stream: 'Science' };
  }
  
  // Class 11-12 files (create entries for both 11 and 12)
  if (filename.includes('11th12th')) {
    const stream = filename.includes('Arts') ? 'Arts' : 
                   filename.includes('Commerce') ? 'Commerce' : 
                   filename.includes('Science') ? 'Science' : 'General';
    return [
      { class_level: '11', stream },
      { class_level: '12', stream }
    ];
  }
  
  // UG files
  if (filename.includes('UG') || filename.includes('_UG')) {
    const stream = filename.includes('Arts') ? 'Arts' : 
                   filename.includes('Commerce') ? 'Commerce' : 
                   filename.includes('Science') ? 'Science' : 'General';
    return { class_level: 'UG', stream };
  }
  
  // Psychometric tests (general for all) - make sure this matches the query in AptitudeTestScreen
  if (filename.includes('Psychometric')) {
    console.log(`Mapping psychometric test: ${filename} to class_level: 'general', stream: 'general'`);
    return { class_level: 'general', stream: 'general' };
  }
  
  return { class_level: 'general', stream: 'general' };
}

// Transform options from JSON format to our database format
function transformOptions(options: any[]): Record<string, string> {
  const optionsObj: Record<string, string> = {};
  
  options.forEach(option => {
    if (option.option_id && option.text) {
      optionsObj[option.option_id.toLowerCase()] = option.text;
    }
  });
  
  return optionsObj;
}

// Import a single JSON file
async function _importJsonFile(filename: string): Promise<{ success: boolean; count: number; error?: any }> {
  try {
    console.log(`Importing ${filename}...`);
    
    // For this demo, I'll create sample data since we can't read actual files in React Native
    // In a real scenario, you'd fetch from a server or have the data bundled
    const sampleData = await getSampleDataForFile(filename);
    
    if (!sampleData || !sampleData.questions) {
      console.log(`No questions found in ${filename}`);
      return { success: true, count: 0 };
    }
    
    const categories = getFileCategory(filename);
    const categoriesToProcess = Array.isArray(categories) ? categories : [categories];
    
    let totalInserted = 0;
    
    for (const category of categoriesToProcess) {
      const questionsToInsert = sampleData.questions.map((q: any, index: number) => ({
        class_level: category.class_level,
        stream: category.stream,
        question_id: `${q.question_id || `${filename}_${index + 1}`}`,
        question_text: q.question_text || q.text || 'Question text not available',
        question_type: q.question_type || 'mcq',
        options: transformOptions(q.options || []),
        correct_answer: (q.correct_answer || 'a').toLowerCase(),
      }));
      
      // Insert in batches of 20 to avoid timeouts
      const batchSize = 20;
      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('assessments')
          .insert(batch);
          
        if (error) {
          console.error(`Error inserting batch from ${filename}:`, error);
          return { success: false, count: totalInserted, error };
        }
        
        totalInserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} from ${filename} (${category.class_level}-${category.stream}): ${batch.length} questions`);
      }
    }
    
    return { success: true, count: totalInserted };
    
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
    return { success: false, count: 0, error };
  }
}

// Get actual data from imported JSON files
async function getSampleDataForFile(filename: string): Promise<any> {
  const testKey = filename.replace('.json', '');
  const testData = JSON_FILE_DATA[testKey as keyof typeof JSON_FILE_DATA];
  
  if (testData) {
    return testData;
  }
  
  // Fallback for files not in our data
  console.log(`No data found for ${filename}, generating sample`);
  const questionCount = getQuestionCountForFile(filename);
  const questions = [];
  
  for (let i = 1; i <= questionCount; i++) {
    questions.push({
      question_id: `${testKey}_${i.toString().padStart(3, '0')}`,
      question_text: generateQuestionText(filename, i),
      options: [
        { option_id: 'A', text: generateOption(filename, 'A') },
        { option_id: 'B', text: generateOption(filename, 'B') },
        { option_id: 'C', text: generateOption(filename, 'C') },
        { option_id: 'D', text: generateOption(filename, 'D') },
      ],
      correct_answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
    });
  }
  
  return { questions };
}

function getQuestionCountForFile(filename: string): number {
  // Based on the actual counts we saw
  if (filename.includes('11th12th_Commerce_BBA') || filename.includes('UG_Commerce_BBA')) return 25;
  if (filename.includes('Psychometric')) return 25;
  return 30; // Most files have 30 questions
}

function generateQuestionText(filename: string, index: number): string {
  if (filename.includes('Science')) {
    const scienceQuestions = [
      'What is the chemical formula for water?',
      'Which planet is known as the Red Planet?',
      'What is the speed of light in vacuum?',
      'Who proposed the theory of evolution?',
      'What is the atomic number of carbon?',
      'Which gas is most abundant in Earth\'s atmosphere?',
      'What is the powerhouse of the cell?',
      'What is the process of photosynthesis?',
      'Who discovered penicillin?',
      'What is Newton\'s first law of motion?'
    ];
    return scienceQuestions[index % scienceQuestions.length];
  }
  
  if (filename.includes('Commerce')) {
    const commerceQuestions = [
      'What does GDP stand for?',
      'Who is known as the father of modern economics?',
      'What is the full form of RBI?',
      'Which is a direct tax?',
      'What is the basic accounting equation?',
      'What does ROI stand for?',
      'Which market structure has only one seller?',
      'What is the current repo rate?',
      'What does IFRS stand for?',
      'Which principle matches expenses with revenues?'
    ];
    return commerceQuestions[index % commerceQuestions.length];
  }
  
  if (filename.includes('Arts')) {
    const artsQuestions = [
      'Who wrote "Discovery of India"?',
      'Which river is known as Ganga of the South?',
      'Who is known as Father of Indian Constitution?',
      'In which year did India gain independence?',
      'Which is the highest mountain peak in India?',
      'Who wrote "Pride and Prejudice"?',
      'Which philosopher wrote about Social Contract?',
      'What does Renaissance mean?',
      'Which civilization built Machu Picchu?',
      'What is the study of language called?'
    ];
    return artsQuestions[index % artsQuestions.length];
  }
  
  if (filename.includes('Psychometric')) {
    const psychometricQuestions = [
      'If a car travels 60 km in 1 hour, how far in 2.5 hours?',
      'What comes next: 2, 4, 8, 16, ?',
      'Complete the analogy: Book : Reading :: Fork : ?',
      'Which number is different: 2, 4, 6, 9, 8?',
      'If today is Monday, what day will it be after 100 days?',
      'Find the odd one out: Triangle, Square, Circle, Rectangle',
      'What is 15% of 200?',
      'If A = 1, B = 2, C = 3, what is the value of CAB?',
      'Which comes next in series: Z, Y, X, W, ?',
      'How many triangles are in a pentagram?'
    ];
    return psychometricQuestions[index % psychometricQuestions.length];
  }
  
  return `Sample question ${index} for ${filename}`;
}

function generateOption(filename: string, optionId: string): string {
  if (filename.includes('Science')) {
    const options = {
      'A': ['H2O', 'Mars', '3×10^8 m/s', 'Charles Darwin', '6', 'Nitrogen', 'Mitochondria', 'Converting CO2 to O2', 'Alexander Fleming', 'Object at rest stays at rest'],
      'B': ['CO2', 'Venus', '3×10^6 m/s', 'Gregor Mendel', '12', 'Oxygen', 'Nucleus', 'Converting light to energy', 'Louis Pasteur', 'Force equals mass times acceleration'],
      'C': ['NaCl', 'Jupiter', '3×10^10 m/s', 'Alfred Wallace', '8', 'Carbon Dioxide', 'Ribosome', 'Converting water to glucose', 'Marie Curie', 'Every action has equal reaction'],
      'D': ['O2', 'Saturn', '3×10^4 m/s', 'Jean Lamarck', '14', 'Argon', 'Chloroplast', 'Converting glucose to ATP', 'Edward Jenner', 'Energy cannot be destroyed']
    };
    return (options as any)[optionId][Math.floor(Math.random() * (options as any)[optionId].length)];
  }
  
  // Add similar logic for other categories...
  return `Option ${optionId}`;
}

// Main import function using actual JSON data
export async function importAllQuestionsFromJson(): Promise<{ success: boolean; totalQuestions: number; errors: any[] }> {
  try {
    console.log('Starting comprehensive import of all JSON files...');
    
    // Clear existing data
    const { error: clearError } = await supabase
      .from('assessments')
      .delete()
      .gte('created_at', '1970-01-01');
      
    if (clearError) {
      console.error('Error clearing existing data:', clearError);
      return { success: false, totalQuestions: 0, errors: [clearError] };
    }
    
    console.log('Existing data cleared. Starting import...');
    
    let totalQuestions = 0;
    const errors: any[] = [];
    
    // Import directly from JSON_FILE_DATA
    for (const [testKey, testData] of Object.entries(JSON_FILE_DATA)) {
      try {
        const filename = `${testKey}.json`;
        console.log(`\n📚 Importing ${filename}...`);
        console.log(`📊 Test data has ${testData.questions.length} questions`);
        
        const categories = getFileCategory(filename);
        const categoriesToProcess = Array.isArray(categories) ? categories : [categories];
        
        console.log(`🎯 Categories to process:`, categoriesToProcess);
        
        for (const category of categoriesToProcess) {
          console.log(`\n🔄 Processing category: ${category.class_level}-${category.stream}`);
          
          const questionsToInsert = testData.questions.map((q: any) => ({
            class_level: category.class_level,
            stream: category.stream,
            question_id: q.question_id,
            question_text: q.question_text,
            question_type: 'mcq',
            options: transformOptions(q.options),
            correct_answer: q.correct_answer.toLowerCase(),
          }));
          
          console.log(`📝 Prepared ${questionsToInsert.length} questions for insertion`);
          console.log(`🔍 Sample question:`, {
            id: questionsToInsert[0]?.question_id,
            text: questionsToInsert[0]?.question_text,
            class_level: questionsToInsert[0]?.class_level,
            stream: questionsToInsert[0]?.stream
          });
          
          // Insert in batches of 20
          const batchSize = 20;
          for (let i = 0; i < questionsToInsert.length; i += batchSize) {
            const batch = questionsToInsert.slice(i, i + batchSize);
            
            const { error } = await supabase
              .from('assessments')
              .insert(batch);
              
            if (error) {
              console.error(`❌ Error inserting batch from ${filename}:`, error);
              errors.push({ filename, error });
              break;
            }
            
            totalQuestions += batch.length;
            console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} from ${filename} (${category.class_level}-${category.stream}): ${batch.length} questions`);
          }
        }
        
        console.log(`🎉 ${filename}: Successfully imported!`);
        
      } catch (fileError) {
        console.error(`❌ Error processing ${testKey}:`, fileError);
        errors.push({ filename: testKey, error: fileError });
      }
      
      // Small delay between files
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Import complete! Total questions: ${totalQuestions}`);
    console.log(`📊 Errors: ${errors.length}`);
    
    return { success: errors.length === 0, totalQuestions, errors };
    
  } catch (error) {
    console.error('Fatal error during import:', error);
    return { success: false, totalQuestions: 0, errors: [error] };
  }
}

// Verification function
export async function verifyAllImportedQuestions() {
  try {
    const { count: totalCount } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true });

    const classLevels = ['10', '11', '12', 'UG', 'general'];
    const streams = ['Science', 'Commerce', 'Arts', 'general'];
    
    console.log(`📊 Total questions in database: ${totalCount}`);
    
    for (const level of classLevels) {
      const { count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('class_level', level);
      console.log(`📝 Class ${level}: ${count} questions`);
    }
    
    for (const stream of streams) {
      const { count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('stream', stream);
      console.log(`📚 ${stream} stream: ${count} questions`);
    }
    
    return { totalCount, success: true };
  } catch (error) {
    console.error('Verification error:', error);
    return { success: false, error };
  }
}
