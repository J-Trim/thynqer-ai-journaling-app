export const getAnalysisPrompt = (component: string, code: string) => `
Analyze this React ${component} component and provide detailed feedback in JSON format. Focus on:
1. Code complexity and potential simplifications
2. Performance optimizations
3. React best practices and potential improvements
4. Accessibility considerations
5. State management
6. Error handling
7. Component organization

Format your response as a JSON object with these exact keys:
{
  "complexity": string,
  "performance": string,
  "bestPractices": string,
  "improvements": string[]
}`;