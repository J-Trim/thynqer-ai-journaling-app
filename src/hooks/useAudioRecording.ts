
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName } from "@/utils/audio";

export const useAudioRecording = (onAudioSaved: (url: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      const fileName = `${crypto.randomUUID()}.webm`;
      const { data, error } = await supabase.storage
        .from('audio_files')
        .upload(sanitizeFileName(fileName), audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (error) {
        console.error('Error uploading audio:', error);
        throw error;
      }

      console.log('Audio uploaded successfully:', fileName);
      return fileName;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
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
      
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      
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
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        // Handle recorder errors
        mediaRecorder.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          toast({
            title: "Recording Error",
            description: "An error occurred while recording. Please try again.",
            variant: "destructive",
          });
          stopRecording();
        };

        mediaRecorder.current.start();
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
      }
    } else {
      if (mediaRecorder.current && isRecording) {
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
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current) {
      setIsProcessing(true);
      try {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        
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

          const fileName = await uploadAudio(audioBlob);
          onAudioSaved(fileName);
        }

        setIsRecording(false);
        setIsPaused(false);
        stopTimer();
        setRecordingTime(0);
        audioChunks.current = [];
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
