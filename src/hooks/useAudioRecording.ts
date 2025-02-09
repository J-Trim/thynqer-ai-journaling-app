
import { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName } from "@/utils/audio";
import { handleError, isPermissionError, isDeviceError } from "@/utils/errorHandler";

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
      let errorType: 'permission' | 'device' | 'general' = 'general';
      let message = 'Could not access microphone.';

      if (isPermissionError(error)) {
        errorType = 'permission';
        message = 'Microphone access was denied. Please enable it in your browser settings.';
      } else if (isDeviceError(error)) {
        errorType = 'device';
        message = error instanceof Error && error.name === 'NotFoundError' 
          ? 'No microphone was found on your device.'
          : 'Your microphone is already in use by another application.';
      }

      handleError({
        type: errorType,
        message,
        context: 'MicrophoneAccess',
        error
      });
      
      return { success: false, error: message };
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      const { success, error, stream } = await requestPermissions();
      
      if (!success || !stream) {
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
          handleError({
            type: 'device',
            message: 'Recording error occurred',
            context: 'MediaRecorder',
            error: event.error
          });
          cleanupResources();
        };

        mediaRecorder.current.start(1000);
        setIsRecording(true);
        setIsPaused(false);
        startTimer();
      } catch (error) {
        handleError({
          type: 'device',
          message: 'Could not start recording',
          context: 'RecordingStart',
          error
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
        handleError({
          type: 'storage',
          message: 'Failed to save audio recording',
          context: 'AudioSave',
          error
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

