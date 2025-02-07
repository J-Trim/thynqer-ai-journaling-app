
export interface ErrorLog {
  timestamp: string;
  context: string;
  error: {
    name?: string;
    message?: string;
    stack?: string;
  };
  metadata: Record<string, any>;
}

export function logError(context: string, error: any, metadata: Record<string, any> = {}) {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    metadata
  };

  console.error(JSON.stringify(errorLog));
}

