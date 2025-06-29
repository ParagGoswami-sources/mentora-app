import { supabase } from '../context/SupabaseContext';

export async function runDiagnostics() {
  console.log('🔍 Running comprehensive diagnostics...');
  
  try {
    // 1. Check total questions
    const { count: totalCount } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total questions in database: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('❌ No questions found in database. Run import first!');
      return { success: false, message: 'No questions in database' };
    }
    
    // 2. Check psychometric questions specifically
    const { data: psychometricData, count: psychometricCount } = await supabase
      .from('assessments')
      .select('*', { count: 'exact' })
      .eq('class_level', 'general')
      .eq('stream', 'general');
    
    console.log(`🧠 Psychometric questions (class_level='general', stream='general'): ${psychometricCount}`);
    
    if (psychometricData && psychometricData.length > 0) {
      console.log('✅ Sample psychometric question:', {
        question_id: psychometricData[0].question_id,
        question_text: psychometricData[0].question_text?.substring(0, 50) + '...',
        class_level: psychometricData[0].class_level,
        stream: psychometricData[0].stream
      });
    }
    
    // 3. Check unique class_level and stream combinations
    const { data: uniqueCombos } = await supabase
      .from('assessments')
      .select('class_level, stream')
      .limit(1000);
    
    if (uniqueCombos) {
      const combinations = new Set(uniqueCombos.map(row => `${row.class_level}-${row.stream}`));
      console.log('📋 Available class_level-stream combinations:', Array.from(combinations));
    }
    
    // 4. Test the exact query from AptitudeTestScreen
    console.log('🔍 Testing exact psychometric query...');
    const { data: testQuery } = await supabase
      .from('assessments')
      .select('*')
      .eq('class_level', 'general')
      .eq('stream', 'general')
      .limit(5);
    
    console.log(`🎯 Psychometric test query result: ${testQuery?.length || 0} questions`);
    
    if (testQuery && testQuery.length > 0) {
      console.log('✅ Query works! First question:', testQuery[0].question_id);
      return { success: true, psychometricCount, totalCount };
    } else {
      console.log('❌ Query returns no results for psychometric tests');
      return { success: false, message: 'Psychometric query returns no results' };
    }
    
  } catch (error) {
    console.error('❌ Diagnostics error:', error);
    return { success: false, error };
  }
}

export async function fixPsychometricQuestions() {
  console.log('🔧 Attempting to fix psychometric questions...');
  
  try {
    // Find questions that might be psychometric but have wrong class_level/stream
    const { data: possiblePsychometric } = await supabase
      .from('assessments')
      .select('*')
      .or('question_id.ilike.%Psychometric%,question_id.ilike.%Aptitude%,question_id.ilike.%Emotional%,question_id.ilike.%Interest%,question_id.ilike.%Personality%,question_id.ilike.%Orientation%');
    
    if (possiblePsychometric && possiblePsychometric.length > 0) {
      console.log(`🔍 Found ${possiblePsychometric.length} potential psychometric questions`);
      
      // Show their current class_level and stream values
      const uniqueValues = new Set(possiblePsychometric.map(q => `${q.class_level}-${q.stream}`));
      console.log('📋 Current values for psychometric questions:', Array.from(uniqueValues));
      
      // Update them to have correct values
      const questionsToUpdate = possiblePsychometric.filter(q => 
        q.class_level !== 'general' || q.stream !== 'general'
      );
      
      if (questionsToUpdate.length > 0) {
        console.log(`🔧 Updating ${questionsToUpdate.length} psychometric questions...`);
        
        for (const question of questionsToUpdate) {
          const { error } = await supabase
            .from('assessments')
            .update({ class_level: 'general', stream: 'general' })
            .eq('question_id', question.question_id);
          
          if (error) {
            console.error(`❌ Error updating ${question.question_id}:`, error);
          }
        }
        
        console.log('✅ Psychometric questions updated!');
        return { success: true, updated: questionsToUpdate.length };
      } else {
        console.log('✅ All psychometric questions already have correct values');
        return { success: true, updated: 0 };
      }
    } else {
      console.log('❌ No psychometric questions found in database');
      return { success: false, message: 'No psychometric questions found' };
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    return { success: false, error };
  }
}
