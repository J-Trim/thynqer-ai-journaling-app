import { supabase } from "@/integrations/supabase/client";

interface ComponentAnalysis {
  complexity: string;
  performance: string;
  bestPractices: string;
  improvements: string;
}

export const analyzeComponent = async (componentName: string, code: string) => {
  console.log(`Starting analysis for ${componentName}...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { 
        componentName,
        code 
      }
    });

    if (error) {
      console.error(`Error analyzing ${componentName}:`, error);
      throw error;
    }

    console.log(`Analysis completed for ${componentName}:`, data);
    return data.analysis as ComponentAnalysis;
  } catch (error) {
    console.error('Error in analyzeComponent:', error);
    throw error;
  }
};

export const analyzeJournalComponents = async () => {
  const components = [
    {
      name: 'JournalEntry',
      code: `
        // Component code for JournalEntry
        import React from 'react';
        import { format } from 'date-fns';
        import { Card } from '@/components/ui/card';
        import { Button } from '@/components/ui/button';
        import { Pencil, Trash } from 'lucide-react';
        
        interface JournalEntryProps {
          id: string;
          title: string;
          date: string;
          preview: string;
          hasBeenEdited: boolean;
          onClick: () => void;
          onDelete: () => void;
        }
        
        const JournalEntry = ({
          id,
          title,
          date,
          preview,
          hasBeenEdited,
          onClick,
          onDelete,
        }: JournalEntryProps) => {
          const handleDelete = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this entry?')) {
              onDelete();
            }
          };
        
          return (
            <Card
              className="p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={onClick}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(date), 'PPP')}
                    {hasBeenEdited && ' (edited)'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground line-clamp-3">{preview}</p>
            </Card>
          );
        };
        
        export default JournalEntry;
      `
    },
    {
      name: 'AudioPlayer',
      code: `
        import React, { useState, useRef, useEffect } from 'react';
        import { Button } from '@/components/ui/button';
        import { Slider } from '@/components/ui/slider';
        import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
        
        interface AudioPlayerProps {
          audioUrl: string;
        }
        
        const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
          const [isPlaying, setIsPlaying] = useState(false);
          const [currentTime, setCurrentTime] = useState(0);
          const [duration, setDuration] = useState(0);
          const [volume, setVolume] = useState(1);
          const [isMuted, setIsMuted] = useState(false);
          const audioRef = useRef<HTMLAudioElement>(null);
        
          useEffect(() => {
            const audio = audioRef.current;
            if (!audio) return;
        
            const handleLoadedMetadata = () => {
              setDuration(audio.duration);
            };
        
            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            return () => {
              audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
          }, [audioUrl]);
        
          useEffect(() => {
            const audio = audioRef.current;
            if (!audio) return;
        
            const handleTimeUpdate = () => {
              setCurrentTime(audio.currentTime);
            };
        
            audio.addEventListener('timeupdate', handleTimeUpdate);
            return () => {
              audio.removeEventListener('timeupdate', handleTimeUpdate);
            };
          }, []);
        
          const togglePlay = () => {
            if (audioRef.current) {
              if (isPlaying) {
                audioRef.current.pause();
              } else {
                audioRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }
          };
        
          const handleSliderChange = (value: number[]) => {
            if (audioRef.current) {
              audioRef.current.currentTime = value[0];
              setCurrentTime(value[0]);
            }
          };
        
          const toggleMute = () => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }
          };
        
          const handleVolumeChange = (value: number[]) => {
            if (audioRef.current) {
              audioRef.current.volume = value[0];
              setVolume(value[0]);
            }
          };
        
          return (
            <div className="space-y-4">
              <audio ref={audioRef} src={audioUrl} />
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          );
        };
        
        export default AudioPlayer;
      `
    }
  ];

  console.log('Starting journal components analysis...');

  try {
    const analyses = await Promise.all(
      components.map(async (component) => {
        const analysis = await analyzeComponent(component.name, component.code);
        return {
          componentName: component.name,
          analysis
        };
      })
    );

    console.log('All analyses completed:', analyses);
    return analyses;
  } catch (error) {
    console.error('Error in analyzeJournalComponents:', error);
    throw error;
  }
};

// Let's analyze the CodeAnalysis component
const codeAnalysisComponent = {
  name: 'CodeAnalysis',
  code: `
    import { useQuery } from "@tanstack/react-query";
    import { supabase } from "@/integrations/supabase/client";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { ScrollArea } from "@/components/ui/scroll-area";

    interface AnalysisResult {
      complexity: string;
      performance: string;
      bestPractices: string;
      improvements: string;
    }

    interface CodeAnalysis {
      id: string;
      component_name: string;
      analysis_result: AnalysisResult;
      analyzed_at: string;
    }

    interface SupabaseAnalysis {
      id: string;
      component_name: string;
      analysis_result: {
        complexity: string;
        performance: string;
        bestPractices: string;
        improvements: string;
      };
      analyzed_at: string;
    }

    export const CodeAnalysis = () => {
      const { data: analyses, isLoading, error } = useQuery({
        queryKey: ['code-analysis'],
        queryFn: async () => {
          console.log('Fetching code analysis results...');
          const { data, error } = await supabase
            .from('code_analysis')
            .select('*')
            .order('analyzed_at', { ascending: false });

          if (error) {
            console.error('Error fetching analysis:', error);
            throw error;
          }

          console.log('Retrieved analyses:', data);
          
          // Type assertion and validation
          const validatedData = (data as SupabaseAnalysis[]).map(item => ({
            id: item.id,
            component_name: item.component_name,
            analysis_result: {
              complexity: item.analysis_result.complexity || '',
              performance: item.analysis_result.performance || '',
              bestPractices: item.analysis_result.bestPractices || '',
              improvements: item.analysis_result.improvements || ''
            },
            analyzed_at: item.analyzed_at
          }));

          return validatedData as CodeAnalysis[];
        }
      });

      if (isLoading) {
        return <div className="text-muted-foreground">Loading analysis results...</div>;
      }

      if (error) {
        return <div className="text-destructive">Error loading analysis results</div>;
      }

      if (!analyses?.length) {
        return <div className="text-muted-foreground">No analysis results found</div>;
      }

      return (
        <div className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">Component Analysis Results</h2>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card key={analysis.id}>
                  <CardHeader>
                    <CardTitle>{analysis.component_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Complexity</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.complexity}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Performance</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.performance}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Best Practices</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.bestPractices}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Suggested Improvements</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.improvements}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      );
    };
  `
};

// Analyze the component
analyzeComponent(codeAnalysisComponent.name, codeAnalysisComponent.code).catch(console.error);
