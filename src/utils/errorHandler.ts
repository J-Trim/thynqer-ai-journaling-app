
import { toast } from "@/hooks/use-toast";

type ErrorType = 'network' | 'validation' | 'server' | 'permission' | 'device' | 'storage' | 'general';

interface ErrorDetails {
  type: ErrorType;
  message: string;
  context?: string;
  error?: unknown;
}

export function handleError({ type, message, context, error }: ErrorDetails) {
  // Log the error with context for debugging
  console.error(`[${type}] ${context ? `${context}: ` : ''}`, error || message);

  // User-friendly error messages based on type
  const userMessages: Record<ErrorType, string> = {
    network: "Connection error. Please check your internet connection and try again.",
    validation: "Invalid input. Please check your data and try again.",
    server: "Server error. Our team has been notified and is working on it.",
    permission: "Permission denied. Please allow microphone access to record audio.",
    device: "Device error. Please check your microphone settings.",
    storage: "Storage error. Please try again or contact support.",
    general: "An unexpected error occurred. Please try again."
  };

  // Show toast notification with user-friendly message
  toast({
    title: `Error: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    description: message || userMessages[type],
    variant: "destructive",
  });

  return { type, message: userMessages[type], originalError: error };
}

export function isPermissionError(error: unknown): boolean {
  return error instanceof Error && 
    (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
}

export function isDeviceError(error: unknown): boolean {
  return error instanceof Error && 
    (error.name === 'NotFoundError' || error.name === 'NotReadableError');
}

