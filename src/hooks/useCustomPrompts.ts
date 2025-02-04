import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCustomPrompts = () => {
  const [customPrompts, setCustomPrompts] = useState<Array<{ prompt_name: string, prompt_template: string }>>([]);
  const { toast } = useToast();

  const fetchCustomPrompts = async () => {
    try {
      console.log('Fetching custom prompts...');
      const { data: prompts, error } = await supabase
        .from('custom_prompts')
        .select('prompt_name, prompt_template');

      if (error) {
        console.error('Error fetching custom prompts:', error);
        throw error;
      }

      if (prompts) {
        console.log('Custom prompts fetched:', prompts);
        setCustomPrompts(prompts);
      }
    } catch (err) {
      console.error('Error in fetchCustomPrompts:', err);
      toast({
        title: "Error",
        description: "Failed to fetch custom prompts",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCustomPrompts();
  }, []);

  return {
    customPrompts,
    fetchCustomPrompts
  };
};