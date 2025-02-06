import { supabase } from "@/integrations/supabase/client";

export const analyzeCode = async (code: string, componentName: string) => {
  try {
    console.log(`Starting code analysis for ${componentName}...`);
    
    const systemPrompt = `You are an expert React code analyzer. Analyze the following React component for:
1. Complexity (state management, effects, handlers)
2. Performance considerations
3. Best practices
4. Potential improvements
Provide a structured analysis with specific recommendations.`;

    const userPrompt = `Component name: ${componentName}\n\nCode:\n${code}`;

    // Store analysis in database
    const { data: analysisData, error: insertError } = await supabase
      .from('code_analysis')
      .insert({
        component_name: componentName,
        analysis_result: { systemPrompt, userPrompt },
        analyzed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing analysis:', insertError);
      throw insertError;
    }

    console.log('Analysis completed and stored:', analysisData);
    return analysisData;
  } catch (error) {
    console.error('Error analyzing code:', error);
    throw error;
  }
};

export const analyzeJournalComponents = async () => {
  try {
    // Analyze JournalEntry component
    const journalEntryAnalysis = await analyzeCode(
      document.querySelector('[data-file="src/components/JournalEntry.tsx"]')?.textContent || '',
      'JournalEntry'
    );
    console.log('JournalEntry Analysis:', journalEntryAnalysis);

    // Analyze JournalEntryForm component
    const journalEntryFormAnalysis = await analyzeCode(
      document.querySelector('[data-file="src/components/JournalEntryForm.tsx"]')?.textContent || '',
      'JournalEntryForm'
    );
    console.log('JournalEntryForm Analysis:', journalEntryFormAnalysis);

    return {
      journalEntry: journalEntryAnalysis,
      journalEntryForm: journalEntryFormAnalysis
    };
  } catch (error) {
    console.error('Error analyzing components:', error);
    throw error;
  }
};

// Run the analysis immediately
analyzeJournalComponents().catch(console.error);