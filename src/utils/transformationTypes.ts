
import { Brain, Briefcase, Share2, PenTool } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const TRANSFORMATION_TYPES = {
  "Analysis": {
    icon: Brain,
    items: [
      'Quick Summary',
      'Key Insights',
      'Emotional Analysis',
      'Therapy Insights',
      'Daily Summary'
    ] as ValidTransformation[]
  },
  "Action": {
    icon: Briefcase,
    items: [
      'Action Items',
      'Questions'
    ] as ValidTransformation[]
  },
  "Custom": {
    icon: PenTool,
    items: [] as ValidTransformation[]
  }
} as const;

