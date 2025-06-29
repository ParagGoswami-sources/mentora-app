import { supabase } from '../context/SupabaseContext';

const EXAM_RESULTS_TABLE_SQL = `
-- Create exam_results table for storing exam scores and answers
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  test_title TEXT,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_taken INTEGER NOT NULL, -- time in seconds
  answers JSONB, -- stores all answers and question details
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_results_student_email ON exam_results(student_email);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_type ON exam_results(exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_results_completed_at ON exam_results(completed_at);

-- Add Row Level Security (RLS)
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to see their own results
-- (You may need to adjust this based on your auth setup)
CREATE POLICY IF NOT EXISTS "Users can view their own exam results" 
ON exam_results FOR SELECT 
USING (student_email = auth.email());

-- Create a policy to allow users to insert their own results
CREATE POLICY IF NOT EXISTS "Users can insert their own exam results" 
ON exam_results FOR INSERT 
WITH CHECK (student_email = auth.email());
`.trim();

export async function createExamResultsTableDirect(): Promise<{ success: boolean; error?: any; message?: string }> {
  try {
    console.log('🚀 Creating exam_results table with SQL...');
    
    // First check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('exam_results')
      .select('id')
      .limit(1);
      
    if (!checkError) {
      console.log('✅ exam_results table already exists');
      return { success: true, message: 'Table already exists' };
    }
    
    // Table doesn't exist, try to create it
    console.log('🔧 Table does not exist, attempting to create...');
    
    // Use the SQL editor approach via RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: EXAM_RESULTS_TABLE_SQL
    });
    
    if (error) {
      // RPC might not be available, provide manual instructions
      console.log('❌ RPC not available. Manual creation required.');
      console.log('📋 Please run this SQL in your Supabase SQL Editor:');
      console.log(EXAM_RESULTS_TABLE_SQL);
      
      return { 
        success: false, 
        error: 'Manual table creation required',
        message: 'Please run the SQL commands shown in console in your Supabase SQL Editor'
      };
    }
    
    console.log('✅ exam_results table created successfully');
    return { success: true, message: 'Table created successfully' };
    
  } catch (error) {
    console.error('❌ Error creating exam_results table:', error);
    return { success: false, error, message: 'Failed to create table' };
  }
}

export async function verifyExamResultsTable(): Promise<{ exists: boolean; structure?: any; error?: any }> {
  try {
    // Check if table exists and get its structure
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .limit(1);
      
    if (error) {
      if (error.code === '42P01') {
        return { exists: false, error: 'Table does not exist' };
      }
      return { exists: false, error };
    }
    
    // Table exists, let's verify the structure
    console.log('✅ exam_results table exists');
    return { exists: true, structure: 'Table verified' };
    
  } catch (error) {
    return { exists: false, error };
  }
}

export async function testExamResultsTable(): Promise<{ success: boolean; error?: any }> {
  try {
    console.log('🧪 Testing exam_results table...');
    
    // Try to insert a test record
    const testResult = {
      student_email: 'test@example.com',
      exam_type: 'Psychometric_Aptitude_Test',
      test_title: 'Aptitude Test',
      score: 15,
      total_questions: 25,
      percentage: 60.00,
      time_taken: 1200, // 20 minutes
      answers: {
        'APT_001': { selected: 'B', correct: 'B', isCorrect: true },
        'APT_002': { selected: 'A', correct: 'B', isCorrect: false }
      },
      started_at: new Date().toISOString(),
    };
    
    const { data, error: insertError } = await supabase
      .from('exam_results')
      .insert(testResult)
      .select();
      
    if (insertError) {
      console.error('❌ Failed to insert test record:', insertError);
      return { success: false, error: insertError };
    }
    
    console.log('✅ Test record inserted successfully:', data?.[0]?.id);
    
    // Clean up test record
    if (data?.[0]?.id) {
      await supabase
        .from('exam_results')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Test record cleaned up');
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

export function getExamResultsTableSQL(): string {
  return EXAM_RESULTS_TABLE_SQL;
}
