import { DayRecord, GoalItem, GoalPriority, StatsResponse, WinRecord } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const BACKEND_HOST = API_BASE.replace('/api', '');

export function getFullMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${BACKEND_HOST}${url}`;
}

// Local Storage Fallback helpers for 100% offline resilience
const LOCAL_STORAGE_DAYS_KEY = 'sv_local_days';
const LOCAL_STORAGE_WINS_KEY = 'sv_local_wins';

function getLocalDays(): Record<string, DayRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DAYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalDay(day: DayRecord) {
  if (typeof window === 'undefined') return;
  const days = getLocalDays();
  days[day.date] = day;
  localStorage.setItem(LOCAL_STORAGE_DAYS_KEY, JSON.stringify(days));
}

function getLocalWins(): WinRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWins(wins: WinRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_WINS_KEY, JSON.stringify(wins));
}

export const api = {
  // Get Day Record
  async getDay(date: string): Promise<DayRecord> {
    try {
      const res = await fetch(`${API_BASE}/days/${date}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        saveLocalDay(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using local storage fallback for day:', e);
    }

    const localDays = getLocalDays();
    if (localDays[date]) {
      return localDays[date];
    }

    return {
      date,
      morning_intention: '',
      energy: 3,
      goals: [],
      evening_reflection: '',
      evening_mood: 3,
      is_day_closed: false,
    };
  },

  // Update Morning Intention & Energy
  async updateIntention(date: string, intention: string, energy: number): Promise<DayRecord> {
    try {
      const res = await fetch(`${API_BASE}/days/${date}/intention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ morning_intention: intention, energy }),
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalDay(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend error, falling back locally:', e);
    }

    const day = await this.getDay(date);
    day.morning_intention = intention;
    day.energy = energy;
    saveLocalDay(day);
    return day;
  },

  // Add Morning Goal
  async addGoal(date: string, text: string, priority: GoalPriority): Promise<DayRecord> {
    try {
      const res = await fetch(`${API_BASE}/days/${date}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, priority }),
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalDay(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend error, falling back locally:', e);
    }

    const day = await this.getDay(date);
    const newGoal: GoalItem = {
      id: `goal_${Date.now()}`,
      text,
      priority,
      completed: false,
      created_at: new Date().toISOString(),
    };
    day.goals = [...(day.goals || []), newGoal];
    saveLocalDay(day);
    return day;
  },

  // Update Goal (toggle complete, edit text, etc.)
  async updateGoal(
    date: string,
    goalId: string,
    update: { completed?: boolean; text?: string; priority?: GoalPriority }
  ): Promise<DayRecord> {
    try {
      const res = await fetch(`${API_BASE}/days/${date}/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalDay(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend error, updating locally:', e);
    }

    const day = await this.getDay(date);
    day.goals = (day.goals || []).map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          ...update,
          completed_at: update.completed ? new Date().toISOString() : undefined,
        };
      }
      return g;
    });
    saveLocalDay(day);
    return day;
  },

  // Delete Goal
  async deleteGoal(date: string, goalId: string): Promise<DayRecord> {
    try {
      const res = await fetch(`${API_BASE}/days/${date}/goals/${goalId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalDay(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend error, deleting locally:', e);
    }

    const day = await this.getDay(date);
    day.goals = (day.goals || []).filter((g) => g.id !== goalId);
    saveLocalDay(day);
    return day;
  },

  // Upload Morning Photo (via File or base64 data)
  async uploadMorningPhoto(date: string, payload: { file?: File; base64?: string }): Promise<DayRecord> {
    try {
      if (payload.file) {
        const formData = new FormData();
        formData.append('photo', payload.file);
        const res = await fetch(`${API_BASE}/days/${date}/morning-photo`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          saveLocalDay(data);
          return data;
        }
      } else if (payload.base64) {
        const res = await fetch(`${API_BASE}/days/${date}/morning-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_base64: payload.base64 }),
        });
        if (res.ok) {
          const data = await res.json();
          saveLocalDay(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend upload error, storing locally:', e);
    }

    const day = await this.getDay(date);
    day.morning_photo_url = payload.base64 || '';
    day.morning_photo_time = new Date().toISOString();
    saveLocalDay(day);
    return day;
  },

  // Submit Evening Reflection & Checklist Review
  async submitEveningReview(
    date: string,
    reflection: string,
    mood: number,
    isDayClosed: boolean
  ): Promise<DayRecord> {
    try {
      const res = await fetch(`${API_BASE}/days/${date}/evening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evening_reflection: reflection,
          evening_mood: mood,
          is_day_closed: isDayClosed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalDay(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend error, saving reflection locally:', e);
    }

    const day = await this.getDay(date);
    day.evening_reflection = reflection;
    day.evening_mood = mood;
    day.is_day_closed = isDayClosed;
    saveLocalDay(day);
    return day;
  },

  // Get Small Wins (all or by date)
  async getWins(date?: string): Promise<WinRecord[]> {
    try {
      const url = date ? `${API_BASE}/wins?date=${date}` : `${API_BASE}/wins`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        saveLocalWins(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend error, getting wins locally:', e);
    }

    const localWins = getLocalWins();
    if (date) {
      return localWins.filter((w) => w.date === date);
    }
    return localWins;
  },

  // Create a Small Win (with text + optional photo)
  async createWin(params: {
    title: string;
    note: string;
    tag: string;
    date: string;
    file?: File;
    photo_base64?: string;
  }): Promise<WinRecord> {
    try {
      if (params.file) {
        const formData = new FormData();
        formData.append('title', params.title);
        formData.append('note', params.note);
        formData.append('tag', params.tag);
        formData.append('date', params.date);
        formData.append('photo', params.file);

        const res = await fetch(`${API_BASE}/wins`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          return await res.json();
        }
      } else {
        const res = await fetch(`${API_BASE}/wins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: params.title,
            note: params.note,
            tag: params.tag,
            date: params.date,
            photo_base64: params.photo_base64,
          }),
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch (e) {
      console.warn('Backend error, saving win locally:', e);
    }

    const win: WinRecord = {
      id: `win_${Date.now()}`,
      title: params.title,
      note: params.note,
      tag: params.tag,
      date: params.date,
      photo_url: params.photo_base64 || '',
      created_at: new Date().toISOString(),
    };

    const wins = getLocalWins();
    wins.unshift(win);
    saveLocalWins(wins);
    return win;
  },

  // Delete Win
  async deleteWin(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/wins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('Backend error, deleting win locally:', e);
    }

    const wins = getLocalWins().filter((w) => w.id !== id);
    saveLocalWins(wins);
    return true;
  },

  // Get Stats
  async getStats(): Promise<StatsResponse> {
    try {
      const res = await fetch(`${API_BASE}/stats`, { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend error, calculating stats locally:', e);
    }

    const days = getLocalDays();
    const wins = getLocalWins();

    let totalGoals = 0;
    let completedGoals = 0;
    const activeDates = new Set<string>();

    Object.values(days).forEach((d) => {
      if (d.morning_intention || (d.goals && d.goals.length > 0) || d.morning_photo_url) {
        activeDates.add(d.date);
      }
      d.goals?.forEach((g) => {
        totalGoals++;
        if (g.completed) completedGoals++;
      });
    });

    wins.forEach((w) => activeDates.add(w.date));

    return {
      streak: activeDates.size > 0 ? 1 : 0,
      total_wins: wins.length,
      total_goals: totalGoals,
      completed_goals: completedGoals,
      completion_rate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      total_days_count: activeDates.size,
    };
  },
};
