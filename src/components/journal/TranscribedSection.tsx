import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TranscribedSectionProps {
  transcribedAudio: string;
}

const TranscribedSection = ({ transcribedAudio }: TranscribedSectionProps) => {
  if (!transcribedAudio) return null;

  return (
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
  );
};

export default TranscribedSection;