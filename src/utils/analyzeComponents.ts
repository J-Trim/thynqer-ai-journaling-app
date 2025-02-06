export const analyzeJournalComponents = async () => {
  try {
    console.log('Starting code analysis...');
    
    // Analyze JournalEntry component
    const journalEntryAnalysis = await (window as any).gpt4o.complete(
      `You are an expert React code analyzer. Analyze the following React component for:
      1. Complexity (state management, effects, handlers)
      2. Performance considerations
      3. Best practices
      4. Potential improvements
      Provide a structured analysis with specific recommendations.`,
      `Component: JournalEntry
      
      Code:
      ${document.querySelector('[data-file="src/components/JournalEntry.tsx"]')?.textContent || ''}`
    );
    
    console.log('JournalEntry Analysis:', journalEntryAnalysis);

    // Analyze JournalEntryForm component
    const journalEntryFormAnalysis = await (window as any).gpt4o.complete(
      `You are an expert React code analyzer. Analyze the following React component for:
      1. Complexity (state management, effects, handlers)
      2. Performance considerations
      3. Best practices
      4. Potential improvements
      Provide a structured analysis with specific recommendations.`,
      `Component: JournalEntryForm
      
      Code:
      ${document.querySelector('[data-file="src/components/JournalEntryForm.tsx"]')?.textContent || ''}`
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