
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface AutoSaveProps {
  content: string;
  title: string;
  audioUrl: string | null;
  isInitializing: boolean;
  isSaveInProgress: boolean;
  hasUnsavedChanges: boolean;
  onSave: (isAutoSave: boolean) => void;
}

const AutoSave = ({
  content,
  title,
  audioUrl,
  isInitializing,
  isSaveInProgress,
  hasUnsavedChanges,
  onSave,
}: AutoSaveProps) => {
  const timeoutRef = useRef<number>();
  const lastSaveRef = useRef<string>('');
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const { toast } = useToast();

  // Hide save indicator after a delay
  useEffect(() => {
    if (isSaveInProgress) {
      setShowSaveIndicator(true);
    } else if (showSaveIndicator) {
      const timer = setTimeout(() => {
        setShowSaveIndicator(false);
      }, 2000); // Hide after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isSaveInProgress, showSaveIndicator]);

  useEffect(() => {
    if (isInitializing || !hasUnsavedChanges) {
      return;
    }

    const currentContentHash = `${title}-${content}-${audioUrl}`;

    if (currentContentHash === lastSaveRef.current) {
      console.log('AutoSave: Content unchanged since last save, skipping...');
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      console.log('AutoSave: Initiating auto-save...', {
        contentLength: content?.length || 0,
        hasTitle: !!title,
        hasAudio: !!audioUrl
      });
      
      lastSaveRef.current = currentContentHash;
      onSave(true);
      
      toast({
        description: "Entry saved automatically",
      });
    }, 30000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [content, title, audioUrl, isInitializing, hasUnsavedChanges, onSave]);

  if (!showSaveIndicator) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-300">
      <Save className="h-4 w-4" />
      {isSaveInProgress ? "Saving..." : "Saved"}
    </div>
  );
};

export default AutoSave;
