
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JournalInsightsProps {
  journalEntry: string;
}

export default function JournalInsights({ journalEntry }: JournalInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInsight = async () => {
    if (!journalEntry?.trim()) {
      toast({
        title: "Error",
        description: "Please write something in your journal first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-entry', {
        body: { journalEntry }
      });

      if (error) throw error;

      setInsight(data?.insight || "No insights generated.");
      
      toast({
        description: "AI insights generated successfully",
      });
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={fetchInsight} 
        disabled={loading}
        className="w-full"
      >
        {loading ? "Analyzing..." : "Get AI Insight"}
      </Button>

      {insight && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">AI Reflection</h3>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap">{insight}</CardContent>
        </Card>
      )}
    </div>
  );
}

