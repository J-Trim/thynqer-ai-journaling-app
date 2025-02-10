
import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  console.log('ContentEditor rendering with:', { 
    content, 
    transcribedAudio,
    contentLength: content?.length || 0,
    transcribedAudioLength: transcribedAudio?.length || 0
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('Content change event:', {
      newValue,
      newValueLength: newValue.length,
      hasTranscribedAudio: !!transcribedAudio
    });
    
    // If there's transcribed audio, we need to preserve only the user's content
    // by removing the transcribed section if present
    if (transcribedAudio) {
      const transcriptionMarker = 'Transcribed Audio:';
      const markerIndex = newValue.lastIndexOf(transcriptionMarker);
      
      if (markerIndex !== -1) {
        // Extract only the user's content part
        const userContent = newValue.substring(0, markerIndex).trim();
        console.log('Extracted user content:', {
          userContent,
          userContentLength: userContent.length,
          markerIndex
        });
        onContentChange(userContent);
      } else {
        // If no marker is found, update the content normally
        console.log('No transcription marker found, updating content directly');
        onContentChange(newValue);
      }
    } else {
      // No transcribed audio, update content normally
      console.log('No transcribed audio, updating content directly');
      onContentChange(newValue);
    }
  };

  // Create the display value by combining content and transcription
  const displayContent = transcribedAudio 
    ? content + (content ? '\n\n' : '') + 'Transcribed Audio:\n' + transcribedAudio
    : content;

  console.log('Final display content:', {
    displayContentLength: displayContent.length,
    hasContent: !!content,
    hasTranscribedAudio: !!transcribedAudio
  });

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

