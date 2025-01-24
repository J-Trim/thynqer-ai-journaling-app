import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface TransformationsListProps {
  entryId: string;
}

export const TransformationsList = ({ entryId }: TransformationsListProps) => {
  const { toast } = useToast();
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});
  
  const { data: transformations, isLoading } = useQuery({
    queryKey: ['transformations', entryId],
    queryFn: async () => {
      console.log('Fetching transformations for entry:', entryId);
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Retrieved transformations:', data);
      return data;
    },
    enabled: !!entryId,
  });

  // Initialize all transformations as open when they are loaded
  useEffect(() => {
    if (transformations) {
      const initialStates = transformations.reduce((acc, transform) => ({
        ...acc,
        [transform.id]: true
      }), {});
      setOpenStates(initialStates);
    }
  }, [transformations]);

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

  const toggleTransformation = (id: string) => {
    setOpenStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading transformations...</div>;
  }

  if (!transformations?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Transformations</h3>
      {transformations.map((transform) => (
        <Collapsible
          key={transform.id}
          open={openStates[transform.id]}
          onOpenChange={() => toggleTransformation(transform.id)}
          className="animate-fade-in"
        >
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-between w-full hover:bg-transparent"
                  >
                    <CardTitle className="text-sm font-medium">
                      {transform.transformation_type}
                    </CardTitle>
                    {openStates[transform.id] ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transform.transformed_text, transform.transformation_type)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <p className="whitespace-pre-wrap text-sm">
                  {transform.transformed_text}
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
};