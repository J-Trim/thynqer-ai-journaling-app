
export const getSystemPrompt = (transformationType: string) => {
  // Basic prompt templates
  const prompts: Record<string, string> = {
    'Quick Summary': 'Provide a concise summary of the main points.',
    'Emotional Check-In': 'Analyze the emotional tone and key feelings expressed.',
    'Daily Affirmation': 'Create positive affirmations based on the strengths shown.',
    'Mindfulness Reflection': 'Highlight mindful observations and present-moment awareness.',
    'Goal Setting': 'Extract and structure goals and action items.',
    'Short Paraphrase': 'Rephrase the key message briefly.',
    'Project Proposal': 'Format this as a structured project proposal.',
    'Meeting Agenda': 'Convert this into a clear meeting agenda.',
    'Blog Post': 'Transform this into a blog post format.',
    'Email': 'Convert this into a professional email format.',
    'YouTube Script': 'Adapt this into a YouTube video script.',
    'Podcast Show Notes': 'Create podcast show notes from this content.',
  };

  return prompts[transformationType] || 'Transform this text while maintaining its core meaning and intent.';
};

export const callDeepSeek = async (prompt: string, apiKey: string): Promise<string> => {
  console.log('Calling DeepSeek API...');
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that transforms text based on specific instructions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('DeepSeek API error:', error);
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format from DeepSeek');
  }

  return data.choices[0].message.content;
};
