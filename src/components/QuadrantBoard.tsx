import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, useDraggable, type DragEndEvent } from '@dnd-kit/core'
import type { Task, Quadrant } from '../types'
import './QuadrantBoard.css'

interface Props {
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
}

const QUADRANTS: { key: Quadrant; label: string; color: string }[] = [
  { key: 'urgent-important', label: '紧急且重要', color: 'var(--danger)' },
  { key: 'not-urgent-important', label: '重要不紧急', color: 'var(--accent-gold)' },
  { key: 'urgent-not-important', label: '紧急不重要', color: 'var(--accent-amber)' },
  { key: 'not-urgent-not-important', label: '不紧急不重要', color: 'var(--text-secondary)' },
]

function DroppableZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return <div ref={setNodeRef} className={`drop-zone ${isOver ? 'over' : ''}`}>拖拽到此处</div>
}

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="draggable-task">
      {task.text}
    </div>
  )
}

export default function QuadrantBoard({ tasks, onUpdate }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const unassigned = tasks.filter(t => !t.completed && !t.quadrant)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const quadrant = over.id as Quadrant
    if (QUADRANTS.some(q => q.key === quadrant)) {
      onUpdate(active.id as string, { quadrant })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="quadrant-board">
        <div className="quadrant-grid">
          {QUADRANTS.map(q => (
            <div key={q.key} className="quadrant-cell">
              <div className="quadrant-header" style={{ borderColor: q.color }}>
                <span className="quadrant-dot" style={{ background: q.color }} />
                {q.label}
              </div>
              <div className="quadrant-tasks">
                {tasks.filter(t => t.quadrant === q.key && !t.completed).map(t => (
                  <div key={t.id} className="quadrant-task">
                    <span>{t.text}</span>
                    <button className="remove-q" onClick={() => onUpdate(t.id, { quadrant: null })}>×</button>
                  </div>
                ))}
              </div>
              <DroppableZone id={q.key} />
            </div>
          ))}
        </div>

        {unassigned.length > 0 && (
          <div className="unassigned">
            <h4>未分配的任务</h4>
            <div className="unassigned-list">
              {unassigned.map(t => (
                <DraggableTask key={t.id} task={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DndContext>
  )
}
