import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AudioInitializerProps {
  onInitialize: () => Promise<void>;
  isLoading: boolean;
}

const AudioInitializer = ({ onInitialize, isLoading }: AudioInitializerProps) => {
  const { toast } = useToast();
  const [hasError, setHasError] = useState(false);

  const handleInitialize = async () => {
    try {
      setHasError(false);
      await onInitialize();
    } catch (error) {
      console.error('Error initializing audio:', error);
      setHasError(true);
      toast({
        title: "Error",
        description: "Failed to load audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-secondary rounded-lg">
      <Button 
        onClick={handleInitialize} 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        <Play className="h-4 w-4" />
        {isLoading ? "Loading Audio..." : "Load Audio"}
      </Button>
      {hasError && (
        <p className="text-sm text-destructive mt-2">
          Error loading audio. Please try again.
        </p>
      )}
    </div>
  );
};

export default AudioInitializer;