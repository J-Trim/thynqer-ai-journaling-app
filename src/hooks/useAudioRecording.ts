
import { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName } from "@/utils/audio";

export const useAudioRecording = (onAudioSaved: (url: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    stopRecording();
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped and released');
      });
      mediaStream.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    audioChunks.current = [];
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      return { success: true, stream };
    } catch (error) {
      console.error('Permission error:', error);
      
      let errorMessage = 'Could not access microphone.';
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Microphone access was denied. Please enable it in your browser settings.';
            break;
          case 'NotFoundError':
            errorMessage = 'No microphone was found on your device.';
            break;
          case 'NotReadableError':
            errorMessage = 'Your microphone is already in use by another application.';
            break;
          default:
            errorMessage = `Microphone error: ${error.message}`;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      const { success, error, stream } = await requestPermissions();
      
      if (!success || !stream) {
        toast({
          title: "Microphone Access Error",
          description: error || "Could not access microphone",
          variant: "destructive",
        });
        return;
      }

      try {
        mediaStream.current = stream;
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          toast({
            title: "Recording Error",
            description: "An error occurred while recording. Please try again.",
            variant: "destructive",
          });
          cleanupResources();
        };

        mediaRecorder.current.start(1000); // Collect chunks every second
        setIsRecording(true);
        setIsPaused(false);
        startTimer();
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          title: "Error",
          description: "Could not start recording. Please check your microphone permissions.",
          variant: "destructive",
        });
        cleanupResources();
      }
    } else if (mediaRecorder.current && isRecording) {
      if (!isPaused) {
        mediaRecorder.current.pause();
        setIsPaused(true);
        stopTimer();
      } else {
        mediaRecorder.current.resume();
        setIsPaused(false);
        startTimer();
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current && isRecording) {
      setIsProcessing(true);
      try {
        mediaRecorder.current.stop();
        if (mediaStream.current) {
          mediaStream.current.getTracks().forEach(track => track.stop());
          mediaStream.current = null;
        }
        
        await new Promise<void>((resolve) => {
          if (mediaRecorder.current) {
            mediaRecorder.current.onstop = () => resolve();
          } else {
            resolve();
          }
        });

        if (audioChunks.current.length > 0) {
          const maxSize = 100 * 1024 * 1024; // 100MB limit
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          
          if (audioBlob.size > maxSize) {
            throw new Error('Recording exceeds maximum size limit of 100MB');
          }

          // Create a temp URL for local preview if needed
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          blobUrlRef.current = URL.createObjectURL(audioBlob);

          const fileName = `${crypto.randomUUID()}.webm`;
          const { data, error } = await supabase.storage
            .from('audio_files')
            .upload(sanitizeFileName(fileName), audioBlob, {
              contentType: 'audio/webm',
              upsert: false
            });

          if (error) throw error;

          onAudioSaved(fileName);
        }

        setIsRecording(false);
        setIsPaused(false);
        stopTimer();
        setRecordingTime(0);
        audioChunks.current = [];
        mediaRecorder.current = null;
      } catch (error) {
        console.error("Error stopping recording:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save audio recording",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    toggleRecording,
    stopRecording
  };
};
