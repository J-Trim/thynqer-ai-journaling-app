import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

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
        console.log('Auto-saving journal entry...');
        const savedEntry = await onSave(true);
        if (savedEntry) {
          console.log('Auto-save successful');
          toast({
            title: "",
            description: (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4 animate-fade-in" />
                <span className="text-sm">Saved</span>
              </div>
            ),
            duration: 2600, // 800ms fade in + 1000ms display + 800ms fade out
          });
        }
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeout);
  }, [content, title, audioUrl, isInitializing, isSaveInProgress, hasUnsavedChanges, onSave, toast, autoSaveDelay]);

  return null;
};

export default AutoSave;