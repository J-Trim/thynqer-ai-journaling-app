import JournalEntry from "@/components/JournalEntry";
import JournalEntryForm from "@/components/JournalEntryForm";
import { supabase } from "@/integrations/supabase/client";

export const analyzeJournalComponents = async () => {
  try {
    console.log('Starting code analysis...');
    
    // Get the component source code
    const journalEntryCode = JournalEntry.toString();
    const journalEntryFormCode = JournalEntryForm.toString();
    
    const analyzeComponent = async (componentName: string, code: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { componentName, code }
      });

      if (error) {
        console.error(`Error analyzing ${componentName}:`, error);
        throw error;
      }

      console.log(`${componentName} Analysis:`, data.analysis);
      return data.analysis;
    };

    // Analyze both components
    const [journalEntryAnalysis, journalEntryFormAnalysis] = await Promise.all([
      analyzeComponent('JournalEntry', journalEntryCode),
      analyzeComponent('JournalEntryForm', journalEntryFormCode)
    ]);

    return {
      journalEntry: journalEntryAnalysis,
      journalEntryForm: journalEntryFormAnalysis
    };
  } catch (error) {
    console.error('Error analyzing components:', error);
    throw error;
  }
};

// Run the analysis
analyzeJournalComponents().catch(console.error);