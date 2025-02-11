
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationError extends Error {
  code?: string;
  details?: string;
  context?: Record<string, any>;
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
      console.error('Improve prompt error:', {
        code: error.code || 'IMPROVE_PROMPT_ERROR',
        message: error.message,
        details: error.details,
        name: error.name,
        context: { prompt }
      });
      throw this.createTransformationError('IMPROVE_PROMPT_ERROR', error, { prompt });
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
      console.error('Error fetching default prompt:', {
        code: error.code,
        message: error.message,
        details: error.details,
        context: { type }
      });
      return null;
    }

    return data?.prompt_template || null;
  },

  findMatchingCustomPrompt(
    transformationType: ValidTransformation,
    customPrompts: Array<{ prompt_name: string; prompt_template: string }>
  ) {
    if (!customPrompts?.length) return null;

    // Normalize the transformation type for comparison
    const normalizedType = transformationType.toLowerCase().trim();

    // First try exact match
    let customPrompt = customPrompts.find(p => 
      p.prompt_name === transformationType
    );

    // If no exact match, try case-insensitive match
    if (!customPrompt) {
      customPrompt = customPrompts.find(p => 
        p.prompt_name.toLowerCase().trim() === normalizedType
      );
    }

    // Log the matching result for debugging
    console.log('Custom prompt matching:', {
      type: transformationType,
      found: !!customPrompt,
      promptName: customPrompt?.prompt_name,
      availablePrompts: customPrompts.map(p => p.prompt_name)
    });

    return customPrompt;
  },

  async transformText(
    entryId: string,
    entryText: string,
    transformationType: ValidTransformation,
    customPrompts: Array<{ prompt_name: string, prompt_template: string }>,
  ): Promise<TransformationResult> {
    const context = {
      entryId,
      type: transformationType,
      textLength: entryText?.length,
      hasCustomPrompts: customPrompts?.length > 0,
      customPromptsCount: customPrompts?.length
    };

    console.log('Starting transformation:', context);

    // Input validation
    if (!entryId) throw new Error('Entry ID is required');
    if (!entryText?.trim()) throw new Error('Entry text is required');
    if (!transformationType) throw new Error('Transformation type is required');

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', {
        code: sessionError.code || 'SESSION_ERROR',
        message: sessionError.message,
        details: sessionError.details,
        context
      });
      throw this.createTransformationError('SESSION_ERROR', sessionError, context);
    }

    if (!session) {
      throw this.createTransformationError(
        'AUTH_ERROR',
        new Error('Authentication required'),
        context
      );
    }

    try {
      // Find matching custom prompt with improved matching logic
      const customPrompt = this.findMatchingCustomPrompt(transformationType, customPrompts);
      let promptTemplate = customPrompt?.prompt_template;
      
      if (!promptTemplate) {
        promptTemplate = await this.getDefaultPromptTemplate(transformationType);
        console.log('Using default prompt template:', {
          type: transformationType,
          hasTemplate: !!promptTemplate,
          templatePreview: promptTemplate?.substring(0, 50)
        });
      }

      // Call transform-text function
      console.log('Calling transform-text with:', {
        type: transformationType,
        isCustom: !!customPrompt,
        templatePreview: promptTemplate?.substring(0, 50),
        context
      });

      const { data, error: transformError } = await supabase.functions.invoke('transform-text', {
        body: { 
          text: entryText,
          transformationType,
          customTemplate: promptTemplate
        }
      });

      if (transformError) {
        console.error('Transform function error:', {
          code: transformError.code || 'TRANSFORM_ERROR',
          message: transformError.message,
          details: transformError.details,
          context: { ...context, templateLength: promptTemplate?.length }
        });
        throw this.createTransformationError('TRANSFORM_ERROR', transformError, context);
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
        console.error('Save error:', {
          code: saveError.code || 'SAVE_ERROR',
          message: saveError.message,
          details: saveError.details,
          context: { 
            ...context,
            transformedTextLength: data.transformedText.length 
          }
        });
        throw this.createTransformationError('SAVE_ERROR', saveError, context);
      }

      return {
        transformedText: data.transformedText,
        type: transformationType
      };

    } catch (error) {
      const transformError = error as Error;
      console.error('Transformation error:', {
        name: transformError.name,
        message: transformError.message,
        stack: transformError.stack,
        context
      });
      throw this.createTransformationError(
        'TRANSFORM_ERROR',
        transformError,
        context
      );
    }
  },

  createTransformationError(
    code: string, 
    originalError: Error, 
    context?: Record<string, any>
  ): TransformationError {
    const error = new Error(originalError.message) as TransformationError;
    error.code = code;
    error.details = originalError.toString();
    error.context = context;
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
