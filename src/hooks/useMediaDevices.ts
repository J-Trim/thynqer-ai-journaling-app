
import { useState, useCallback } from 'react';
import { isPermissionError, isDeviceError, handleError } from '@/utils/errorHandler';

export const useMediaDevices = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const requestMicrophoneAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      setMediaStream(stream);
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
  }, []);

  const cleanup = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped and released');
      });
      setMediaStream(null);
    }
  }, [mediaStream]);

  return {
    mediaStream,
    requestMicrophoneAccess,
    cleanup
  };
};
