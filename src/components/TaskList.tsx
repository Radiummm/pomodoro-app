import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, Category } from '../types'
import './TaskList.css'

interface Props {
  tasks: Task[]
  categories: Category[]
  onAdd: (text: string, opts?: { estimatedPomodoros?: number; deadline?: number | null; categoryId?: string | null }) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onReorder: (tasks: Task[]) => void
  onCategoriesChange: (cats: Category[]) => void
}

function SortableTask({ task, categories, onToggle, onDelete }: {
  task: Task; categories: Category[]; onToggle: (id: string) => void; onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const getDaysLeft = (dl: number) => Math.ceil((dl - Date.now()) / 86400000)
  const catColor = task.categoryId ? categories.find(c => c.id === task.categoryId)?.color : undefined

  return (
    <li ref={setNodeRef} style={style} className={task.completed ? 'completed' : ''}>
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
      {catColor && <span className="cat-dot" style={{ background: catColor }} />}
      <span className="text">{task.text}</span>
      {task.estimatedPomodoros > 0 ? (
        <span className="pomodoros">🍅 {task.pomodoros}/{task.estimatedPomodoros}</span>
      ) : task.pomodoros > 0 ? (
        <span className="pomodoros">🍅 {task.pomodoros}</span>
      ) : null}
      {task.deadline && (
        <span className={`deadline-badge ${getDaysLeft(task.deadline) < 0 ? 'overdue' : getDaysLeft(task.deadline) <= 3 ? 'urgent' : ''}`}>
          {getDaysLeft(task.deadline) < 0 ? '已过期' : `${getDaysLeft(task.deadline)}天`}
        </span>
      )}
      <button className="delete" onClick={() => onDelete(task.id)}>×</button>
    </li>
  )
}

export default function TaskList({ tasks, categories, onAdd, onToggle, onDelete, onUpdate, onReorder }: Props) {
  const [input, setInput] = useState('')
  const [estimated, setEstimated] = useState(0)
  const [deadline, setDeadline] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input.trim(), {
      estimatedPomodoros: estimated,
      deadline: deadline ? new Date(deadline).getTime() : null,
      categoryId: categoryId || null,
    })
    setInput(''); setEstimated(0); setDeadline('')
  }

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = tasks.findIndex(t => t.id === active.id)
    const newIdx = tasks.findIndex(t => t.id === over.id)
    onReorder(arrayMove(tasks, oldIdx, newIdx))
  }

  return (
    <div className="task-list">
      <div className="input-area">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="添加新任务..." />
        <input type="number" min="0" max="20" value={estimated || ''} onChange={e => setEstimated(Number(e.target.value))}
          placeholder="🍅" className="est-input" title="预估番茄数" />
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
          className="deadline-input" title="截止日期" />
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="cat-select">
          <option value="">无分类</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={handleAdd}>添加</button>
      </div>

      <div className="task-filters">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {{ all: '全部', active: '进行中', completed: '已完成' }[f]}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <ul>
            {filtered.map(task => (
              <SortableTask key={task.id} task={task} categories={categories} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}
