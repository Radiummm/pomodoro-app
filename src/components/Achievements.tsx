import type { Session, Task, DailyGoal } from '../types'
import './Achievements.css'

interface Props {
  sessions: Session[]
  tasks: Task[]
  dailyGoal: DailyGoal
}

interface Badge {
  id: string
  icon: string
  name: string
  description: string
  check: () => boolean
}

export default function Achievements({ sessions, tasks, dailyGoal }: Props) {
  const totalPomodoros = sessions.filter(s => s.type === 'pomodoro').length
  const completedTasks = tasks.filter(t => t.completed).length
  const totalMinutes = sessions.reduce((s, x) => s + (x.type === 'pomodoro' ? 25 : x.duration), 0)

  const badges: Badge[] = [
    { id: 'first', icon: '🌱', name: '初次专注', description: '完成第1个番茄钟', check: () => totalPomodoros >= 1 },
    { id: 'ten', icon: '🍅', name: '番茄达人', description: '完成10个番茄钟', check: () => totalPomodoros >= 10 },
    { id: 'fifty', icon: '🔥', name: '专注大师', description: '完成50个番茄钟', check: () => totalPomodoros >= 50 },
    { id: 'hundred', icon: '💎', name: '钻石学者', description: '完成100个番茄钟', check: () => totalPomodoros >= 100 },
    { id: 'task5', icon: '✅', name: '任务新手', description: '完成5个任务', check: () => completedTasks >= 5 },
    { id: 'task20', icon: '🏆', name: '效率达人', description: '完成20个任务', check: () => completedTasks >= 20 },
    { id: 'streak3', icon: '📅', name: '三日坚持', description: '连续打卡3天', check: () => dailyGoal.streakDays >= 3 },
    { id: 'streak7', icon: '⭐', name: '一周之星', description: '连续打卡7天', check: () => dailyGoal.streakDays >= 7 },
    { id: 'streak30', icon: '👑', name: '月度王者', description: '连续打卡30天', check: () => dailyGoal.streakDays >= 30 },
    { id: 'hours10', icon: '⏰', name: '十小时', description: '累计学习10小时', check: () => totalMinutes >= 600 },
    { id: 'hours50', icon: '🎯', name: '五十小时', description: '累计学习50小时', check: () => totalMinutes >= 3000 },
    { id: 'hours100', icon: '🌟', name: '百小时传奇', description: '累计学习100小时', check: () => totalMinutes >= 6000 },
  ]

  const unlocked = badges.filter(b => b.check())
  const locked = badges.filter(b => !b.check())

  return (
    <div className="achievements">
      <h3>成就徽章 ({unlocked.length}/{badges.length})</h3>
      <div className="badge-grid">
        {unlocked.map(b => (
          <div key={b.id} className="badge unlocked">
            <span className="badge-icon">{b.icon}</span>
            <span className="badge-name">{b.name}</span>
            <span className="badge-desc">{b.description}</span>
          </div>
        ))}
        {locked.map(b => (
          <div key={b.id} className="badge locked">
            <span className="badge-icon">🔒</span>
            <span className="badge-name">{b.name}</span>
            <span className="badge-desc">{b.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
