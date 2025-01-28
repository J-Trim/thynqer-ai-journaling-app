import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import { chatWithDeepSeek, type Message } from "@/utils/deepseek";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CustomPromptFormProps {
  onPromptSave: () => void;
}

export const CustomPromptForm = ({ onPromptSave }: CustomPromptFormProps) => {
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptTemplate, setNewPromptTemplate] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      console.log('Getting current session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session found');
        toast({
          title: "Error",
          description: "Please sign in to save custom prompts",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      console.log('Saving custom prompt to Supabase...');
      const { error: saveError } = await supabase
        .from('custom_prompts')
        .insert({
          user_id: session.user.id,
          prompt_name: newPromptName,
          prompt_template: newPromptTemplate
        });

      if (saveError) {
        console.error('Error saving custom prompt:', saveError);
        throw saveError;
      }

      console.log('Custom prompt saved successfully');
      toast({
        description: "Custom prompt created successfully",
      });

      // Reset form
      setNewPromptName("");
      setNewPromptTemplate("");
      onPromptSave();
      
    } catch (err) {
      console.error('Error creating custom prompt:', err);
      toast({
        title: "Error",
        description: "Failed to create custom prompt",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Prompt Name"
          value={newPromptName}
          onChange={(e) => setNewPromptName(e.target.value)}
        />
        <div className="space-y-2">
          <Textarea
            placeholder="Write your custom prompt here..."
            value={newPromptTemplate}
            onChange={(e) => setNewPromptTemplate(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleEnhancePrompt}
            disabled={isEnhancing}
          >
            {isEnhancing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
          </Button>
        </div>
        <Button 
          onClick={handleCreateCustomPrompt}
          className="w-full"
        >
          Save Custom Prompt
        </Button>
      </div>
    </div>
  );
};