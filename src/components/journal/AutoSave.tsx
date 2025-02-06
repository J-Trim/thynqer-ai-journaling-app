import { useEffect, useRef } from "react";
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
  const lastSaveRef = useRef<string>(''); // Track last saved content
  const { toast } = useToast();

  useEffect(() => {
    if (isInitializing || !hasUnsavedChanges) {
      return;
    }

    // Create a hash of current content to compare
    const currentContentHash = `${title}-${content}-${audioUrl}`;

    // Don't save if content hasn't changed since last save
    if (currentContentHash === lastSaveRef.current) {
      console.log('AutoSave: Content unchanged since last save, skipping...');
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Set a new timeout for 30 seconds
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

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [content, title, audioUrl, isInitializing, hasUnsavedChanges, onSave]);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 text-sm text-muted-foreground">
      <Save className="h-4 w-4" />
      {isSaveInProgress ? "Saving..." : "Saved"}
    </div>
  );
};

export default AutoSave;