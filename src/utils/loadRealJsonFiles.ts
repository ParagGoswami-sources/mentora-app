import { supabase } from '../context/SupabaseContext';

// In React Native, we can't directly import JSON files from outside the src directory
// So we need to read them using a different approach

const JSON_FILES_MAPPING = {
  // Academic Tests - Class 10
  'Academic_Test_10th_Arts': require('../../supabase-scripts/Academic_Test_10th_Arts.json'),
  'Academic_Test_10th_Commerce': require('../../supabase-scripts/Academic_Test_10th_Commerce.json'),
  'Academic_Test_10th_Science': require('../../supabase-scripts/Academic_Test_10th_Science.json'),
  
  // Academic Tests - Class 11-12
  'Academic_Test_11th12th_Arts_BA': require('../../supabase-scripts/Academic_Test_11th12th_Arts_BA.json'),
  'Academic_Test_11th12th_Arts_BEd': require('../../supabase-scripts/Academic_Test_11th12th_Arts_BEd.json'),
  'Academic_Test_11th12th_Arts_BFA': require('../../supabase-scripts/Academic_Test_11th12th_Arts_BFA.json'),
  'Academic_Test_11th12th_Arts_MassComm': require('../../supabase-scripts/Academic_Test_11th12th_Arts_MassComm.json'),
  'Academic_Test_11th12th_Commerce_BBA': require('../../supabase-scripts/Academic_Test_11th12th_Commerce_BBA.json'),
  'Academic_Test_11th12th_Commerce_BCom': require('../../supabase-scripts/Academic_Test_11th12th_Commerce_BCom.json'),
  'Academic_Test_11th12th_Commerce_BMS': require('../../supabase-scripts/Academic_Test_11th12th_Commerce_BMS.json'),
  'Academic_Test_11th12th_Commerce_CAFoundation': require('../../supabase-scripts/Academic_Test_11th12th_Commerce_CAFoundation.json'),
  'Academic_Test_11th12th_Science_BCA': require('../../supabase-scripts/Academic_Test_11th12th_Science_BCA.json'),
  'Academic_Test_11th12th_Science_BCS': require('../../supabase-scripts/Academic_Test_11th12th_Science_BCS.json'),
  'Academic_Test_11th12th_Science_BTech': require('../../supabase-scripts/Academic_Test_11th12th_Science_BTech.json'),
  'Academic_Test_11th12th_Science_MBBS': require('../../supabase-scripts/Academic_Test_11th12th_Science_MBBS.json'),
  
  // Academic Tests - UG
  'Academic_Test_UGBBA': require('../../supabase-scripts/Academic_Test_UGBBA.json'),
  'Academic_Test_UG_Arts_BEd': require('../../supabase-scripts/Academic_Test_UG_Arts_BEd.json'),
  'Academic_Test_UG_Arts_MassComm': require('../../supabase-scripts/Academic_Test_UG_Arts_MassComm.json'),
  'Academic_Test_UG_Commerce_BBA': require('../../supabase-scripts/Academic_Test_UG_Commerce_BBA.json'),
  'Academic_Test_UG_Commerce_BCom': require('../../supabase-scripts/Academic_Test_UG_Commerce_BCom.json'),
  'Academic_Test_UG_Commerce_BMS': require('../../supabase-scripts/Academic_Test_UG_Commerce_BMS.json'),
  'Academic_Test_UG_Commerce_CA': require('../../supabase-scripts/Academic_Test_UG_Commerce_CA.json'),
  'Academic_Test_UG_Science_BCA': require('../../supabase-scripts/Academic_Test_UG_Science_BCA.json'),
  'Academic_Test_UG_Science_BCS': require('../../supabase-scripts/Academic_Test_UG_Science_BCS.json'),
  'Academic_Test_UG_Science_BSc': require('../../supabase-scripts/Academic_Test_UG_Science_BSc.json'),
  'Academic_Test_UG_Science_BTech': require('../../supabase-scripts/Academic_Test_UG_Science_BTech.json'),
  'Academic_Test_UG_Science_MBBS': require('../../supabase-scripts/Academic_Test_UG_Science_MBBS.json'),
  'Academic__Test_UG_Arts_BFA': require('../../supabase-scripts/Academic__Test_UG_Arts_BFA.json'),
  
  // Psychometric Tests
  'Psychometric_Aptitude_Test': require('../../supabase-scripts/Psychometric_Aptitude_Test.json'),
  'Psychometric_Emotional_Quotient_Test': require('../../supabase-scripts/Psychometric_Emotional_Quotient_Test.json'),
  'Psychometric_Interest_Test': require('../../supabase-scripts/Psychometric_Interest_Test.json'),
  'Psychometric_Orientation_Style_Test': require('../../supabase-scripts/Psychometric_Orientation_Style_Test.json'),
  'Psychometric_Personality_Test': require('../../supabase-scripts/Psychometric_Personality_Test.json'),
};

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
  
  // Psychometric tests (general for all)
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

// Import all real JSON files
export async function importAllRealJsonFiles(): Promise<{ success: boolean; totalQuestions: number; errors: any[] }> {
  try {
    console.log('🚀 Starting import of ALL REAL JSON files...');
    
    // Clear existing data
    const { error: clearError } = await supabase
      .from('assessments')
      .delete()
      .gte('created_at', '1970-01-01');
      
    if (clearError) {
      console.error('Error clearing existing data:', clearError);
      return { success: false, totalQuestions: 0, errors: [clearError] };
    }
    
    console.log('✅ Existing data cleared. Starting import...');
    
    let totalQuestions = 0;
    const errors: any[] = [];
    
    // Import from real JSON files
    for (const [testKey, testData] of Object.entries(JSON_FILES_MAPPING)) {
      try {
        const filename = `${testKey}.json`;
        console.log(`\n📚 Importing ${filename}...`);
        console.log(`📊 Test data has ${testData.questions.length} questions`);
        
        const categories = getFileCategory(filename);
        const categoriesToProcess = Array.isArray(categories) ? categories : [categories];
        
        console.log(`🎯 Categories to process:`, categoriesToProcess);
        
        for (const category of categoriesToProcess) {
          console.log(`\n🔄 Processing category: ${category.class_level}-${category.stream}`);
          
          const questionsToInsert = testData.questions.map((q: any) => {
            // For psychometric tests, there's no single correct answer
            let correctAnswer = 'a'; // default
            if (q.correct_answer) {
              correctAnswer = q.correct_answer.toLowerCase();
            } else if (filename.includes('Psychometric')) {
              // For psychometric tests, we'll use 'none' to indicate it's a personality assessment
              correctAnswer = 'none';
            }
            
            return {
              class_level: category.class_level,
              stream: category.stream,
              question_id: q.question_id,
              question_text: q.question_text,
              question_type: 'mcq', // Database only allows 'mcq' type
              options: transformOptions(q.options),
              correct_answer: correctAnswer,
            };
          });
          
          console.log(`📝 Prepared ${questionsToInsert.length} questions for insertion`);
          console.log(`🔍 Sample question:`, {
            id: questionsToInsert[0]?.question_id,
            text: questionsToInsert[0]?.question_text?.substring(0, 50) + '...',
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
    
    // Verify the results
    const { count: finalCount } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true });
    
    console.log(`🔍 Final verification: ${finalCount} questions in database`);
    
    return { success: errors.length === 0, totalQuestions, errors };
    
  } catch (error) {
    console.error('Fatal error during import:', error);
    return { success: false, totalQuestions: 0, errors: [error] };
  }
}

// Quick verification of loaded data
export function verifyLoadedData() {
  console.log('🔍 Verifying loaded JSON data...');
  
  let totalQuestions = 0;
  const fileStats: { [key: string]: number } = {};
  
  for (const [testKey, testData] of Object.entries(JSON_FILES_MAPPING)) {
    const questionCount = testData.questions.length;
    fileStats[testKey] = questionCount;
    totalQuestions += questionCount;
  }
  
  console.log(`📊 Total files loaded: ${Object.keys(JSON_FILES_MAPPING).length}`);
  console.log(`📊 Total questions available: ${totalQuestions}`);
  console.log('📋 File breakdown:', fileStats);
  
  return { totalFiles: Object.keys(JSON_FILES_MAPPING).length, totalQuestions, fileStats };
}
