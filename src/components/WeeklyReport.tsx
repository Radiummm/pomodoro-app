import type { Session, Task, Category } from '../types'
import './WeeklyReport.css'

interface Props {
  sessions: Session[]
  tasks: Task[]
  categories: Category[]
}

export default function WeeklyReport({ sessions, tasks, categories }: Props) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekSessions = sessions.filter(s => s.completedAt >= weekStart.getTime())
  const weekPomodoros = weekSessions.filter(s => s.type === 'pomodoro').length
  const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.type === 'pomodoro' ? 25 : s.duration), 0)
  const weekHours = (weekMinutes / 60).toFixed(1)

  // Best day
  const dayMinutes: Record<string, number> = {}
  weekSessions.forEach(s => {
    const day = new Date(s.completedAt).toLocaleDateString('zh-CN', { weekday: 'short' })
    dayMinutes[day] = (dayMinutes[day] || 0) + (s.type === 'pomodoro' ? 25 : s.duration)
  })
  const bestDay = Object.entries(dayMinutes).sort((a, b) => b[1] - a[1])[0]

  // Category breakdown
  const catBreakdown = categories.map(cat => {
    const catTaskIds = new Set(tasks.filter(t => t.categoryId === cat.id).map(t => t.id))
    const mins = weekSessions
      .filter(s => s.taskId && catTaskIds.has(s.taskId))
      .reduce((sum, s) => sum + (s.type === 'pomodoro' ? 25 : s.duration), 0)
    return { ...cat, minutes: mins }
  }).filter(c => c.minutes > 0)

  const totalCatMins = catBreakdown.reduce((s, c) => s + c.minutes, 0) || 1

  // Last week comparison
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekMins = sessions
    .filter(s => s.completedAt >= lastWeekStart.getTime() && s.completedAt < weekStart.getTime())
    .reduce((sum, s) => sum + (s.type === 'pomodoro' ? 25 : s.duration), 0)
  const diff = weekMinutes - lastWeekMins

  return (
    <div className="weekly-report">
      <h3>本周学习报告</h3>

      <div className="report-summary">
        <div className="report-stat">
          <span className="report-num">{weekHours}</span>
          <span className="report-label">小时</span>
        </div>
        <div className="report-stat">
          <span className="report-num">{weekPomodoros}</span>
          <span className="report-label">番茄</span>
        </div>
        <div className="report-stat">
          <span className={`report-num ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}`}>
            {diff > 0 ? `+${diff}` : diff}
          </span>
          <span className="report-label">vs上周(分)</span>
        </div>
      </div>

      {bestDay && (
        <div className="report-best">
          最专注的一天：{bestDay[0]}（{bestDay[1]}分钟）
        </div>
      )}

      {catBreakdown.length > 0 && (
        <div className="report-pie">
          <h4>学科分布</h4>
          <div className="pie-bars">
            {catBreakdown.map(c => (
              <div key={c.id} className="pie-row">
                <span className="pie-dot" style={{ background: c.color }} />
                <span className="pie-name">{c.name}</span>
                <div className="pie-bar-bg">
                  <div className="pie-bar-fill" style={{ width: `${(c.minutes / totalCatMins) * 100}%`, background: c.color }} />
                </div>
                <span className="pie-pct">{Math.round((c.minutes / totalCatMins) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
