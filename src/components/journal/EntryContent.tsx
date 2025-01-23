import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EntryContentProps {
  content: string;
  transcribedAudio?: string | null;
  onContentChange: (value: string) => void;
}

const EntryContent = ({ content, transcribedAudio, onContentChange }: EntryContentProps) => {
  const [showTranscription, setShowTranscription] = useState(false);
  
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
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscription(!showTranscription)}
            className="w-full flex items-center justify-between"
          >
            <span>Transcribed Audio</span>
            {showTranscription ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showTranscription && (
            <Card className="bg-muted animate-fade-in">
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
      )}
    </div>
  );
};

export default EntryContent;