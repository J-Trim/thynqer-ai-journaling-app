
import { useQuery } from "@tanstack/react-query";
import ContentEditor from "./ContentEditor";
import TranscriptionDisplay from "./TranscriptionDisplay";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface JournalFormContentProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const JournalFormContent = ({ 
  content, 
  transcribedAudio, 
  onContentChange 
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
  
  return (
    <div className="space-y-4">
      <ContentEditor
        content={content}
        transcribedAudio={transcribedAudio}
        onContentChange={handleContentChange}
      />
      <TranscriptionDisplay transcribedAudio={transcribedAudio} />
    </div>
  );
};

export default JournalFormContent;
