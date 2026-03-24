import { useState, useEffect, useRef, useCallback } from 'react'
import type { Task, TimerSettings, AmbientSound } from '../types'
import { DEFAULT_TEMPLATES } from '../types'
import { playAmbient, stopAmbient, setVolume } from '../audio/soundGenerator'
import './Timer.css'

interface Props {
  tasks: Task[]
  onComplete: (taskId: string | null, duration: number, type: 'pomodoro' | 'stopwatch') => void
  settings: TimerSettings
  onSettingsChange: (s: TimerSettings) => void
  ambientSound: AmbientSound
  onAmbientSoundChange: (s: AmbientSound) => void
  ambientVolume: number
  onAmbientVolumeChange: (v: number) => void
}

type TimerMode = 'work' | 'break' | 'longbreak' | 'stopwatch'

export default function Timer({ tasks, onComplete, settings, onSettingsChange, ambientSound, onAmbientSoundChange, ambientVolume, onAmbientVolumeChange }: Props) {
  const [mode, setMode] = useState<TimerMode>('work')
  const [time, setTime] = useState(settings.workMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTask, setSelectedTask] = useState('')
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [healthReminder, setHealthReminder] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  const selectedTaskRef = useRef(selectedTask)
  const modeRef = useRef(mode)
  const settingsRef = useRef(settings)

  onCompleteRef.current = onComplete
  selectedTaskRef.current = selectedTask
  modeRef.current = mode
  settingsRef.current = settings

  const totalTime = mode === 'work' ? settings.workMinutes * 60
    : mode === 'break' ? settings.breakMinutes * 60
    : mode === 'longbreak' ? settings.longBreakMinutes * 60 : 0

  const progress = mode === 'stopwatch' ? 0 : totalTime > 0 ? 1 - time / totalTime : 0

  const stopTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  // Pomodoro countdown
  useEffect(() => {
    if (!isRunning || mode === 'stopwatch') { stopTimer(); return }
    intervalRef.current = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          if (modeRef.current === 'work') {
            onCompleteRef.current(selectedTaskRef.current || null, settingsRef.current.workMinutes, 'pomodoro')
            setPomodoroCount(c => c + 1)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return stopTimer
  }, [isRunning, mode, stopTimer])

  // Stopwatch count up
  useEffect(() => {
    if (!isRunning || mode !== 'stopwatch') return
    intervalRef.current = setInterval(() => setStopwatchTime(t => t + 1), 1000)
    return stopTimer
  }, [isRunning, mode, stopTimer])

  // Auto-advance to break when timer hits 0
  useEffect(() => {
    if (time === 0 && !isRunning && (mode === 'work' || mode === 'break' || mode === 'longbreak')) {
      if (mode === 'work') {
        const isLongBreak = pomodoroCount > 0 && pomodoroCount % settings.longBreakInterval === 0
        const nextMode = isLongBreak ? 'longbreak' : 'break'
        setMode(nextMode)
        setTime(isLongBreak ? settings.longBreakMinutes * 60 : settings.breakMinutes * 60)
      } else {
        setMode('work')
        setTime(settings.workMinutes * 60)
      }
    }
  }, [time, isRunning, mode, pomodoroCount, settings])

  // Ambient sound control
  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      playAmbient(ambientSound, ambientVolume)
    } else {
      stopAmbient()
    }
    return () => { stopAmbient() }
  }, [isRunning, ambientSound])

  useEffect(() => { setVolume(ambientVolume) }, [ambientVolume])

  // Health reminders every 30 minutes while running
  useEffect(() => {
    if (!isRunning) {
      if (healthTimerRef.current) clearInterval(healthTimerRef.current)
      return
    }
    const reminders = ['💧 记得喝水', '👀 休息一下眼睛', '🧘 起来活动一下']
    let idx = 0
    healthTimerRef.current = setInterval(() => {
      setHealthReminder(reminders[idx % reminders.length])
      idx++
      setTimeout(() => setHealthReminder(''), 8000)
    }, 30 * 60 * 1000)
    return () => { if (healthTimerRef.current) clearInterval(healthTimerRef.current) }
  }, [isRunning])

  // Quick template start
  const startTemplate = (minutes: number) => {
    setMode('work')
    setTime(minutes * 60)
    setIsRunning(true)
  }

  const switchMode = (m: TimerMode) => {
    setIsRunning(false)
    setMode(m)
    if (m === 'work') setTime(settings.workMinutes * 60)
    else if (m === 'break') setTime(settings.breakMinutes * 60)
    else if (m === 'longbreak') setTime(settings.longBreakMinutes * 60)
    else setStopwatchTime(0)
  }

  const handleStopwatchStop = () => {
    setIsRunning(false)
    if (stopwatchTime > 0) {
      onComplete(selectedTask || null, Math.round(stopwatchTime / 60), 'stopwatch')
      setStopwatchTime(0)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const requestNotification = () => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  }

  // SVG Progress Ring
  const ringSize = 260
  const strokeWidth = 6
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="timer">
      <div className="timer-mode">
        {(['work', 'break', 'longbreak', 'stopwatch'] as TimerMode[]).map(m => (
          <button key={m} className={mode === m ? 'active' : ''} onClick={() => switchMode(m)}>
            {{ work: '工作', break: '休息', longbreak: '长休息', stopwatch: '秒表' }[m]}
          </button>
        ))}
        <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙</button>
      </div>

      {showSettings && (
        <div className="timer-settings">
          {[
            { label: '工作', key: 'workMinutes' as const, min: 1, max: 90 },
            { label: '休息', key: 'breakMinutes' as const, min: 1, max: 30 },
            { label: '长休息', key: 'longBreakMinutes' as const, min: 5, max: 60 },
            { label: '长休息间隔', key: 'longBreakInterval' as const, min: 2, max: 10 },
          ].map(({ label, key, min, max }) => (
            <label key={key}>
              {label}
              <input type="number" min={min} max={max} value={settings[key]}
                onChange={e => onSettingsChange({ ...settings, [key]: Number(e.target.value) || min })} />
              {key === 'longBreakInterval' ? '个番茄' : '分钟'}
            </label>
          ))}
        </div>
      )}

      <div className="timer-ring-wrapper">
        <svg width={ringSize} height={ringSize} className="progress-ring">
          <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
            stroke="var(--border-subtle)" strokeWidth={strokeWidth} />
          {mode !== 'stopwatch' && (
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
              stroke="var(--accent-gold)" strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          )}
        </svg>
        <div className="timer-display">
          {mode === 'stopwatch' ? formatTime(stopwatchTime) : formatTime(time)}
        </div>
      </div>

      {pomodoroCount > 0 && <div className="pomodoro-counter">{'🍅'.repeat(Math.min(pomodoroCount, 8))} {pomodoroCount}</div>}

      <select className="task-select" value={selectedTask} onChange={e => setSelectedTask(e.target.value)} disabled={isRunning}>
        <option value="">不关联任务</option>
        {tasks.filter(t => !t.completed).map(t => (
          <option key={t.id} value={t.id}>{t.text}</option>
        ))}
      </select>

      <div className="timer-controls">
        {mode === 'stopwatch' ? (
          <>
            <button onClick={() => { setIsRunning(!isRunning); requestNotification() }}>
              {isRunning ? '暂停' : stopwatchTime > 0 ? '继续' : '开始'}
            </button>
            <button onClick={handleStopwatchStop} disabled={stopwatchTime === 0}>停止并记录</button>
          </>
        ) : (
          <>
            <button onClick={() => { setIsRunning(!isRunning); requestNotification() }}>
              {isRunning ? '暂停' : '开始'}
            </button>
            <button onClick={() => switchMode(mode)}>重置</button>
          </>
        )}
      </div>

      {healthReminder && <div className="health-reminder">{healthReminder}</div>}

      <div className="quick-templates">
        <span className="templates-label">快捷：</span>
        {DEFAULT_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => startTemplate(t.minutes)} disabled={isRunning}>
            {t.icon} {t.name} {t.minutes}′
          </button>
        ))}
      </div>

      <div className="ambient-controls">
        <div className="ambient-buttons">
          {([['none', '静音'], ['whitenoise', '白噪音'], ['rain', '🌧 雨声'], ['cafe', '☕ 咖啡厅']] as [AmbientSound, string][]).map(([key, label]) => (
            <button key={key} className={ambientSound === key ? 'active' : ''} onClick={() => onAmbientSoundChange(key)}>
              {label}
            </button>
          ))}
        </div>
        {ambientSound !== 'none' && (
          <input type="range" min="0" max="1" step="0.05" value={ambientVolume}
            onChange={e => onAmbientVolumeChange(Number(e.target.value))} className="volume-slider" />
        )}
      </div>
    </div>
  )
}
