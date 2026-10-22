export type GoalPriority = 'must_do' | 'should' | 'bonus';

export interface GoalItem {
  id: string;
  text: string;
  priority: GoalPriority;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface DayRecord {
  id?: string;
  date: string;
  morning_intention: string;
  energy: number;
  morning_photo_url?: string;
  morning_photo_public_id?: string;
  morning_photo_time?: string;
  goals: GoalItem[];
  evening_reflection: string;
  evening_mood: number;
  is_day_closed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WinRecord {
  id: string;
  date: string;
  title: string;
  note: string;
  photo_url?: string;
  photo_public_id?: string;
  tag: string;
  created_at: string;
}

export interface StatsResponse {
  streak: number;
  total_wins: number;
  total_goals: number;
  completed_goals: number;
  completion_rate: number;
  total_days_count: number;
}
