import { supabase } from '../context/SupabaseContext';

// Function to create the exam_results table
export async function createExamResultsTable(): Promise<{ success: boolean; error?: any }> {
  try {
    console.log('Creating exam_results table...');
    
    // Note: In a real Supabase environment, you would typically create tables via the Supabase dashboard
    // or use the SQL editor. This is a programmatic approach for demonstration.
    
    // First, let's try to create the table using a simple SQL command
    const { error } = await supabase.rpc('create_exam_results_table');
    
    if (error) {
      // If the RPC doesn't exist, we'll handle it gracefully
      console.log('RPC not available, attempting alternative approach...');
      
      // Alternative: Create a sample record to test if table exists
      const { error: testError } = await supabase
        .from('exam_results')
        .select('*')
        .limit(1);
        
      if (testError && testError.code === '42P01') {
        // Table doesn't exist - in a real app, you'd need to create it via Supabase dashboard
        console.log('Table does not exist. Please create it via Supabase dashboard.');
        return { 
          success: false, 
          error: 'exam_results table needs to be created manually in Supabase dashboard with the following schema:\n\n' +
                 'CREATE TABLE exam_results (\n' +
                 '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n' +
                 '  student_email TEXT NOT NULL,\n' +
                 '  exam_type TEXT NOT NULL,\n' +
                 '  score INTEGER NOT NULL,\n' +
                 '  total_questions INTEGER NOT NULL,\n' +
                 '  percentage INTEGER NOT NULL,\n' +
                 '  time_taken INTEGER NOT NULL,\n' +
                 '  answers JSONB,\n' +
                 '  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n' +
                 ');'
        };
      } else {
        // Table exists
        console.log('exam_results table already exists');
        return { success: true };
      }
    } else {
      console.log('exam_results table created successfully');
      return { success: true };
    }
    
  } catch (error) {
    console.error('Error setting up exam_results table:', error);
    return { success: false, error };
  }
}

// Function to verify database setup
export async function verifyDatabaseSetup(): Promise<{ success: boolean; tables: string[]; errors: any[] }> {
  const tables: string[] = [];
  const errors: any[] = [];
  
  try {
    // Check assessments table
    const { error: assessmentsError } = await supabase
      .from('assessments')
      .select('*')
      .limit(1);
      
    if (assessmentsError) {
      errors.push({ table: 'assessments', error: assessmentsError });
    } else {
      tables.push('assessments');
    }
    
    // Check exam_results table
    const { error: examResultsError } = await supabase
      .from('exam_results')
      .select('*')
      .limit(1);
      
    if (examResultsError) {
      if (examResultsError.code === '42P01') {
        errors.push({ table: 'exam_results', error: 'Table does not exist' });
      } else {
        errors.push({ table: 'exam_results', error: examResultsError });
      }
    } else {
      tables.push('exam_results');
    }
    
    // Check students table
    const { error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);
      
    if (studentsError) {
      errors.push({ table: 'students', error: studentsError });
    } else {
      tables.push('students');
    }
    
    return { 
      success: errors.length === 0, 
      tables, 
      errors 
    };
    
  } catch (error) {
    return { 
      success: false, 
      tables, 
      errors: [{ table: 'general', error }] 
    };
  }
}

// Function to get table creation SQL for manual setup
export function getTableCreationSQL() {
  return {
    exam_results: `
-- Create exam_results table
CREATE TABLE exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_exam_results_student_email ON exam_results(student_email);
CREATE INDEX idx_exam_results_exam_type ON exam_results(exam_type);
CREATE INDEX idx_exam_results_completed_at ON exam_results(completed_at);

-- Add Row Level Security (RLS) if needed
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
    `.trim(),
    
    assessments: `
-- Verify assessments table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND table_schema = 'public';
    `.trim()
  };
}
