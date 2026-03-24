import type { Task, Session, DailyGoal } from '../types'
import './Dashboard.css'

interface Props {
  tasks: Task[]
  sessions: Session[]
  dailyGoal: DailyGoal
  onNavigate: (view: string) => void
}

export default function Dashboard({ tasks, sessions, dailyGoal, onNavigate }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => new Date(s.completedAt).toISOString().slice(0, 10) === today)
  const todayPomodoros = todaySessions.filter(s => s.type === 'pomodoro').length
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.type === 'pomodoro' ? 25 : s.duration), 0)
  const progress = dailyGoal.targetMinutes > 0 ? Math.min(1, todayMinutes / dailyGoal.targetMinutes) : 0
  const activeTasks = tasks.filter(t => !t.completed)
  const urgentTasks = activeTasks.filter(t => t.deadline && Math.ceil((t.deadline - Date.now()) / 86400000) <= 3)

  // Motivational quotes
  const quotes = [
    '学如逆水行舟，不进则退',
    '千里之行，始于足下',
    '书山有路勤为径',
    '今日事，今日毕',
    '积少成多，聚沙成塔',
    '不积跬步，无以至千里',
  ]
  const quote = quotes[new Date().getDate() % quotes.length]

  return (
    <div className="dashboard">
      <div className="dash-quote">{quote}</div>

      <div className="dash-progress">
        <div className="dash-ring-wrapper">
          <svg width="120" height="120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent-gold)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - progress)}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div className="dash-ring-text">
            <div className="dash-pct">{Math.round(progress * 100)}%</div>
            <div className="dash-label">今日目标</div>
          </div>
        </div>
        <div className="dash-stats-row">
          <div className="dash-stat">
            <span className="dash-num">{todayPomodoros}</span>
            <span className="dash-desc">番茄</span>
          </div>
          <div className="dash-stat">
            <span className="dash-num">{todayMinutes}</span>
            <span className="dash-desc">分钟</span>
          </div>
          <div className="dash-stat">
            <span className="dash-num">{activeTasks.length}</span>
            <span className="dash-desc">待办</span>
          </div>
          {dailyGoal.streakDays > 0 && (
            <div className="dash-stat">
              <span className="dash-num">🔥{dailyGoal.streakDays}</span>
              <span className="dash-desc">连续</span>
            </div>
          )}
        </div>
      </div>

      {urgentTasks.length > 0 && (
        <div className="dash-section">
          <h3>临近截止</h3>
          {urgentTasks.map(t => {
            const days = Math.ceil((t.deadline! - Date.now()) / 86400000)
            return (
              <div key={t.id} className="dash-urgent-item">
                <span>{t.text}</span>
                <span className={`dash-days ${days < 0 ? 'overdue' : ''}`}>
                  {days < 0 ? '已过期' : `${days}天`}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="dash-actions">
        <button onClick={() => onNavigate('timer')}>开始专注</button>
        <button onClick={() => onNavigate('tasks')}>管理任务</button>
        <button onClick={() => onNavigate('diary')}>写日记</button>
      </div>
    </div>
  )
}
