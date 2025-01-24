import { useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

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
  autoSaveDelay = 3000
}: AutoSaveProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (isInitializing || isSaveInProgress || !hasUnsavedChanges) return;

    const timeout = setTimeout(async () => {
      if (content || title || audioUrl) {
        const savedEntry = await onSave(true);
        if (savedEntry) {
          toast({
            title: "Auto-saved",
            description: "Draft saved automatically",
          });
        }
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeout);
  }, [content, title, audioUrl, isInitializing, isSaveInProgress, hasUnsavedChanges, onSave, toast, autoSaveDelay]);

  return null;
};

export default AutoSave;