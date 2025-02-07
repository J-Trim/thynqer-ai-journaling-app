
import { useEffect, useContext } from "react";
import { UnsavedChangesContext } from "@/contexts/UnsavedChangesContext";

interface UseUnsavedChangesProps {
  title: string;
  content: string;
  audioUrl: string | null;
  initialContent: {
    title: string;
    content: string;
    audioUrl: string | null;
  };
  isInitializing: boolean;
}

export const useUnsavedChanges = ({
  title,
  content,
  audioUrl,
  initialContent,
  isInitializing
}: UseUnsavedChangesProps) => {
  const { setHasUnsavedChanges } = useContext(UnsavedChangesContext);

  const hasActualChanges = () => {
    return title !== initialContent.title || 
           content !== initialContent.content || 
           audioUrl !== initialContent.audioUrl;
  };

  useEffect(() => {
    if (!isInitializing) {
      setHasUnsavedChanges(hasActualChanges());
    }
  }, [title, content, audioUrl, isInitializing, setHasUnsavedChanges]);

  return { hasActualChanges };
};
