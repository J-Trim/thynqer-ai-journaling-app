
import { Brain, Briefcase, Share2, PenTool } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const TRANSFORMATION_TYPES = {
  "Personal Growth": {
    icon: Brain,
    items: [
      'Quick Summary',
      'Emotional Check-In',
      'Daily Affirmation',
      'Mindfulness Reflection',
      'Psychoanalysis',
      'Goal Setting',
      'Short Paraphrase'
    ] as ValidTransformation[]
  },
  "Professional": {
    icon: Briefcase,
    items: [
      'Lesson Plan',
      'Meeting Agenda',
      'Project Proposal',
      'Action Plan',
      'Performance Review',
      'Team Update / Status Report',
      'Training Outline',
      'Sales Pitch',
      'Corporate Email / Internal Memo',
      'Project Retrospective',
      'Implementation Plan',
      'Executive Summary',
      'Brainstorm Session Outline',
      'Risk Assessment',
      'Professional White Paper',
      '2nd Iambic Pentameter Rap'
    ] as ValidTransformation[]
  },
  "Social Media": {
    icon: Share2,
    items: [
      'Blog Post',
      'Email',
      'Instagram Post',
      'YouTube Script',
      'X (Twitter) Post',
      'Instagram Reel / TikTok Clip',
      'Podcast Show Notes',
      'LinkedIn Article',
      'Motivational Snippet'
    ] as ValidTransformation[]
  },
  "Custom": {
    icon: PenTool,
    items: [] as ValidTransformation[]
  }
} as const;
