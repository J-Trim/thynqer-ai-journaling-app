import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface TranscriptionDisplayProps {
  transcribedAudio: string | null;
}

const TranscriptionDisplay = ({ transcribedAudio }: TranscriptionDisplayProps) => {
  const [showTranscription, setShowTranscription] = useState(false);

  if (!transcribedAudio) return null;

  return (
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
  );
};

export default TranscriptionDisplay;