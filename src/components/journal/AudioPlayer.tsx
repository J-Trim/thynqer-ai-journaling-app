import React, { useRef, useEffect } from 'react';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { useAudioVolume } from '@/hooks/useAudioVolume';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import AudioControls from './audio/AudioControls';
import AudioProgress from './audio/AudioProgress';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AudioPlayerProps {
  audioUrl: string;
}

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
          setError(`Error downloading audio: ${downloadError.message}`);
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
        
      } catch (error) {
        console.error('Error in audio setup:', error);
        setError(`Error setting up audio: ${error.message}`);
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
          onProgressChange={handleProgressChange}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;