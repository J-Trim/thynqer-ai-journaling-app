import { chatWithDeepSeek, type Message } from "@/utils/deepseek";

export const analyzeCode = async (code: string, componentName: string) => {
  try {
    console.log(`Starting code analysis for ${componentName}...`);
    
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are an expert React code analyzer. Analyze the following React component for:
          1. Complexity (state management, effects, handlers)
          2. Performance considerations
          3. Best practices
          4. Potential improvements
          Provide a structured analysis with specific recommendations.`
      },
      {
        role: 'user',
        content: `Component name: ${componentName}\n\nCode:\n${code}`
      }
    ];

    const analysis = await chatWithDeepSeek(messages);
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