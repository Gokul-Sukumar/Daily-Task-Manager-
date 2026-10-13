import { useEffect, useMemo, useState } from 'react';
import { Check, Circle, ClipboardList, Plus, Search, Trash2, Pencil, X, CalendarDays, ListTodo } from 'lucide-react';

const STORAGE_KEY = 'daily-task-manager-tasks-v1';

function readTasks() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [tasks, setTasks] = useState(readTasks);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' && !task.completed) ||
        (filter === 'completed' && task.completed);
      return matchesFilter && task.text.toLowerCase().includes(query);
    });
  }, [tasks, filter, search]);

  function addTask(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setTasks((current) => [
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text: value, completed: false, createdAt: new Date().toISOString() },
      ...current,
    ]);
    setText('');
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function beginEdit(task) {
    setEditingId(task.id);
    setEditText(task.text);
  }

  function saveEdit(id) {
    const value = editText.trim();
    if (!value) return;
    setTasks((current) => current.map((task) => task.id === id ? { ...task, text: value } : task));
    setEditingId(null);
    setEditText('');
  }

  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <main className="page-shell">
      <div className="app-wrap">
        <header className="topbar">
          <div className="brand-mark"><ListTodo size={23} strokeWidth={2.4} /></div>
          <div className="brand-copy">
            <span className="eyebrow">YOUR PERSONAL SPACE</span>
            <h1>Daily Task Manager</h1>
          </div>
          <div className="today-chip"><CalendarDays size={16} /> <span>{today}</span></div>
        </header>

        <section className="welcome">
          <div>
            <p className="welcome-kicker">MAKE TODAY COUNT</p>
            <h2>A little progress<br className="mobile-break" /> goes a long way.</h2>
            <p className="welcome-subtitle">Organize your day, one task at a time.</p>
          </div>
          <div className="progress-card">
            <div className="progress-top"><span>Daily progress</span><strong>{progress}%</strong></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <p>{completedCount} of {tasks.length} tasks completed</p>
          </div>
        </section>

        <section className="stats-grid" aria-label="Task summary">
          <div className="stat-card"><span className="stat-icon total"><ClipboardList size={19} /></span><div><span className="stat-label">Total tasks</span><strong>{tasks.length}</strong></div></div>
          <div className="stat-card"><span className="stat-icon pending"><Circle size={19} /></span><div><span className="stat-label">Pending</span><strong>{pendingCount}</strong></div></div>
          <div className="stat-card"><span className="stat-icon done"><Check size={20} /></span><div><span className="stat-label">Completed</span><strong>{completedCount}</strong></div></div>
        </section>

        <section className="tasks-panel">
          <div className="panel-heading">
            <div><h2>Your tasks</h2><p>Keep your priorities moving forward.</p></div>
            <span className="task-count">{visibleTasks.length} shown</span>
          </div>

          <form className="add-form" onSubmit={addTask}>
            <Plus size={20} className="input-plus" />
            <input aria-label="New task" value={text} onChange={(event) => setText(event.target.value)} placeholder="What do you need to get done?" maxLength={180} />
            <button type="submit" disabled={!text.trim()}><Plus size={17} /> Add task</button>
          </form>

          <div className="toolbar">
            <div className="filter-tabs" role="group" aria-label="Filter tasks">
              {[
                ['all', 'All tasks'],
                ['pending', 'Pending'],
                ['completed', 'Completed'],
              ].map(([key, label]) => (
                <button key={key} type="button" className={filter === key ? 'filter-tab active' : 'filter-tab'} onClick={() => setFilter(key)}>{label}</button>
              ))}
            </div>
            <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" /></label>
          </div>

          <div className="task-list">
            {visibleTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ClipboardList size={25} /></div>
                <h3>{tasks.length === 0 ? 'Your list starts here' : 'No matching tasks'}</h3>
                <p>{tasks.length === 0 ? 'Add your first task above and build some momentum.' : 'Try another filter or search term.'}</p>
              </div>
            ) : visibleTasks.map((task) => (
              <article className={`task-row ${task.completed ? 'is-complete' : ''}`} key={task.id}>
                <button className="complete-button" type="button" onClick={() => toggleTask(task.id)} aria-label={task.completed ? 'Mark task as pending' : 'Mark task as completed'}>
                  {task.completed ? <span className="checked-circle"><Check size={14} /></span> : <span className="unchecked-circle" />}
                </button>
                <div className="task-content">
                  {editingId === task.id ? (
                    <form className="edit-form" onSubmit={(event) => { event.preventDefault(); saveEdit(task.id); }}>
                      <input autoFocus value={editText} onChange={(event) => setEditText(event.target.value)} maxLength={180} aria-label="Edit task" />
                      <button type="submit" className="save-edit" disabled={!editText.trim()}>Save</button>
                      <button type="button" className="cancel-edit" onClick={() => setEditingId(null)} aria-label="Cancel editing"><X size={16} /></button>
                    </form>
                  ) : (
                    <>
                      <p className="task-title">{task.text}</p>
                      <span className="task-meta">{task.completed ? 'Completed' : 'In progress'}</span>
                    </>
                  )}
                </div>
                {editingId !== task.id && <div className="task-actions">
                  <button type="button" onClick={() => beginEdit(task)} aria-label={`Edit ${task.text}`} title="Edit task"><Pencil size={16} /></button>
                  <button type="button" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.text}`} title="Delete task"><Trash2 size={16} /></button>
                </div>}
              </article>
            ))}
          </div>
          <footer className="panel-footer"><span><span className="footer-dot" /> Saved in this browser</span><span>Small steps, every day.</span></footer>
        </section>
        <p className="page-footer">Made for a more focused day <span>✦</span></p>
      </div>
    </main>
  );
}
