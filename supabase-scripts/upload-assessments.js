const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client with your credentials
const supabaseUrl = 'https://tjxduuwnwxuasxkavulv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeGR1dXdud3h1YXN4a2F2dWx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM5Nzk0OCwiZXhwIjoyMDY1OTczOTQ4fQ.C4As-CNO8nG9NpcWqpXQ-XY94dvI2URp-7SwzL6UX5w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndVerifyAssessments() {
  try {
    const jsonDir = path.join(__dirname, ''); // Current directory

    // Get all JSON files
    const files = await fs.readdir(jsonDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    for (const file of jsonFiles) {
      console.log(`Processing file: ${file}`);
      const filePath = path.join(jsonDir, file);
      const data = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(data);

      let classLevel = 'UG';
      let stream = 'general_knowledge';

      if (file.includes('10th')) {
        classLevel = '10';
        stream = file.includes('Arts') ? 'Arts' : file.includes('Commerce') ? 'Commerce' : file.includes('Science') ? 'Science' : 'general_knowledge';
      } else if (file.includes('11th12th')) {
        classLevel = '11_12';
        stream = file.includes('Arts') ? 'Arts' : file.includes('Commerce') ? 'Commerce' : file.includes('Science') ? 'Science' : file.includes('MassComm') ? 'MassComm' : 'general_knowledge';
      } else if (file.includes('UG')) {
        classLevel = 'UG';
        stream = file.includes('Arts') ? 'Arts' : file.includes('Commerce') ? 'Commerce' : file.includes('Science') ? 'Science' : file.includes('MassComm') ? 'MassComm' : 'general_knowledge';
      }

      const assessments = jsonData.questions.map((question) => ({
        class_level: classLevel,
        stream: stream,
        question_id: question.question_id, // Changed from question.id to question.question_id
        question_text: question.question_text,
        question_type: question.question_type || 'mcq', // Default to 'mcq' if not present
        options: JSON.stringify(question.options.map(opt => opt.text)), // Extract text from options objects
        correct_answer: question.correct_answer,
      }));

      // Upload data
      const { data: insertData, error } = await supabase.from('assessments').insert(assessments);
      if (error) throw error;

      console.log(`Assessments uploaded successfully from ${file}:`, insertData);

      // Verify uploaded data
      const { data: verifyData, error: verifyError } = await supabase
        .from('assessments')
        .select('*')
        .eq('class_level', classLevel)
        .eq('stream', stream)
        .in('question_id', assessments.map(a => a.question_id));

      if (verifyError) throw verifyError;

      console.log(`Verified ${verifyData.length} records for ${file} (class: ${classLevel}, stream: ${stream}):`, verifyData);
    }
  } catch (error) {
    console.error('Error uploading or verifying assessments:', error.message);
  }
}

uploadAndVerifyAssessments();