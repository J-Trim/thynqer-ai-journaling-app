
export const getSystemPrompt = (transformationType: string) => {
  const prompts: Record<string, string> = {
    'Psychoanalysis': `Analyze this text through various therapeutic lenses to provide deep psychological insights. Focus on:
      - Key emotional patterns and themes
      - Underlying motivations and beliefs
      - Potential areas for growth and self-awareness`,
    'Quick Summary': `Provide a clear, concise summary that captures:
      - Main points and key insights
      - Important details and context
      - Core message or takeaway`,
    'Emotional Check-In': `Analyze the emotional content by:
      - Identifying primary and secondary emotions
      - Noting emotional patterns or shifts
      - Suggesting potential emotional triggers`,
    'Daily Affirmation': `Transform key positive elements into:
      - Personalized, powerful affirmations
      - Growth-oriented statements
      - Confidence-building messages`,
    'Mindfulness Reflection': `Create a mindful reflection focusing on:
      - Present-moment awareness
      - Non-judgmental observations
      - Mindful insights and learnings`,
    'Goal Setting': `Extract and structure future-oriented elements into:
      - Clear, achievable goals
      - Action steps
      - Success metrics`,
    'Short Paraphrase': `Provide a concise paraphrase that:
      - Maintains core meaning
      - Highlights key points
      - Uses clear, direct language`
  };

  return prompts[transformationType] || 'Transform this text while maintaining its core meaning and intent.';
};

export const callDeepSeek = async (prompt: string, apiKey: string): Promise<string> => {
  console.log('Sending request to DeepSeek API...');
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('DeepSeek API error:', error);
    throw new Error(error.error?.message || 'Failed to get response from DeepSeek');
  }

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid response format from DeepSeek:', data);
    throw new Error('Invalid response format from DeepSeek');
  }

  return data.choices[0].message.content;
};
