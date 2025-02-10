
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
    
    if (transcribedAudio) {
      const transcriptionMarker = 'Transcribed Audio:';
      const markerIndex = newValue.lastIndexOf(transcriptionMarker);
      
      if (markerIndex !== -1) {
        const userContent = newValue.substring(0, markerIndex).trim();
        console.log('Extracted user content:', {
          userContent,
          userContentLength: userContent.length,
          markerIndex
        });
        onContentChange(userContent);
      } else {
        console.log('No transcription marker found, updating content directly');
        onContentChange(newValue);
      }
    } else {
      console.log('No transcribed audio, updating content directly');
      onContentChange(newValue);
    }
  };

  let displayContent = content;
  if (transcribedAudio && transcribedAudio.trim()) {
    displayContent = `${content}${content ? '\n\n' : ''}Transcribed Audio:\n${transcribedAudio}`;
  }

  console.log('Final display content:', {
    displayContent,
    displayContentLength: displayContent.length,
    hasContent: !!content,
    hasTranscribedAudio: !!transcribedAudio,
    transcribedAudioContent: transcribedAudio
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
