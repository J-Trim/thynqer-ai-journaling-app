
export interface SubscriptionInfo {
  isSubscribed: boolean;
  tier?: string;
  features?: string[];
  expiresAt?: string;
  productId?: string;
}

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
