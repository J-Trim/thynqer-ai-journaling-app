import { AnalysisComponent } from './types';

export const audioPlayerComponent: AnalysisComponent = {
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
              console.error('No audio URL provided');
              setError('No audio URL provided');
              return;
            }

            const filename = audioUrl.split('/').pop()?.split('?')[0];
            if (!filename) {
              console.error('Invalid audio URL format:', audioUrl);
              setError('Invalid audio URL format');
              return;
            }

            console.log('Starting audio download for:', filename);
            
            const { data: audioData, error: downloadError } = await supabase.storage
              .from('audio_files')
              .download(filename);

            if (downloadError) {
              console.error('Error downloading audio:', downloadError);
              setError(\`Error downloading audio: \${downloadError.message}\`);
              return;
            }

            if (!audioData) {
              console.error('No audio data received from storage');
              setError('No audio data received');
              return;
            }

            const mimeType = getMimeType(filename);
            const audioBlob = new Blob([audioData], { type: mimeType });
            console.log('Created audio blob with type:', mimeType);

            // Calculate duration using Web Audio API
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const calculatedDuration = audioBuffer.duration;
            setTotalDuration(calculatedDuration);
            console.log('Calculated audio duration:', calculatedDuration);

            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current);
            }

            const newBlobUrl = URL.createObjectURL(audioBlob);
            blobUrlRef.current = newBlobUrl;
            console.log('Created blob URL:', newBlobUrl);

            if (!audioRef.current) {
              audioRef.current = new Audio();
            }

            const audio = audioRef.current;
            audio.src = newBlobUrl;
            audio.muted = isMuted;

            const handleLoadedMetadata = () => {
              console.log('Audio metadata loaded. Duration:', audio.duration);
              if (isFinite(audio.duration)) {
                setDuration(audio.duration);
              }
            };

            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.load();
            
            await new Promise((resolve, reject) => {
              const handleCanPlay = () => {
                console.log('Audio can play. Duration:', audio.duration);
                audio.removeEventListener('canplay', handleCanPlay);
                resolve(true);
              };

              const handleError = (e: Event) => {
                console.error('Error loading audio:', e);
                audio.removeEventListener('error', handleError);
                reject(new Error('Failed to load audio'));
              };

              audio.addEventListener('canplay', handleCanPlay);
              audio.addEventListener('error', handleError);
            });

            setError(null);
            setIsLoading(false);
            
          } catch (error: any) {
            console.error('Error in audio setup:', error);
            setError(\`Error setting up audio: \${error.message}\`);
            setIsLoading(false);
          }
        };

        initializeAudio();

        return () => {
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
          }
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
        };
      }, [audioUrl, isMuted]);

      if (isLoading) {
        return <div className="text-muted-foreground">Loading audio...</div>;
      }

      if (error) {
        return (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        );
      }

      return (
        <div className="p-4 bg-secondary rounded-lg space-y-4">
          <div className="flex items-center gap-4">
            <AudioControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              volume={volume}
              onPlayPause={togglePlay}
              onMuteToggle={toggleMute}
              onVolumeChange={handleVolumeChange}
              hasEnded={hasEnded}
              showVolumeSlider={showVolumeSlider}
              setShowVolumeSlider={setShowVolumeSlider}
            />
            <AudioProgress
              progress={progress}
              duration={totalDuration || duration}
              currentTime={currentTime}
              onProgressChange={(values: number[]) => handleProgressChange(values[0])}
            />
          </div>
        </div>
      );
    };
  `
};

export const audioHandlerComponent: AnalysisComponent = {
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
          console.log('Starting audio transcription process for:', audioFileName);
          
          // Save the audio URL first
          onAudioSaved(audioFileName);
          
          console.log('Invoking transcribe-audio function...');
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audioUrl: audioFileName }
          });

          if (error) {
            console.error('Transcription error:', error);
            throw error;
          }

          if (data?.text) {
            console.log('Transcription completed successfully');
            onTranscriptionComplete(data.text);
          } else {
            console.error('No transcription text received');
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
