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

    // Since we're in a browser environment, we can use the window object
    // which has gpt4o already loaded and available globally
    const analysis = await (window as any).gpt4o.complete(systemPrompt, userPrompt);
    console.log('Analysis completed:', analysis);
    return analysis;
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