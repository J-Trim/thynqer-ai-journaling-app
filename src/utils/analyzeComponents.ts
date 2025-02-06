import { analyzeCode } from './codeAnalysis';

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