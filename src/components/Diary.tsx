import { useState } from 'react'
import type { DiaryEntry } from '../types'
import './Diary.css'

interface Props {
  entries: DiaryEntry[]
  onSave: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
}

export default function Diary({ entries, onSave, onDelete }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [content, setContent] = useState(() => {
    const existing = entries.find(e => e.date === today)
    return existing?.content || ''
  })
  const [isPreview, setIsPreview] = useState(false)

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    const existing = entries.find(e => e.date === date)
    setContent(existing?.content || '')
    setIsPreview(false)
  }

  const handleSave = () => {
    const existing = entries.find(e => e.date === selectedDate)
    onSave({
      id: existing?.id || crypto.randomUUID(),
      date: selectedDate,
      content,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  }

  // Simple markdown rendering
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br/>')
  }

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="diary">
      <div className="diary-layout">
        <div className="diary-sidebar">
          <h3>日记列表</h3>
          <button className="new-entry" onClick={() => handleDateChange(today)}>
            + 今日日记
          </button>
          {sortedEntries.map(e => (
            <div key={e.id} className={`diary-item ${e.date === selectedDate ? 'active' : ''}`}
              onClick={() => handleDateChange(e.date)}>
              <span className="diary-date">{e.date}</span>
              <span className="diary-preview">{e.content.slice(0, 30)}...</span>
            </div>
          ))}
        </div>

        <div className="diary-editor">
          <div className="editor-header">
            <input type="date" value={selectedDate} onChange={e => handleDateChange(e.target.value)} />
            <div className="editor-tabs">
              <button className={!isPreview ? 'active' : ''} onClick={() => setIsPreview(false)}>编辑</button>
              <button className={isPreview ? 'active' : ''} onClick={() => setIsPreview(true)}>预览</button>
            </div>
            <button className="save-btn" onClick={handleSave}>保存</button>
          </div>

          {isPreview ? (
            <div className="diary-preview-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="今天学了什么？遇到了什么问题？明天计划做什么？&#10;&#10;支持 Markdown 格式：# 标题、**加粗**、*斜体*、`代码`、- 列表"
            />
          )}
        </div>
      </div>
    </div>
  )
}
