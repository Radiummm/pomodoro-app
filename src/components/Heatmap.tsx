import type { Session } from '../types'
import './Heatmap.css'

interface Props {
  sessions: Session[]
}

export default function Heatmap({ sessions }: Props) {
  // Generate last 365 days
  const today = new Date()
  const days: { date: string; minutes: number }[] = []

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayStr = d.toDateString()
    const mins = sessions
      .filter(s => new Date(s.completedAt).toDateString() === dayStr)
      .reduce((sum, s) => sum + (s.type === 'pomodoro' ? 25 : s.duration), 0)
    days.push({ date: dateStr, minutes: mins })
  }

  const maxMinutes = Math.max(...days.map(d => d.minutes), 1)

  const getColor = (minutes: number) => {
    if (minutes === 0) return 'var(--bg-elevated)'
    const intensity = Math.min(1, minutes / maxMinutes)
    if (intensity < 0.25) return 'rgba(201, 162, 39, 0.2)'
    if (intensity < 0.5) return 'rgba(201, 162, 39, 0.4)'
    if (intensity < 0.75) return 'rgba(201, 162, 39, 0.65)'
    return 'rgba(201, 162, 39, 0.9)'
  }

  // Group by weeks (columns)
  const weeks: typeof days[] = []
  let week: typeof days = []
  const firstDay = new Date(today)
  firstDay.setDate(firstDay.getDate() - 364)
  const startPad = firstDay.getDay() // 0=Sun

  // Add padding for first week
  for (let i = 0; i < startPad; i++) week.push({ date: '', minutes: -1 })
  for (const day of days) {
    week.push(day)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) weeks.push(week)

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="heatmap">
      <h3>学习热力图</h3>
      <div className="heatmap-scroll">
        <div className="heatmap-grid">
          {weeks.map((w, wi) => (
            <div key={wi} className="heatmap-week">
              {w.map((d, di) => (
                <div key={di}
                  className={`heatmap-cell ${d.minutes < 0 ? 'empty' : ''}`}
                  style={{ background: d.minutes >= 0 ? getColor(d.minutes) : 'transparent' }}
                  title={d.date ? `${d.date}: ${d.minutes}分钟` : ''} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>少</span>
        {[0, 0.2, 0.4, 0.65, 0.9].map((o, i) => (
          <div key={i} className="heatmap-cell" style={{ background: i === 0 ? 'var(--bg-elevated)' : `rgba(201, 162, 39, ${o})` }} />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
