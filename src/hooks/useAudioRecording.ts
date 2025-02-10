
import { useState, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName } from "@/utils/audio";
import { handleError } from "@/utils/errorHandler";
import { useMediaDevices } from './useMediaDevices';
import { useRecordingTimer } from './useRecordingTimer';

export const useAudioRecording = (onAudioSaved: (url: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const blobUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  const { mediaStream, requestMicrophoneAccess, cleanup: cleanupMediaStream } = useMediaDevices();
  const { recordingTime, startTimer, stopTimer, resetTimer } = useRecordingTimer();

  const cleanupResources = useCallback(() => {
    if (mediaRecorder.current) {
      if (mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
      mediaRecorder.current = null;
    }

    cleanupMediaStream();
    stopTimer();

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    audioChunks.current = [];
  }, [cleanupMediaStream, stopTimer]);

  const toggleRecording = useCallback(async () => {
    if (!isRecording) {
      const { success, stream, error } = await requestMicrophoneAccess();
      
      if (!success || !stream) {
        return;
      }

      try {
        // Use a MIME type that works across browsers
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType
        });
        
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.current.onerror = (event: Event) => {
          const error = event instanceof Error ? event : new Error('Recording error occurred');
          handleError({
            type: 'device',
            message: 'Recording error occurred',
            context: 'MediaRecorder',
            error
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
  }, [isRecording, isPaused, requestMicrophoneAccess, cleanupResources, startTimer, stopTimer]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current && isRecording) {
      setIsProcessing(true);
      try {
        mediaRecorder.current.stop();
        cleanupMediaStream();
        
        await new Promise<void>((resolve) => {
          if (mediaRecorder.current) {
            mediaRecorder.current.onstop = () => resolve();
          } else {
            resolve();
          }
        });

        if (audioChunks.current.length > 0) {
          const maxSize = 100 * 1024 * 1024; // 100MB limit
          const audioBlob = new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType });
          
          if (audioBlob.size > maxSize) {
            throw new Error('Recording exceeds maximum size limit of 100MB');
          }

          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          blobUrlRef.current = URL.createObjectURL(audioBlob);

          const extension = mediaRecorder.current.mimeType.includes('webm') ? 'webm' : 'mp4';
          const fileName = `${crypto.randomUUID()}.${extension}`;
          
          const { data, error } = await supabase.storage
            .from('audio_files')
            .upload(sanitizeFileName(fileName), audioBlob, {
              contentType: mediaRecorder.current.mimeType,
              upsert: false
            });

          if (error) throw error;

          onAudioSaved(fileName);
        }

        setIsRecording(false);
        setIsPaused(false);
        resetTimer();
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
  }, [isRecording, cleanupMediaStream, resetTimer]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    toggleRecording,
    stopRecording
  };
};
