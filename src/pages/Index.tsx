import { useEffect } from "react";
import { CodeAnalysis } from "@/components/CodeAnalysis";
import { analyzeComponent } from "@/utils/analysis/analyzeComponent";
import { TransformationManager } from "@/components/journal/transformations/TransformationManager";
import { TransformationSelector } from "@/components/journal/TransformationSelector";
import { TransformationsList } from "@/components/journal/TransformationsList";
import { TransformationButtons } from "@/components/journal/transformations/TransformationButtons";
import { TransformationDialog } from "@/components/journal/transformations/TransformationDialog";
import { TransformationForm } from "@/components/journal/transformations/TransformationForm";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const { toast } = useToast();

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        console.log('Starting transformation components analysis...');
        
        const componentsToAnalyze = [
          { name: 'TransformationManager', component: TransformationManager },
          { name: 'TransformationSelector', component: TransformationSelector },
          { name: 'TransformationsList', component: TransformationsList },
          { name: 'TransformationButtons', component: TransformationButtons },
          { name: 'TransformationDialog', component: TransformationDialog },
          { name: 'TransformationForm', component: TransformationForm }
        ];

        for (const { name, component } of componentsToAnalyze) {
          console.log(`Analyzing ${name}...`);
          const analysis = await analyzeComponent(name, component.toString());
          console.log(`${name} analysis completed:`, analysis);
        }

        console.log('All analyses completed');
      } catch (error) {
        console.error('Analysis failed:', error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze transformation components",
          variant: "destructive",
        });
      }
    };

    runAnalysis();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <CodeAnalysis />
    </div>
  );
}