
import { ErrorLog } from '../types.ts';

export function logError(context: string, error: any, metadata: Record<string, any> = {}) {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    },
    metadata,
  };
  
  console.error('Subscription Check Error:', JSON.stringify(errorLog, null, 2));
}
