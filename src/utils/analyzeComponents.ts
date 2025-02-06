import { supabase } from "@/integrations/supabase/client";

interface ComponentAnalysis {
  complexity: string;
  performance: string;
  bestPractices: string;
  improvements: string[];
}

export const analyzeComponent = async (componentName: string, code: string) => {
  console.log(`Starting analysis for ${componentName}...`);
  
  try {
    const { data, error: analysisError } = await supabase.functions.invoke('analyze-code', {
      body: { 
        componentName,
        code 
      }
    });

    if (analysisError) {
      console.error(`Error analyzing ${componentName}:`, analysisError);
      throw analysisError;
    }

    console.log(`Analysis completed for ${componentName}:`, data);
    return data.analysis as ComponentAnalysis;
  } catch (error) {
    console.error('Error in analyzeComponent:', error);
    throw error;
  }
};

// Analyze the AudioPlayer component
const audioPlayerComponent = {
  name: 'AudioPlayer',
  code: `
    const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
      const [error, setError] = useState<string | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [totalDuration, setTotalDuration] = useState<number | null>(null);
      const audioRef = useRef<HTMLAudioElement | null>(null);
      const blobUrlRef = useRef<string | null>(null);

      const { isPlaying, hasEnded, togglePlay } = useAudioPlayback({
        audioRef,
        onPlaybackEnd: () => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        }
      });

      const {
        volume,
        isMuted,
        showVolumeSlider,
        setShowVolumeSlider,
        handleVolumeChange,
        toggleMute
      } = useAudioVolume({ audioRef });

      const {
        progress,
        currentTime,
        duration,
        setDuration,
        handleProgressChange
      } = useAudioProgress({ audioRef, isPlaying, totalDuration });

      useEffect(() => {
        const initializeAudio = async () => {
          try {
            setIsLoading(true);
            setError(null);
            
            if (!audioUrl) {
              throw new Error('No audio URL provided');
            }

            const filename = audioUrl.split('/').pop()?.split('?')[0];
            if (!filename) {
              throw new Error('Invalid audio URL format');
            }

            const { data: audioData, error: downloadError } = await supabase.storage
              .from('audio_files')
              .download(filename);

            if (downloadError || !audioData) {
              throw new Error(downloadError?.message || 'No audio data received');
            }

            const mimeType = getMimeType(filename);
            const audioBlob = new Blob([audioData], { type: mimeType });
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setTotalDuration(audioBuffer.duration);

            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current);
            }

            const newBlobUrl = URL.createObjectURL(audioBlob);
            blobUrlRef.current = newBlobUrl;

            if (!audioRef.current) {
              audioRef.current = new Audio();
            }

            const audio = audioRef.current;
            audio.src = newBlobUrl;
            audio.muted = isMuted;

            await new Promise<void>((resolve, reject) => {
              const handleCanPlay = () => {
                audio.removeEventListener('canplay', handleCanPlay);
                resolve();
              };

              const handleError = (e: Event) => {
                audio.removeEventListener('error', handleError);
                reject(new Error('Failed to load audio'));
              };

              audio.addEventListener('canplay', handleCanPlay);
              audio.addEventListener('error', handleError);
              audio.load();
            });

            setError(null);
          } catch (err: any) {
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        };

        initializeAudio();
        return () => cleanup();
      }, [audioUrl, isMuted]);

      return (
        <div className="p-4 bg-secondary rounded-lg space-y-4">
          <AudioControls {...controlProps} />
          <AudioProgress {...progressProps} />
        </div>
      );
    };
  `
};

// Analyze the AudioHandler component
const audioHandlerComponent = {
  name: 'AudioHandler',
  code: `
    const AudioHandler = ({ 
      onAudioSaved, 
      onTranscriptionComplete,
      isRecording,
      isPaused,
      isProcessing,
      onToggleRecording,
      onStopRecording
    }: AudioHandlerProps) => {
      const [isTranscribing, setIsTranscribing] = useState(false);

      const handleAudioSaved = async (audioFileName: string) => {
        try {
          setIsTranscribing(true);
          onAudioSaved(audioFileName);
          
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audioUrl: audioFileName }
          });

          if (error) throw error;
          if (data?.text) {
            onTranscriptionComplete(data.text);
          } else {
            throw new Error('No transcription text received');
          }
        } catch (error) {
          console.error('Transcription error:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      return (
        <div className="relative">
          <AudioRecorder 
            onAudioSaved={handleAudioSaved}
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessing={isProcessing}
            onToggleRecording={onToggleRecording}
            onStopRecording={onStopRecording}
          />
          {isTranscribing && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Transcribing audio...</span>
            </div>
          )}
        </div>
      );
    };
  `
};

// Trigger the analysis
analyzeComponent(audioPlayerComponent.name, audioPlayerComponent.code).catch(console.error);
analyzeComponent(audioHandlerComponent.name, audioHandlerComponent.code).catch(console.error);