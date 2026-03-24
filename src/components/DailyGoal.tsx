import type { DailyGoal, Session } from '../types'
import './DailyGoal.css'

interface Props {
  goal: DailyGoal
  sessions: Session[]
  onGoalChange: (goal: DailyGoal) => void
}

export default function DailyGoalPanel({ goal, sessions, onGoalChange }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => new Date(s.completedAt).toISOString().slice(0, 10) === today)
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.type === 'pomodoro' ? 25 : s.duration), 0)
  const progress = goal.targetMinutes > 0 ? Math.min(1, todayMinutes / goal.targetMinutes) : 0
  const achieved = progress >= 1

  // Check-in logic
  const checkin = () => {
    if (achieved && goal.lastCheckinDate !== today) {
      const isConsecutive = isYesterday(goal.lastCheckinDate)
      onGoalChange({
        ...goal,
        streakDays: isConsecutive ? goal.streakDays + 1 : 1,
        lastCheckinDate: today,
      })
    }
  }

  const isYesterday = (dateStr: string) => {
    if (!dateStr) return false
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return dateStr === yesterday.toISOString().slice(0, 10)
  }

  return (
    <div className="daily-goal">
      <div className="goal-header">
        <h3>每日目标</h3>
        <div className="goal-setting">
          <input type="number" min="10" max="600" step="10" value={goal.targetMinutes}
            onChange={e => onGoalChange({ ...goal, targetMinutes: Number(e.target.value) || 60 })} />
          <span>分钟/天</span>
        </div>
      </div>

      <div className="goal-ring-wrapper">
        <svg width="160" height="160" className="goal-ring">
          <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
          <circle cx="80" cy="80" r="70" fill="none"
            stroke={achieved ? 'var(--accent-gold)' : 'var(--accent-gold-dim)'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={2 * Math.PI * 70 * (1 - progress)}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div className="goal-center">
          <div className="goal-minutes">{todayMinutes}</div>
          <div className="goal-target">/ {goal.targetMinutes} 分</div>
        </div>
      </div>

      {achieved && goal.lastCheckinDate !== today && (
        <button className="checkin-btn" onClick={checkin}>打卡</button>
      )}

      {goal.lastCheckinDate === today && (
        <div className="checked-in">已打卡</div>
      )}

      <div className="streak-display">
        {goal.streakDays > 0 && (
          <span className="streak-fire">🔥 连续 {goal.streakDays} 天</span>
        )}
      </div>
    </div>
  )
}
