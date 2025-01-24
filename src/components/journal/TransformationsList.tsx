import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TransformationsListProps {
  entryId: string;
}

export const TransformationsList = ({ entryId }: TransformationsListProps) => {
  const { toast } = useToast();
  
  const { data: transformations, isLoading, refetch } = useQuery({
    queryKey: ['transformations', entryId],
    queryFn: async () => {
      console.log('Fetching transformations for entry:', entryId);
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${type} has been copied to your clipboard.`,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading transformations...</div>;
  }

  if (!transformations?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Transformations</h3>
      <div className="space-y-4">
        {transformations.map((transform) => (
          <Card key={transform.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {transform.transformation_type}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transform.transformed_text, transform.transformation_type)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {transform.transformed_text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};