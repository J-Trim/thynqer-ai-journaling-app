import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type ValidTransformation = 
  | "Quick Summary"
  | "Emotional Check-In"
  | "Daily Affirmation"
  | "Mindfulness Reflection"
  | "Goal Setting"
  | "Short Paraphrase"
  | "Psychoanalysis"
  | "Lesson Plan"
  | "Meeting Agenda"
  | "Project Proposal"
  | "Action Plan"
  | "Performance Review"
  | "Team Update / Status Report"
  | "Training Outline"
  | "Sales Pitch"
  | "Corporate Email / Internal Memo"
  | "Project Retrospective"
  | "Implementation Plan"
  | "Executive Summary"
  | "Brainstorm Session Outline"
  | "Risk Assessment"
  | "Professional White Paper"
  | "Blog Post"
  | "Email"
  | "Instagram Post"
  | "YouTube Script"
  | "X (Twitter) Post"
  | "Instagram Reel / TikTok Clip"
  | "Podcast Show Notes"
  | "LinkedIn Article"
  | "Motivational Snippet";

interface TransformationSelectorProps {
  entryId: string;
  entryText: string;
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
}: TransformationSelectorProps) => {
  const [selectedType, setSelectedType] = useState<ValidTransformation | "">("");
  const [isTransforming, setIsTransforming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      // Invalidate the transformations query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['transformations', entryId] });

      toast({
        title: "Transformation complete",
        description: "Your text has been transformed successfully.",
      });
    } catch (error) {
      console.error('Error in transformation:', error);
      toast({
        title: "Transformation failed",
        description: error instanceof Error ? error.message : "There was an error transforming your text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTransforming(false);
      setSelectedType(""); // Reset selection after transform
    }
  };

  const isButtonDisabled = isTransforming || !selectedType;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TRANSFORMATION_TYPES).map(([group, types]) => (
          <div key={group} className="space-y-2">
            <h3 className="text-sm font-medium text-text-muted mb-2">{group}</h3>
            <Select value={selectedType} onValueChange={(value: ValidTransformation) => setSelectedType(value)}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder={`Choose ${group.split(' ')[1]} Type`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
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
        disabled={isButtonDisabled}
        className="w-full"
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