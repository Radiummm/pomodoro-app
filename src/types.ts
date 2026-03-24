// === 基础类型 ===

export interface Category {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  text: string
  completed: boolean
  pomodoros: number
  createdAt: number
  estimatedPomodoros: number
  order: number
  deadline: number | null
  categoryId: string | null
  quadrant: Quadrant | null
}

export type Quadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important'

export interface Session {
  id: string
  taskId: string | null
  duration: number
  completedAt: number
  type: 'pomodoro' | 'stopwatch'
}

export interface DiaryEntry {
  id: string
  date: string        // YYYY-MM-DD
  content: string     // Markdown
  createdAt: number
  updatedAt: number
}

export interface DailyGoal {
  targetMinutes: number
  streakDays: number
  lastCheckinDate: string  // YYYY-MM-DD
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: AchievementStats) => boolean
  unlockedAt?: number
}

export interface AchievementStats {
  totalPomodoros: number
  totalMinutes: number
  streakDays: number
  completedTasks: number
  totalDiaryEntries: number
}

export interface TimerSettings {
  workMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number  // 每N个番茄后长休息
}

export interface TimerTemplate {
  id: string
  name: string
  minutes: number
  icon: string
}

export type AmbientSound = 'none' | 'whitenoise' | 'rain' | 'cafe'

export type ViewType = 'dashboard' | 'timer' | 'tasks' | 'quadrant' | 'diary' | 'stats'

// === 默认值 ===

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
}

export const DEFAULT_TEMPLATES: TimerTemplate[] = [
  { id: '1', name: '阅读', minutes: 30, icon: '📖' },
  { id: '2', name: '刷题', minutes: 45, icon: '✏️' },
  { id: '3', name: '复习', minutes: 20, icon: '🔄' },
  { id: '4', name: '写作', minutes: 60, icon: '📝' },
]

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'math', name: '数学', color: '#c9a227' },
  { id: 'english', name: '英语', color: '#4a9eff' },
  { id: 'science', name: '理综', color: '#50c878' },
  { id: 'chinese', name: '语文', color: '#ff6b6b' },
]

export const DEFAULT_DAILY_GOAL: DailyGoal = {
  targetMinutes: 120,
  streakDays: 0,
  lastCheckinDate: '',
}

// === 数据迁移 ===

export function migrateTask(t: Partial<Task> & { id: string; text: string }): Task {
  return {
    completed: false,
    pomodoros: 0,
    createdAt: Date.now(),
    estimatedPomodoros: 0,
    order: 0,
    deadline: null,
    categoryId: null,
    quadrant: null,
    ...t,
  }
}

export function migrateSession(s: Partial<Session> & { id: string }): Session {
  return {
    taskId: null,
    duration: 25,
    completedAt: Date.now(),
    type: 'pomodoro',
    ...s,
  }
}
