import { PenTool } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const TRANSFORMATION_TYPES = {
  "Custom": {
    icon: PenTool,
    items: [] as ValidTransformation[]
  }
} as const;