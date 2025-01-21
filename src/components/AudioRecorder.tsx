import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Square, Play } from "lucide-react";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunks = useRef<Blob[]>([]);

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

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
      setRecordingTime(0);
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