const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://tjxduuwnwxuasxkavulv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeGR1dXdud3h1YXN4a2F2dWx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTEwOTQzNywiZXhwIjoyMDUwNjg1NDM3fQ.lTJo5cz7MzMhQVuYLfKQ2IWnUMlKT6SLtZKD7Ol0gg8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping for file categories to database structure
const categoryMapping = {
  // Class 10
  'Academic_Test_10th_Arts.json': { class_level: '10', stream: 'Arts', course: null, year: null },
  'Academic_Test_10th_Commerce.json': { class_level: '10', stream: 'Commerce', course: null, year: null },
  'Academic_Test_10th_Science.json': { class_level: '10', stream: 'Science', course: null, year: null },
  
  // Class 11-12 (mapping to specific courses)
  'Academic_Test_11th12th_Arts_BA.json': { class_level: '11', stream: 'Arts', course: 'BA', year: null },
  'Academic_Test_11th12th_Arts_BEd.json': { class_level: '11', stream: 'Arts', course: 'BEd', year: null },
  'Academic_Test_11th12th_Arts_BFA.json': { class_level: '11', stream: 'Arts', course: 'BFA', year: null },
  'Academic_Test_11th12th_Arts_MassComm.json': { class_level: '11', stream: 'Arts', course: 'Mass Communication', year: null },
  'Academic_Test_11th12th_Commerce_BBA.json': { class_level: '11', stream: 'Commerce', course: 'BBA', year: null },
  'Academic_Test_11th12th_Commerce_BCom.json': { class_level: '11', stream: 'Commerce', course: 'BCom', year: null },
  'Academic_Test_11th12th_Commerce_BMS.json': { class_level: '11', stream: 'Commerce', course: 'BMS', year: null },
  'Academic_Test_11th12th_Commerce_CAFoundation.json': { class_level: '11', stream: 'Commerce', course: 'CA Foundation', year: null },
  'Academic_Test_11th12th_Science_BCA.json': { class_level: '11', stream: 'Science', course: 'BCA', year: null },
  'Academic_Test_11th12th_Science_BCS.json': { class_level: '11', stream: 'Science', course: 'BCS', year: null },
  'Academic_Test_11th12th_Science_BTech.json': { class_level: '11', stream: 'Science', course: 'BTech', year: null },
  'Academic_Test_11th12th_Science_MBBS.json': { class_level: '11', stream: 'Science', course: 'MBBS', year: null },
  
  // Class 12 (also create entries for class 12)
  'Academic_Test_11th12th_Arts_BA.json_12': { class_level: '12', stream: 'Arts', course: 'BA', year: null },
  'Academic_Test_11th12th_Arts_BEd.json_12': { class_level: '12', stream: 'Arts', course: 'BEd', year: null },
  'Academic_Test_11th12th_Arts_BFA.json_12': { class_level: '12', stream: 'Arts', course: 'BFA', year: null },
  'Academic_Test_11th12th_Arts_MassComm.json_12': { class_level: '12', stream: 'Arts', course: 'Mass Communication', year: null },
  'Academic_Test_11th12th_Commerce_BBA.json_12': { class_level: '12', stream: 'Commerce', course: 'BBA', year: null },
  'Academic_Test_11th12th_Commerce_BCom.json_12': { class_level: '12', stream: 'Commerce', course: 'BCom', year: null },
  'Academic_Test_11th12th_Commerce_BMS.json_12': { class_level: '12', stream: 'Commerce', course: 'BMS', year: null },
  'Academic_Test_11th12th_Commerce_CAFoundation.json_12': { class_level: '12', stream: 'Commerce', course: 'CA Foundation', year: null },
  'Academic_Test_11th12th_Science_BCA.json_12': { class_level: '12', stream: 'Science', course: 'BCA', year: null },
  'Academic_Test_11th12th_Science_BCS.json_12': { class_level: '12', stream: 'Science', course: 'BCS', year: null },
  'Academic_Test_11th12th_Science_BTech.json_12': { class_level: '12', stream: 'Science', course: 'BTech', year: null },
  'Academic_Test_11th12th_Science_MBBS.json_12': { class_level: '12', stream: 'Science', course: 'MBBS', year: null },
  
  // UG Courses
  'Academic_Test_UGBBA.json': { class_level: 'UG', stream: 'Commerce', course: 'BBA', year: '1' },
  'Academic_Test_UG_Arts_BEd.json': { class_level: 'UG', stream: 'Arts', course: 'BEd', year: '1' },
  'Academic_Test_UG_Arts_MassComm.json': { class_level: 'UG', stream: 'Arts', course: 'Mass Communication', year: '1' },
  'Academic_Test_UG_Commerce_BBA.json': { class_level: 'UG', stream: 'Commerce', course: 'BBA', year: '1' },
  'Academic_Test_UG_Commerce_BCom.json': { class_level: 'UG', stream: 'Commerce', course: 'BCom', year: '1' },
  'Academic_Test_UG_Commerce_BMS.json': { class_level: 'UG', stream: 'Commerce', course: 'BMS', year: '1' },
  'Academic_Test_UG_Commerce_CA.json': { class_level: 'UG', stream: 'Commerce', course: 'CA', year: '1' },
  'Academic_Test_UG_Science_BCA.json': { class_level: 'UG', stream: 'Science', course: 'BCA', year: '1' },
  'Academic_Test_UG_Science_BCS.json': { class_level: 'UG', stream: 'Science', course: 'BCS', year: '1' },
  'Academic_Test_UG_Science_BSc.json': { class_level: 'UG', stream: 'Science', course: 'BSc', year: '1' },
  'Academic_Test_UG_Science_BTech.json': { class_level: 'UG', stream: 'Science', course: 'BTech', year: '1' },
  'Academic_Test_UG_Science_MBBS.json': { class_level: 'UG', stream: 'Science', course: 'MBBS', year: '1' },
  'Academic__Test_UG_Arts_BFA.json': { class_level: 'UG', stream: 'Arts', course: 'BFA', year: '1' },
  
  // Psychometric Tests (general for all)
  'Psychometric_Aptitude_Test.json': { class_level: 'general', stream: 'general', course: 'Aptitude', year: null },
  'Psychometric_Emotional_Quotient_Test.json': { class_level: 'general', stream: 'general', course: 'EQ', year: null },
  'Psychometric_Interest_Test.json': { class_level: 'general', stream: 'general', course: 'Interest', year: null },
  'Psychometric_Orientation_Style_Test.json': { class_level: 'general', stream: 'general', course: 'Orientation', year: null },
  'Psychometric_Personality_Test.json': { class_level: 'general', stream: 'general', course: 'Personality', year: null },
};

async function clearExistingData() {
  console.log('Clearing existing assessments data...');
  const { error } = await supabase.from('assessments').delete().neq('id', 0);
  if (error) {
    console.error('Error clearing data:', error);
  } else {
    console.log('Existing data cleared successfully');
  }
}

function transformOptions(options) {
  // Handle both array of objects and simple array formats
  if (Array.isArray(options)) {
    if (options.length > 0 && typeof options[0] === 'object' && options[0].option_id) {
      // Format: [{"option_id": "A", "text": "Mars"}, ...]
      const optionsObj = {};
      options.forEach(opt => {
        optionsObj[opt.option_id.toLowerCase()] = opt.text;
      });
      return optionsObj;
    } else {
      // Format: ["Mars", "Jupiter", ...] 
      const optionsObj = {};
      const letters = ['a', 'b', 'c', 'd', 'e'];
      options.forEach((text, index) => {
        if (index < letters.length) {
          optionsObj[letters[index]] = text;
        }
      });
      return optionsObj;
    }
  }
  return options; // Already an object
}

async function uploadComprehensiveAssessments() {
  try {
    await clearExistingData();
    
    const jsonDir = path.join(__dirname, '');
    const files = await fs.readdir(jsonDir);
    const jsonFiles = files.filter(file => file.endsWith('.json') && !file.includes('package'));

    let totalUploaded = 0;

    for (const file of jsonFiles) {
      console.log(`\\nProcessing file: ${file}`);
      
      try {
        const filePath = path.join(jsonDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
          console.log(`Skipping ${file} - no questions array found`);
          continue;
        }

        // Process for both 11th and 12th class if it's an 11th12th file
        const categoriesToProcess = [];
        if (file.includes('11th12th')) {
          categoriesToProcess.push(categoryMapping[file]);
          categoriesToProcess.push(categoryMapping[file + '_12']);
        } else if (categoryMapping[file]) {
          categoriesToProcess.push(categoryMapping[file]);
        } else {
          console.log(`No mapping found for ${file}, skipping...`);
          continue;
        }

        for (const category of categoriesToProcess) {
          if (!category) continue;

          const assessments = jsonData.questions.map((question, index) => {
            const transformedOptions = transformOptions(question.options || []);
            
            return {
              class_level: category.class_level,
              stream: category.stream,
              course: category.course,
              year: category.year,
              question_id: question.question_id || `${file}_${index + 1}`,
              question_text: question.question_text || question.text || 'Question text not found',
              question_type: question.question_type || 'mcq',
              options: transformedOptions,
              correct_answer: (question.correct_answer || question.answer || 'a').toLowerCase(),
              subject: question.subject || jsonData.description || 'General',
              difficulty: question.difficulty || 'medium',
              explanation: question.explanation || '',
              created_at: new Date().toISOString(),
            };
          });

          // Upload in batches to avoid timeout
          const batchSize = 50;
          for (let i = 0; i < assessments.length; i += batchSize) {
            const batch = assessments.slice(i, i + batchSize);
            const { data: insertData, error } = await supabase
              .from('assessments')
              .insert(batch);
              
            if (error) {
              console.error(`Error uploading batch for ${file} (${category.class_level}-${category.stream}):`, error);
              continue;
            }
            
            totalUploaded += batch.length;
            console.log(`Uploaded batch ${Math.floor(i/batchSize) + 1} for ${file} (${category.class_level}-${category.stream}): ${batch.length} questions`);
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError.message);
      }
    }

    console.log(`\\n✅ Upload complete! Total questions uploaded: ${totalUploaded}`);
    
    // Verify upload by checking counts
    const { data: verifyData, error: verifyError } = await supabase
      .from('assessments')
      .select('class_level, stream, course, count(*)', { count: 'exact' });
      
    if (!verifyError && verifyData) {
      console.log('\\n📊 Upload verification:');
      const summary = {};
      
      for (const category of Object.values(categoryMapping)) {
        if (!category) continue;
        const key = `${category.class_level}-${category.stream}${category.course ? '-' + category.course : ''}`;
        summary[key] = (summary[key] || 0);
      }
      
      const { count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });
        
      console.log(`Total records in database: ${count}`);
      
      // Sample verification queries
      const classLevels = ['10', '11', '12', 'UG', 'general'];
      for (const level of classLevels) {
        const { count: levelCount } = await supabase
          .from('assessments')
          .select('*', { count: 'exact', head: true })
          .eq('class_level', level);
        console.log(`Class ${level}: ${levelCount} questions`);
      }
    }

  } catch (error) {
    console.error('❌ Error in comprehensive upload:', error);
  }
}

// Run the upload
uploadComprehensiveAssessments();
