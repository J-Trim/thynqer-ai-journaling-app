
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationError extends Error {
  code?: string;
  details?: string;
}

export interface TransformationResult {
  transformedText: string;
  type: ValidTransformation;
}

export const transformationService = {
  async improvePrompt(prompt: string) {
    console.log('Improving prompt:', prompt);
    
    if (!prompt?.trim()) {
      throw new Error('Prompt is required');
    }

    const { data, error } = await supabase.functions.invoke('improve-prompt', {
      body: { prompt }
    });

    if (error) {
      console.error('Improve prompt error:', error);
      throw this.createTransformationError('IMPROVE_PROMPT_ERROR', error);
    }

    return data;
  },

  async getDefaultPromptTemplate(type: ValidTransformation): Promise<string | null> {
    console.log('Fetching default prompt for type:', type);
    
    const { data, error } = await supabase
      .from('default_prompts')
      .select('prompt_template')
      .eq('transformation_type', type)
      .maybeSingle();

    if (error) {
      console.error('Error fetching default prompt:', error);
      return null;
    }

    return data?.prompt_template || null;
  },

  async transformText(
    entryId: string,
    entryText: string,
    transformationType: ValidTransformation,
    customPrompts: Array<{ prompt_name: string, prompt_template: string }>,
  ): Promise<TransformationResult> {
    console.log('Starting transformation:', {
      type: transformationType,
      textLength: entryText?.length,
      hasCustomPrompts: customPrompts?.length > 0
    });

    // Input validation
    if (!entryId) throw new Error('Entry ID is required');
    if (!entryText?.trim()) throw new Error('Entry text is required');
    if (!transformationType) throw new Error('Transformation type is required');

    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw this.createTransformationError(
        'AUTH_ERROR',
        new Error('Authentication required')
      );
    }

    try {
      // Get prompt template (custom or default)
      const customPrompt = customPrompts?.find(p => 
        p.prompt_name.toLowerCase() === transformationType.toLowerCase()
      );
      
      let promptTemplate = customPrompt?.prompt_template;
      
      if (!promptTemplate) {
        promptTemplate = await this.getDefaultPromptTemplate(transformationType);
        console.log('Using default prompt template:', !!promptTemplate);
      }

      // Call transform-text function
      console.log('Calling transform-text with template:', promptTemplate?.substring(0, 50));
      const { data, error: transformError } = await supabase.functions.invoke('transform-text', {
        body: { 
          text: entryText,
          transformationType,
          customTemplate: promptTemplate
        }
      });

      if (transformError) {
        throw this.createTransformationError('TRANSFORM_ERROR', transformError);
      }

      if (!data?.transformedText) {
        throw new Error('No transformed text received from the service');
      }

      // Save to summaries table
      console.log('Saving transformation to summaries...');
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: entryId,
          user_id: session.user.id,
          transformed_text: data.transformedText,
          transformation_type: transformationType
        });

      if (saveError) {
        throw this.createTransformationError('SAVE_ERROR', saveError);
      }

      return {
        transformedText: data.transformedText,
        type: transformationType
      };

    } catch (error) {
      console.error('Transformation error:', error);
      throw this.createTransformationError(
        'TRANSFORM_ERROR',
        error as Error
      );
    }
  },

  createTransformationError(code: string, originalError: Error): TransformationError {
    const error = new Error(originalError.message) as TransformationError;
    error.code = code;
    error.details = originalError.toString();
    return error;
  }
};

// Helper hook for handling transformations with UI feedback
export const useTransformationService = () => {
  const { toast } = useToast();

  const handleTransformation = async (
    entryId: string,
    entryText: string,
    transformationType: ValidTransformation,
    customPrompts: Array<{ prompt_name: string, prompt_template: string }>,
  ) => {
    try {
      const result = await transformationService.transformText(
        entryId,
        entryText,
        transformationType,
        customPrompts
      );

      toast({
        description: "Text transformed successfully",
      });

      return result;
    } catch (error) {
      const transformError = error as TransformationError;
      console.error('Transformation failed:', transformError);

      let errorMessage = 'Failed to transform text';
      if (transformError.code === 'AUTH_ERROR') {
        errorMessage = 'Please sign in to transform text';
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  return {
    handleTransformation,
    improvePrompt: transformationService.improvePrompt.bind(transformationService)
  };
};
