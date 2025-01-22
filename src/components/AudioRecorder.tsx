import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Square, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AudioRecorderProps {
  onAudioSaved?: (url: string) => void;
}

const AudioRecorder = ({ onAudioSaved }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      const fileName = `${crypto.randomUUID()}.webm`;
      const { data, error } = await supabase.storage
        .from('audio_files')
        .upload(fileName, audioBlob, {
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      startTimer();
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Could not start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.pause();
      setIsPaused(true);
      stopTimer();
      console.log("Recording paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.resume();
      setIsPaused(false);
      startTimer();
      console.log("Recording resumed");
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      
      // Wait for the last chunk to be processed
      await new Promise<void>((resolve) => {
        if (mediaRecorder.current) {
          mediaRecorder.current.onstop = () => resolve();
        } else {
          resolve();
        }
      });

      try {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const fileName = await uploadAudio(audioBlob);
        
        if (onAudioSaved) {
          onAudioSaved(fileName);
        }

        toast({
          title: "Success",
          description: "Audio recording saved successfully",
        });
      } catch (error) {
        console.error("Error saving audio:", error);
        toast({
          title: "Error",
          description: "Failed to save audio recording",
          variant: "destructive",
        });
      }

      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
      setRecordingTime(0);
      audioChunks.current = [];
      console.log("Recording stopped");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-secondary rounded-lg shadow-sm animate-fade-in">
      <div className="text-2xl font-semibold text-text mb-4">
        {formatTime(recordingTime)}
      </div>
      <div className="flex space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="bg-primary hover:bg-primary-hover text-white"
          >
            <Mic className="w-6 h-6" />
          </Button>
        ) : (
          <>
            {!isPaused ? (
              <Button
                onClick={pauseRecording}
                className="bg-accent hover:bg-accent-hover text-text"
              >
                <Pause className="w-6 h-6" />
              </Button>
            ) : (
              <Button
                onClick={resumeRecording}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                <Play className="w-6 h-6" />
              </Button>
            )}
            <Button
              onClick={stopRecording}
              variant="destructive"
            >
              <Square className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;