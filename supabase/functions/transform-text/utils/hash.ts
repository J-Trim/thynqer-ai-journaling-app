
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

export const generateInputHash = async (text: string, template?: string): Promise<string> => {
  const textEncoder = new TextEncoder();
  const hashData = textEncoder.encode(text + (template || ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
  return encodeHex(new Uint8Array(hashBuffer));
};
