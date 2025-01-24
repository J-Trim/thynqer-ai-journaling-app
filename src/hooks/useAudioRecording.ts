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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          toast({
            title: "Permission Required",
            description: "Microphone access is required for recording.",
            variant: "destructive",
          });
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
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
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
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
          description: "Failed to save audio recording",
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