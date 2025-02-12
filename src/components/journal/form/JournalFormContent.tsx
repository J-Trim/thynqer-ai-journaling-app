
import { useQuery } from "@tanstack/react-query";
import ContentEditor from "./ContentEditor";
import TranscriptionDisplay from "./TranscriptionDisplay";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransformationsList } from "../TransformationsList";

interface JournalFormContentProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
  onReorder?: (value: string) => void;
  entryId?: string;
}

const JournalFormContent = ({ 
  content, 
  transcribedAudio, 
  onContentChange,
  onReorder,
  entryId 
}: JournalFormContentProps) => {
  // Memoize content change handler
  const handleContentChange = useCallback((value: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Content change:', {
        newValue: value,
        length: value.length
      });
    }
    onContentChange(value);
  }, [onContentChange]);
  
  // Handle reordering
  const handleReorder = useCallback((value: string) => {
    if (onReorder) {
      onReorder(value);
    }
  }, [onReorder]);

  return (
    <div className="space-y-4">
      <ContentEditor
        content={content}
        transcribedAudio={transcribedAudio}
        onContentChange={handleContentChange}
        onReorder={handleReorder}
      />
      <TranscriptionDisplay transcribedAudio={transcribedAudio} />
      {entryId && <TransformationsList entryId={entryId} />}
    </div>
  );
};

export default JournalFormContent;
