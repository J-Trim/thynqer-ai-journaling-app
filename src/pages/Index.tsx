import { useEffect } from "react";
import { CodeAnalysis } from "@/components/CodeAnalysis";
import { analyzeComponent } from "@/utils/analysis/analyzeComponent";
import { TransformationManager } from "@/components/journal/transformations/TransformationManager";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const { toast } = useToast();

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        console.log('Starting TransformationManager analysis...');
        const analysis = await analyzeComponent(
          'TransformationManager',
          TransformationManager.toString()
        );
        console.log('Analysis completed:', analysis);
      } catch (error) {
        console.error('Analysis failed:', error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the TransformationManager component",
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