import { supabase } from "@/integrations/supabase/client";

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: Message;
    finish_reason: string;
  }>;
}

export const chatWithDeepSeek = async (messages: Message[]): Promise<string> => {
  try {
    console.log('Sending chat request to DeepSeek...');
    const { data, error } = await supabase.functions.invoke('deepseek-chat', {
      body: { messages }
    });

    if (error) {
      console.error('Error calling DeepSeek:', error);
      throw error;
    }

    const response = data as DeepSeekResponse;
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Failed to chat with DeepSeek:', error);
    throw error;
  }
};