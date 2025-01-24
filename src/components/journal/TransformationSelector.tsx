import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TransformationSelectorProps {
  entryId: string;
  entryText: string;
  onTransformationComplete?: () => void;
}

const TRANSFORMATION_TYPES = [
  'Blog Post',
  'Email',
  'Instagram Post',
  'YouTube Script',
  'X (Twitter) Post',
  'Instagram Reel / TikTok Clip',
  'Podcast Show Notes',
  'LinkedIn Article',
  'Motivational Snippet',
  'Quick Summary',
  'Emotional Check-In',
  'Daily Affirmation',
  'Action Plan',
  'Psychoanalysis',
  'Mindfulness Reflection',
  'Goal Setting',
  'Short Paraphrase',
] as const;

export const TransformationSelector = ({ 
  entryId, 
  entryText,
  onTransformationComplete 
}: TransformationSelectorProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [isTransforming, setIsTransforming] = useState(false);
  const { toast } = useToast();

  const handleTransform = async () => {
    if (!selectedType || !entryText.trim()) {
      toast({
        title: "Cannot transform",
        description: "Please select a transformation type and ensure there is text to transform.",
        variant: "destructive",
      });
      return;
    }

    setIsTransforming(true);
    try {
      // Get the current user's ID
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        throw new Error('Authentication required');
      }

      console.log('Calling transform-text function with:', {
        text: entryText,
        transformationType: selectedType
      });

      const { data: transformResponse, error: transformError } = await supabase.functions
        .invoke('transform-text', {
          body: { 
            text: entryText, 
            transformationType: selectedType 
          }
        });

      if (transformError) {
        console.error('Transform function error:', transformError);
        throw transformError;
      }

      console.log('Transform response:', transformResponse);

      if (!transformResponse?.transformedText) {
        throw new Error('No transformed text received from the function');
      }

      console.log('Saving transformation to database...');
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: entryId,
          user_id: session.user.id,
          transformed_text: transformResponse.transformedText,
          transformation_type: selectedType,
        });

      if (saveError) {
        console.error('Save error:', saveError);
        throw saveError;
      }

      toast({
        title: "Transformation complete",
        description: "Your text has been transformed successfully.",
      });

      if (onTransformationComplete) {
        onTransformationComplete();
      }
    } catch (error) {
      console.error('Error in transformation:', error);
      toast({
        title: "Transformation failed",
        description: error instanceof Error ? error.message : "There was an error transforming your text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {TRANSFORMATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleTransform} 
          disabled={isTransforming || !selectedType}
        >
          {isTransforming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transforming...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Transform
            </>
          )}
        </Button>
      </div>
    </div>
  );
};