import { useEffect } from 'react';

interface JournalEntry {
  id: string;
  title: string;
  text: string;
  audio_url: string | null;
}

interface AutoSaveProps {
  content: string;
  title: string;
  audioUrl: string | null;
  isInitializing: boolean;
  isSaveInProgress: boolean;
  hasUnsavedChanges: boolean;
  onSave: (isAutoSave: boolean) => Promise<JournalEntry | null>;
  autoSaveDelay?: number;
}

const AutoSave = ({
  content,
  title,
  audioUrl,
  isInitializing,
  isSaveInProgress,
  hasUnsavedChanges,
  onSave,
  autoSaveDelay = 30000 // Increased to 30 seconds
}: AutoSaveProps) => {
  useEffect(() => {
    if (isInitializing || isSaveInProgress || !hasUnsavedChanges) return;

    const timeout = setTimeout(async () => {
      if (content || title || audioUrl) {
        console.log('Auto-saving journal entry...');
        const savedEntry = await onSave(true);
        if (savedEntry) {
          console.log('Auto-save successful');
        }
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeout);
  }, [content, title, audioUrl, isInitializing, isSaveInProgress, hasUnsavedChanges, onSave, autoSaveDelay]);

  return null;
};

export default AutoSave;