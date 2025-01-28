import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationSelectorProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

const PERSONAL_GROWTH_TRANSFORMATIONS: ValidTransformation[] = [
  "Emotional Check-In",
  "Daily Affirmation",
  "Mindfulness Reflection",
  "Psychoanalysis",
  "Goal Setting",
  "Action Plan",
  "Self-Care Checklist",
];

const CONTENT_CREATION_TRANSFORMATIONS: ValidTransformation[] = [
  "Blog Post",
  "Email",
  "Instagram Post",
  "YouTube Script",
  "X (Twitter) Post",
  "Instagram Reel / TikTok Clip",
  "Podcast Show Notes",
  "LinkedIn Article",
  "Motivational Snippet",
];

const PROFESSIONAL_TRANSFORMATIONS: ValidTransformation[] = [
  "Lesson Plan",
  "Meeting Agenda",
  "Project Proposal",
  "Performance Review",
  "Team Update / Status Report",
  "Implementation Plan",
  "Project Retrospective",
  "Executive Summary",
  "2nd Iambic Pentameter Rap",
  "Bukowski",
];

const CREATIVE_TRANSFORMATIONS: ValidTransformation[] = [
  "Short Story",
  "Poem or Song Lyrics",
  "Comedy Sketch",
  "Screenplay Scene",
];

const ACADEMIC_TRANSFORMATIONS: ValidTransformation[] = [
  "Summary Abstract",
  "Annotated Bibliography",
  "Discussion Questions",
  "Lecture Notes",
];

const PLANNING_TRANSFORMATIONS: ValidTransformation[] = [
  "Meal Plan",
  "Workout Routine",
  "Travel Itinerary",
  "Brainstorm Session Outline",
];

const TEAM_TRANSFORMATIONS: ValidTransformation[] = [
  "Feedback Request",
  "Conflict Resolution Guide",
  "Team Charter",
];

const MARKETING_TRANSFORMATIONS: ValidTransformation[] = [
  "Tagline Generator",
  "Ad Copy",
  "Promotional Flyer",
  "Marketing Strategy Outline",
];

const TECHNICAL_TRANSFORMATIONS: ValidTransformation[] = [
  "Code Snippet Explanation",
  "Bug Report",
  "API Documentation",
  "Technical Spec",
];

export const TransformationSelector = ({
  entryId,
  entryText,
  onSaveEntry,
}: TransformationSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ValidTransformation>("Quick Summary");
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTransform = async () => {
    if (!selectedType) {
      setError("Please select a transformation type");
      return;
    }

    if (!entryText?.trim()) {
      setError("Please ensure there is text to transform");
      return;
    }

    setError(null);
    setIsTransforming(true);
    setIsSaving(true);

    try {
      let finalEntryId = entryId;

      // If we don't have an entry ID and onSaveEntry is provided, save the entry first
      if (!entryId && onSaveEntry) {
        console.log('No entry ID provided, saving entry first...');
        const savedEntry = await onSaveEntry();
        if (!savedEntry?.id) {
          throw new Error('Failed to save entry');
        }
        finalEntryId = savedEntry.id;
        console.log('Entry saved successfully with ID:', finalEntryId);
      }

      console.log('Starting transformation with type:', selectedType);
      const { data: transformResponse, error: transformError } = await supabase.functions
        .invoke('transform-text', {
          body: { 
            text: entryText, 
            transformationType: selectedType 
          }
        });

      if (transformError) throw transformError;
      if (!transformResponse?.transformedText) {
        throw new Error('No transformed text received');
      }

      console.log('Received transformed text, saving to database...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: finalEntryId,
          user_id: session.user.id,
          transformed_text: transformResponse.transformedText,
          transformation_type: selectedType,
        });

      if (saveError) throw saveError;

      toast({
        description: "Text transformed successfully",
      });
      setSelectedType("Quick Summary");
      setIsOpen(false);
    } catch (err) {
      console.error('Error in transformation process:', err);
      setError(err instanceof Error ? err.message : 'Failed to transform text');
      toast({
        title: "Error",
        description: "Failed to transform text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTransforming(false);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Transform Text</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transform Text</DialogTitle>
          <DialogDescription>
            Choose how you want to transform your journal entry
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-3 lg:grid-cols-4">
            <TabsTrigger value="personal">Personal Growth</TabsTrigger>
            <TabsTrigger value="content">Content Creation</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="creative">Creative</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ValidTransformation)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a transformation type" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <TabsContent value="personal">
                  {PERSONAL_GROWTH_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="content">
                  {CONTENT_CREATION_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="professional">
                  {PROFESSIONAL_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="creative">
                  {CREATIVE_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="academic">
                  {ACADEMIC_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="planning">
                  {PLANNING_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="team">
                  {TEAM_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="marketing">
                  {MARKETING_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
                <TabsContent value="technical">
                  {TECHNICAL_TRANSFORMATIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </TabsContent>
              </SelectContent>
            </Select>
          </div>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isTransforming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransform}
            disabled={isTransforming}
          >
            {isTransforming ? "Transforming..." : "Transform"}
          </Button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
};