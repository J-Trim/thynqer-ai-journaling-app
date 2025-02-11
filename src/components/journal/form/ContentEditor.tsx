
import React, { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  // Merge content and transcription if content is empty
  const mergedContent = content || transcribedAudio || "";

  const sanitizeContent = (text: string): string => {
    return text
      .replace(/\u200B/g, '') // Remove zero-width spaces
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim();
  };

  // Memoize the sanitized content to prevent unnecessary recalculations
  const displayContent = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sanitizing content:', {
        mergedContent,
        contentLength: mergedContent.length,
        hasContent: !!content,
        hasTranscribedAudio: !!transcribedAudio
      });
    }
    return sanitizeContent(mergedContent);
  }, [mergedContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedValue = sanitizeContent(e.target.value);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Content change:', {
        original: e.target.value,
        sanitized: sanitizedValue,
        length: sanitizedValue.length
      });
    }
    
    onContentChange(sanitizedValue);
  };

  return (
    <Textarea
      placeholder="Start writing your thoughts..."
      value={displayContent}
      onChange={handleContentChange}
      className="min-h-[200px] resize-y"
    />
  );
};

export default ContentEditor;
