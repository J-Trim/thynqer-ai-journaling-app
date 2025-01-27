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
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, FileText, User, Briefcase, Share2, PenTool, Car, Bot, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { chatWithDeepSeek, type Message } from "@/utils/deepseek";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationSelectorProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

const TRANSFORMATION_TYPES = {
  "Personal Growth": {
    icon: User,
    items: [
      'Quick Summary',
      'Emotional Check-In',
      'Daily Affirmation',
      'Mindfulness Reflection',
      'Goal Setting',
      'Short Paraphrase',
      'Psychoanalysis',
    ]
  },
  "Professional": {
    icon: Briefcase,
    items: [
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
    ]
  },
  "Social Media": {
    icon: Share2,
    items: [
      'Blog Post',
      'Email',
      'Instagram Post',
      'YouTube Script',
      'X (Twitter) Post',
      'Instagram Reel / TikTok Clip',
      'Podcast Show Notes',
      'LinkedIn Article',
      'Motivational Snippet',
    ]
  },
  "Custom": {
    icon: PenTool,
    items: []
  }
} as const;

export const TransformationSelector = ({ 
  entryId, 
  entryText,
  onSaveEntry,
}: TransformationSelectorProps) => {
  const [selectedType, setSelectedType] = useState<ValidTransformation | "">("");
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTransformation, setLastTransformation] = useState<string | null>(null);
  const [lastTransformationType, setLastTransformationType] = useState<string | null>(null);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptTemplate, setNewPromptTemplate] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<Array<{ prompt_name: string, prompt_template: string }>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleEnhancePrompt = async () => {
    if (!newPromptTemplate.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to enhance",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const systemMessage = `You are an AI prompt engineer. Your task is to enhance and improve the following prompt to make it more specific, detailed, and effective. The enhanced prompt should maintain the original intent but add structure, clarity, and specific instructions. Here's the prompt to enhance:`;
      
      const messages: Message[] = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: newPromptTemplate }
      ];

      const enhancedPrompt = await chatWithDeepSeek(messages);
      setNewPromptTemplate(enhancedPrompt);
      
      toast({
        description: "Prompt enhanced successfully",
      });
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        title: "Error",
        description: "Failed to enhance prompt",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCreateCustomPrompt = async () => {
    if (!newPromptName || !newPromptTemplate) {
      toast({
        title: "Error",
        description: "Please fill in both the prompt name and template",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error: saveError } = await supabase
        .from('custom_prompts')
        .insert({
          user_id: session.user.id,
          prompt_name: newPromptName,
          prompt_template: newPromptTemplate
        });

      if (saveError) throw saveError;

      toast({
        description: "Custom prompt created successfully",
      });

      // Reset form
      setNewPromptName("");
      setNewPromptTemplate("");
      
      // Refresh custom prompts
      const { data: updatedPrompts } = await supabase
        .from('custom_prompts')
        .select('prompt_name, prompt_template')
        .eq('user_id', session.user.id);
        
      if (updatedPrompts) {
        setCustomPrompts(updatedPrompts);
      }
    } catch (err) {
      console.error('Error creating custom prompt:', err);
      toast({
        title: "Error",
        description: "Failed to create custom prompt",
        variant: "destructive",
      });
    }
  };

  const handleTransform = async () => {
    if (!selectedType || !entryText?.trim()) {
      console.log('Missing required data:', { selectedType, hasText: !!entryText?.trim() });
      return;
    }

    setIsTransforming(true);
    setError(null);

    try {
      let finalEntryId = entryId;
      
      if (!entryId && onSaveEntry) {
        console.log('No entry ID found, forcing save before transformation...');
        setIsSaving(true);
        const savedEntry = await onSaveEntry();
        
        if (!savedEntry?.id) {
          console.error('Failed to save entry:', savedEntry);
          throw new Error('Failed to save entry');
        }
        
        finalEntryId = savedEntry.id;
        console.log('Entry saved successfully with ID:', finalEntryId);
        setIsSaving(false);
      }

      if (!finalEntryId) {
        console.error('No entry ID available after save attempt');
        throw new Error('No entry ID available');
      }

      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication required');
      }

      console.log('Starting transformation with:', {
        text: entryText,
        transformationType: selectedType,
        entryId: finalEntryId
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

      if (!transformResponse?.transformedText) {
        console.error('No transformed text received from function');
        throw new Error('No transformed text received');
      }

      console.log('Transform successful, saving to database...');
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: finalEntryId,
          user_id: session.user.id,
          transformed_text: transformResponse.transformedText,
          transformation_type: selectedType,
        });

      if (saveError) {
        console.error('Error saving transformation:', saveError);
        throw saveError;
      }

      console.log('Transformation saved successfully');
      setLastTransformation(transformResponse.transformedText);
      setLastTransformationType(selectedType);
      queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });
      setSelectedType("");
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error in transformation process:', err);
      setError(err instanceof Error ? err.message : 'Failed to transform text');
    } finally {
      setIsTransforming(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center mb-6">Transformation Station</h2>
      
      <div className="flex justify-center gap-8 mb-8">
        {Object.entries(TRANSFORMATION_TYPES).map(([group, { icon: Icon, items }]) => (
          <Dialog key={group} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="lg"
                className="flex flex-col items-center gap-2 p-4 hover:bg-secondary transition-colors"
              >
                <Icon className="h-8 w-8" />
                <span className="text-sm font-medium">{group}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogTitle className="text-lg font-semibold">{group}</DialogTitle>
              <div className="space-y-4 pt-4">
                {group === "Custom" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Prompt Name"
                        value={newPromptName}
                        onChange={(e) => setNewPromptName(e.target.value)}
                      />
                      <div className="relative">
                        <Textarea
                          placeholder="Write your custom prompt here..."
                          value={newPromptTemplate}
                          onChange={(e) => setNewPromptTemplate(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button 
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-2"
                          onClick={handleEnhancePrompt}
                          disabled={isEnhancing}
                        >
                          {isEnhancing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4 mr-1" />
                              Enhance
                            </>
                          )}
                        </Button>
                      </div>
                      <Button 
                        onClick={handleCreateCustomPrompt}
                        className="w-full"
                      >
                        Save Custom Prompt
                      </Button>
                    </div>
                    {customPrompts.length > 0 && (
                      <Select value={selectedType} onValueChange={(value: ValidTransformation) => setSelectedType(value)}>
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Choose Custom Prompt" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {customPrompts.map((prompt) => (
                              <SelectItem key={prompt.prompt_name} value={prompt.prompt_name}>
                                {prompt.prompt_name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : (
                  <Select value={selectedType} onValueChange={(value: ValidTransformation) => setSelectedType(value)}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder={`Choose ${group} Type`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {items.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      <Button 
        onClick={handleTransform} 
        disabled={isTransforming || !selectedType || isSaving}
        className="w-full"
      >
        {isTransforming || isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isSaving ? 'Saving entry...' : 'Transforming...'}
          </>
        ) : (
          <>
            <Car className="mr-2 h-4 w-4" />
            Transform
            <Bot className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {lastTransformation && lastTransformationType && (
        <div className="w-full border rounded-lg p-4 mt-4 animate-fade-in">
          <h4 className="font-medium mb-2">{lastTransformationType}</h4>
          <p className="whitespace-pre-wrap text-sm">
            {lastTransformation}
          </p>
        </div>
      )}
    </div>
  );
};
