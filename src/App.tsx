import { useState, useEffect } from 'react'
import Timer from './components/Timer'
import TaskList from './components/TaskList'
import QuadrantBoard from './components/QuadrantBoard'
import Diary from './components/Diary'
import DailyGoalPanel from './components/DailyGoal'
import Dashboard from './components/Dashboard'
import Heatmap from './components/Heatmap'
import WeeklyReport from './components/WeeklyReport'
import Achievements from './components/Achievements'
import Stats from './components/Stats'
import type { Task, Session, Category, DiaryEntry, DailyGoal, ViewType, TimerSettings, AmbientSound } from './types'
import { migrateTask, migrateSession, DEFAULT_TIMER_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_DAILY_GOAL } from './types'
import './App.css'

function load<T>(key: string, fallback: T, migrate?: (item: any) => any): T {
  const saved = localStorage.getItem(key)
  if (!saved) return fallback
  const parsed = JSON.parse(saved)
  return migrate ? (Array.isArray(parsed) ? parsed.map(migrate) : migrate(parsed)) : parsed
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => load('tasks', [], migrateTask))
  const [sessions, setSessions] = useState<Session[]>(() => load('sessions', [], migrateSession))
  const [categories, setCategories] = useState<Category[]>(() => load('categories', DEFAULT_CATEGORIES))
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() => load('diary', []))
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(() => load('dailyGoal', DEFAULT_DAILY_GOAL))
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(() => load('timerSettings', DEFAULT_TIMER_SETTINGS))
  const [view, setView] = useState<ViewType>('dashboard')
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')
  const [ambientSound, setAmbientSound] = useState<AmbientSound>(() => (localStorage.getItem('ambientSound') as AmbientSound) || 'none')
  const [ambientVolume, setAmbientVolume] = useState(() => Number(localStorage.getItem('ambientVolume')) || 0.5)

  // Persist all state
  useEffect(() => { localStorage.setItem('tasks', JSON.stringify(tasks)) }, [tasks])
  useEffect(() => { localStorage.setItem('sessions', JSON.stringify(sessions)) }, [sessions])
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)) }, [categories])
  useEffect(() => { localStorage.setItem('diary', JSON.stringify(diaryEntries)) }, [diaryEntries])
  useEffect(() => { localStorage.setItem('dailyGoal', JSON.stringify(dailyGoal)) }, [dailyGoal])
  useEffect(() => { localStorage.setItem('timerSettings', JSON.stringify(timerSettings)) }, [timerSettings])
  useEffect(() => { localStorage.setItem('ambientSound', ambientSound) }, [ambientSound])
  useEffect(() => { localStorage.setItem('ambientVolume', String(ambientVolume)) }, [ambientVolume])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // === Task handlers ===
  const addTask = (text: string, opts?: { estimatedPomodoros?: number; deadline?: number | null; categoryId?: string | null }) => {
    setTasks(prev => [migrateTask({
      id: crypto.randomUUID(),
      text,
      order: prev.length,
      estimatedPomodoros: opts?.estimatedPomodoros ?? 0,
      deadline: opts?.deadline ?? null,
      categoryId: opts?.categoryId ?? null,
    }), ...prev])
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const toggleTask = (id: string) => updateTask(id, { completed: !tasks.find(t => t.id === id)?.completed })
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id))
  const reorderTasks = (reordered: Task[]) => setTasks(reordered)

  // === Session handlers ===
  const completeSession = (taskId: string | null, duration: number, type: 'pomodoro' | 'stopwatch' = 'pomodoro') => {
    setSessions(prev => [...prev, { id: crypto.randomUUID(), taskId, duration, completedAt: Date.now(), type }])
    if (taskId && type === 'pomodoro') {
      updateTask(taskId, { pomodoros: (tasks.find(t => t.id === taskId)?.pomodoros ?? 0) + 1 })
    }
  }

  // === Diary handlers ===
  const saveDiary = (entry: DiaryEntry) => {
    setDiaryEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id)
      if (idx >= 0) return prev.map((e, i) => i === idx ? entry : e)
      return [...prev, entry]
    })
  }
  const deleteDiary = (id: string) => setDiaryEntries(prev => prev.filter(e => e.id !== id))

  // === Nav config ===
  const navItems: { key: ViewType; label: string }[] = [
    { key: 'dashboard', label: '首页' },
    { key: 'timer', label: '计时' },
    { key: 'tasks', label: '任务' },
    { key: 'quadrant', label: '四象限' },
    { key: 'diary', label: '日记' },
    { key: 'stats', label: '统计' },
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>番茄学习</h1>
        <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
          {isDark ? '☀' : '☾'}
        </button>
      </header>

      <nav className="nav">
        {navItems.map(item => (
          <button key={item.key} className={view === item.key ? 'active' : ''} onClick={() => setView(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {view === 'dashboard' && (
          <Dashboard tasks={tasks} sessions={sessions} dailyGoal={dailyGoal} onNavigate={(v) => setView(v as ViewType)} />
        )}
        {view === 'timer' && (
          <Timer
            tasks={tasks}
            onComplete={completeSession}
            settings={timerSettings}
            onSettingsChange={setTimerSettings}
            ambientSound={ambientSound}
            onAmbientSoundChange={setAmbientSound}
            ambientVolume={ambientVolume}
            onAmbientVolumeChange={setAmbientVolume}
          />
        )}
        {view === 'tasks' && (
          <TaskList
            tasks={tasks}
            categories={categories}
            onAdd={addTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            onReorder={reorderTasks}
            onCategoriesChange={setCategories}
          />
        )}
        {view === 'quadrant' && (
          <QuadrantBoard tasks={tasks} onUpdate={updateTask} />
        )}
        {view === 'diary' && (
          <>
            <DailyGoalPanel goal={dailyGoal} sessions={sessions} onGoalChange={setDailyGoal} />
            <Diary entries={diaryEntries} onSave={saveDiary} onDelete={deleteDiary} />
          </>
        )}
        {view === 'stats' && (
          <>
            <Stats tasks={tasks} sessions={sessions} categories={categories} dailyGoal={dailyGoal} />
            <Heatmap sessions={sessions} />
            <WeeklyReport sessions={sessions} tasks={tasks} categories={categories} />
            <Achievements sessions={sessions} tasks={tasks} dailyGoal={dailyGoal} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
