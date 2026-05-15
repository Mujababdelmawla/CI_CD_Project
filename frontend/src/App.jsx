import { useState, useEffect } from 'react'

const API = 'http://localhost:5000'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // fetch all tasks on load
  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const res = await fetch(`${API}/tasks`)
      const data = await res.json()
      setTasks(data)
    } catch {
      setError('Could not connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  async function addTask() {
    const title = input.trim()
    if (!title) {
      setError('Task title cannot be empty.')
      return
    }
    setError('')
    try {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const newTask = await res.json()
      setTasks(prev => [...prev, newTask])
      setInput('')
    } catch {
      setError('Failed to add task.')
    }
  }

  async function deleteTask(id) {
    try {
      await fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      setError('Failed to delete task.')
    }
  }

  async function toggleDone(id) {
    try {
      const res = await fetch(`${API}/tasks/${id}/done`, { method: 'PATCH' })
      const updated = await res.json()
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)))
    } catch {
      setError('Failed to update task.')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addTask()
  }

  const done = tasks.filter(t => t.done).length
  const total = tasks.length

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Task Manager</h1>
          <p style={styles.subtitle}>CI/CD Showcase Project</p>
          {total > 0 && (
            <p style={styles.counter}>{done} / {total} done</p>
          )}
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            type="text"
            placeholder="Add a new task..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button style={styles.addBtn} onClick={addTask}>Add</button>
        </div>

        {/* Error */}
        {error && <p style={styles.error}>{error}</p>}

        {/* Task list */}
        {loading ? (
          <p style={styles.empty}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={styles.empty}>No tasks yet. Add one above!</p>
        ) : (
          <ul style={styles.list}>
            {tasks.map(task => (
              <li key={task.id} style={styles.item}>
                <button
                  style={{
                    ...styles.doneBtn,
                    background: task.done ? '#22c55e' : 'transparent',
                    borderColor: task.done ? '#22c55e' : '#d1d5db',
                  }}
                  onClick={() => toggleDone(task.id)}
                  title={task.done ? 'Mark undone' : 'Mark done'}
                >
                  {task.done ? '✓' : ''}
                </button>
                <span style={{
                  ...styles.taskTitle,
                  textDecoration: task.done ? 'line-through' : 'none',
                  color: task.done ? '#9ca3af' : '#111827',
                }}>
                  {task.title}
                </span>
                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteTask(task.id)}
                  title="Delete task"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <p style={styles.footer}>
          Flask API + React + GitHub Actions + Jenkins + Blue/Green
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 8px',
  },
  counter: {
    fontSize: '13px',
    color: '#3b82f6',
    margin: '0',
    fontWeight: '600',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  addBtn: {
    padding: '10px 20px',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    margin: '0 0 12px',
  },
  list: {
    listStyle: 'none',
    padding: '0',
    margin: '0 0 24px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  doneBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1.5px solid #d1d5db',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskTitle: {
    flex: 1,
    fontSize: '14px',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  empty: {
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'center',
    padding: '32px 0',
  },
  footer: {
    fontSize: '11px',
    color: '#d1d5db',
    textAlign: 'center',
    margin: '0',
  },
}