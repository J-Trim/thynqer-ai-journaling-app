export const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getMimeType = (filename: string): string => {
  if (filename.toLowerCase().endsWith('.webm')) return 'audio/webm';
  if (filename.toLowerCase().endsWith('.mp3')) return 'audio/mpeg';
  return 'audio/webm'; // Default to webm
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^\x00-\x7F]/g, '');
};