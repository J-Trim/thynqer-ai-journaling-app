import { analyzeComponent } from './analysis/analyzeComponent';
import { audioPlayerComponent, audioHandlerComponent } from './analysis/components';

export const runComponentAnalysis = async () => {
  try {
    console.log('Starting component analysis...');
    
    const results = await Promise.all([
      analyzeComponent(audioPlayerComponent.name, audioPlayerComponent.code),
      analyzeComponent(audioHandlerComponent.name, audioHandlerComponent.code)
    ]);

    console.log('Analysis completed for all components:', results);
    return results;
  } catch (error) {
    console.error('Error running component analysis:', error);
    throw error;
  }
};