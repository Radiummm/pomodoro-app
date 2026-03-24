import type { Task, Session, Category, DailyGoal } from '../types'
import './Stats.css'

interface Props {
  tasks: Task[]
  sessions: Session[]
  categories: Category[]
  dailyGoal: DailyGoal
}

export default function Stats({ tasks, sessions, categories, dailyGoal }: Props) {
  const today = new Date().toDateString()
  const todaySessions = sessions.filter(s => new Date(s.completedAt).toDateString() === today)
  const todayPomodoros = todaySessions.filter(s => s.type === 'pomodoro')
  const todayStopwatch = todaySessions.filter(s => s.type === 'stopwatch')
  const todayMinutes = todayPomodoros.length * 25 + todayStopwatch.reduce((sum, s) => sum + s.duration, 0)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toDateString()
  }).reverse()

  const dailyData = last7Days.map(date => {
    const daySessions = sessions.filter(s => new Date(s.completedAt).toDateString() === date)
    const pomo = daySessions.filter(s => s.type === 'pomodoro').length * 25
    const sw = daySessions.filter(s => s.type === 'stopwatch').reduce((sum, s) => sum + s.duration, 0)
    return {
      date: new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      pomodoro: pomo,
      stopwatch: sw,
      total: pomo + sw,
    }
  })

  const maxMinutes = Math.max(...dailyData.map(d => d.total), 1)

  // Category time distribution
  const categoryTime = categories.map(cat => {
    const catTasks = tasks.filter(t => t.categoryId === cat.id)
    const taskIds = new Set(catTasks.map(t => t.id))
    const mins = sessions
      .filter(s => s.taskId && taskIds.has(s.taskId))
      .reduce((sum, s) => sum + (s.type === 'pomodoro' ? 25 : s.duration), 0)
    return { ...cat, minutes: mins }
  }).filter(c => c.minutes > 0)

  return (
    <div className="stats">
      <div className="stats-cards">
        <div className="card">
          <div className="value">{todayPomodoros.length}</div>
          <div className="label">今日番茄</div>
        </div>
        <div className="card">
          <div className="value">{todayMinutes}</div>
          <div className="label">今日分钟</div>
        </div>
        <div className="card">
          <div className="value">{sessions.length}</div>
          <div className="label">总计次数</div>
        </div>
        <div className="card">
          <div className="value">{tasks.filter(t => t.completed).length}</div>
          <div className="label">已完成</div>
        </div>
      </div>

      {dailyGoal.targetMinutes > 0 && (
        <div className="goal-progress">
          <div className="goal-bar">
            <div className="goal-fill" style={{ width: `${Math.min(100, (todayMinutes / dailyGoal.targetMinutes) * 100)}%` }} />
          </div>
          <span className="goal-text">{todayMinutes}/{dailyGoal.targetMinutes} 分钟</span>
          {dailyGoal.streakDays > 0 && <span className="streak">🔥 {dailyGoal.streakDays}天</span>}
        </div>
      )}

      <div className="chart">
        <h3>最近7天（分钟）</h3>
        <div className="bars">
          {dailyData.map((d, i) => (
            <div key={i} className="bar-wrapper">
              <div className="bar-stack" style={{ height: `${(d.total / maxMinutes) * 100}%` }}>
                {d.stopwatch > 0 && (
                  <div className="bar-segment sw" style={{ flex: d.stopwatch }} title={`秒表 ${d.stopwatch}分`} />
                )}
                {d.pomodoro > 0 && (
                  <div className="bar-segment pomo" style={{ flex: d.pomodoro }} title={`番茄 ${d.pomodoro}分`} />
                )}
              </div>
              <div className="bar-total">{d.total > 0 ? d.total : ''}</div>
              <div className="date">{d.date}</div>
            </div>
          ))}
        </div>
      </div>

      {categoryTime.length > 0 && (
        <div className="category-stats">
          <h3>学科分布</h3>
          {categoryTime.map(c => (
            <div key={c.id} className="cat-row">
              <span className="cat-dot" style={{ background: c.color }} />
              <span className="cat-name">{c.name}</span>
              <div className="cat-bar-bg">
                <div className="cat-bar-fill" style={{ width: `${(c.minutes / Math.max(...categoryTime.map(x => x.minutes))) * 100}%`, background: c.color }} />
              </div>
              <span className="cat-mins">{c.minutes}分</span>
            </div>
          ))}
        </div>
      )}

      <div className="task-stats">
        <h3>任务统计</h3>
        {tasks.filter(t => t.pomodoros > 0).map(task => (
          <div key={task.id} className="task-stat">
            <span className="name">{task.text}</span>
            <span className="count">🍅 {task.pomodoros}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
