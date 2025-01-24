import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
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

const TRANSFORMATION_TYPES = {
  "✨ Personal Growth": [
    'Quick Summary',
    'Emotional Check-In',
    'Daily Affirmation',
    'Mindfulness Reflection',
    'Goal Setting',
    'Short Paraphrase',
    'Psychoanalysis',
  ],
  "💼 Professional": [
    'Lesson Plan',
    'Meeting Agenda',
    'Project Proposal',
    'Action Plan',
    'Performance Review',
    'Team Update / Status Report',
    'Training Outline',
    'Sales Pitch',
    'Corporate Email / Internal Memo',
    'Project Retrospective',
    'Implementation Plan',
    'Executive Summary',
    'Brainstorm Session Outline',
    'Risk Assessment',
    'Professional White Paper',
  ],
  "🌐 Social Media": [
    'Blog Post',
    'Email',
    'Instagram Post',
    'YouTube Script',
    'X (Twitter) Post',
    'Instagram Reel / TikTok Clip',
    'Podcast Show Notes',
    'LinkedIn Article',
    'Motivational Snippet',
  ],
} as const;

export const TransformationSelector = ({ 
  entryId, 
  entryText,
  onTransformationComplete 
}: TransformationSelectorProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [isTransforming, setIsTransforming] = useState(false);
  const { toast } = useToast();

  const handleTransform = async () => {
    if (!selectedType) {
      toast({
        title: "Cannot transform",
        description: "Please select a transformation type.",
        variant: "destructive",
      });
      return;
    }

    if (!entryText?.trim()) {
      toast({
        title: "Cannot transform",
        description: "Please ensure there is text to transform.",
        variant: "destructive",
      });
      return;
    }

    setIsTransforming(true);
    try {
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
    <div className="space-y-6">
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {Object.entries(TRANSFORMATION_TYPES).map(([group, types]) => (
          <div key={group} className="flex-none">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger 
                className="min-w-[200px] rounded-full bg-secondary hover:bg-secondary/90 border-none text-sm font-medium transition-colors"
              >
                <SelectValue placeholder={group} />
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                <SelectGroup>
                  <SelectItem value="" disabled>
                    {group}
                  </SelectItem>
                  {types.map((type) => (
                    <SelectItem 
                      key={type} 
                      value={type}
                      className="cursor-pointer hover:bg-secondary/50"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button 
        onClick={handleTransform} 
        disabled={isTransforming || !selectedType || !entryText.trim()}
        className="w-full rounded-full bg-primary hover:bg-primary-hover transition-colors"
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
  );
};