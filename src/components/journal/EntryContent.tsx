import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EntryContentProps {
  content: string;
  transcribedAudio?: string | null;
  onContentChange: (value: string) => void;
}

const EntryContent = ({ content, transcribedAudio, onContentChange }: EntryContentProps) => {
  // Combine main content with transcribed audio for the editable area
  const fullContent = transcribedAudio 
    ? `${content || ''}\n\n${transcribedAudio}`
    : content || '';

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Start writing your thoughts..."
        value={fullContent}
        onChange={(e) => onContentChange(e.target.value)}
        className="min-h-[200px] resize-y"
      />
      
      {transcribedAudio && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-sm">Transcribed Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-muted-foreground">
              {transcribedAudio}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EntryContent;