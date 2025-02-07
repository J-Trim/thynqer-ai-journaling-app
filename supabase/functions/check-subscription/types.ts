
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

export interface SubscriptionCache {
  id: string;
  user_id: string;
  is_subscribed: boolean;
  tier?: string;
  features?: string[];
  expires_at?: string;
  product_id?: string;
  last_checked: string;
}

export interface RateLimit {
  id: string;
  user_id: string;
  endpoint: string;
  request_count: number;
  first_request_at: string;
}
