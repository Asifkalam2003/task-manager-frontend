import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getProject, getProjectTasks, createTask, updateTask, deleteTask,
  getAllUsers, addMember, removeMember,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import {
  Plus, ArrowLeft, Trash2, X, Users, UserPlus, CheckSquare,
  Clock, AlertCircle, CheckCheck, Edit3,
} from 'lucide-react';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'TODO',
    priority: 'MEDIUM', dueDate: '', assigneeId: '',
  });

  const isOwnerOrAdmin = user?.role === 'ADMIN' || project?.ownerId === user?.id;

  useEffect(() => {
    Promise.all([
      getProject(id),
      getProjectTasks(id),
      getAllUsers(),
    ]).then(([pRes, tRes, uRes]) => {
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
      setAllUsers(uRes.data.users);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const refreshTasks = () => getProjectTasks(id).then((r) => setTasks(r.data.tasks));
  const refreshProject = () => getProject(id).then((r) => setProject(r.data.project));

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...taskForm, assigneeId: taskForm.assigneeId || undefined, dueDate: taskForm.dueDate || undefined };
    try {
      if (editingTask) {
        await updateTask(id, editingTask.id, payload);
        toast.success('Task updated!');
      } else {
        await createTask(id, payload);
        toast.success('Task created!');
      }
      setShowTaskModal(false);
      refreshTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id, taskId);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask(id, task.id, { ...task, status: newStatus });
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
      toast.success('Status updated!');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // ── Members ───────────────────────────────────────────────────────────────
  const memberIds = project?.members?.map((m) => m.userId) || [];
  const nonMembers = allUsers.filter((u) => !memberIds.includes(u.id));

  const handleAddMember = async (userId) => {
    try {
      await addMember(id, userId);
      toast.success('Member added!');
      refreshProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await removeMember(id, userId);
      toast.success('Member removed');
      refreshProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) return <div className="spinner" />;

  // Group tasks by status
  const grouped = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  const statusIcons = {
    TODO: <AlertCircle size={15} />,
    IN_PROGRESS: <Clock size={15} />,
    DONE: <CheckCheck size={15} />,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/projects" style={{ color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, textDecoration: 'none', marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <div className="page-title">{project?.name}</div>
            {project?.description && <div className="page-subtitle">{project.description}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isOwnerOrAdmin && (
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
                <UserPlus size={16} /> Members
              </button>
            )}
            <button className="btn btn-primary" onClick={openCreateTask}>
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['tasks', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 14, fontWeight: 500,
              color: activeTab === tab ? 'var(--accent2)' : 'var(--text2)',
              borderBottom: activeTab === tab ? '2px solid var(--accent2)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {tab === 'tasks' ? <><CheckSquare size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Tasks ({tasks.length})</> : <><Users size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Members ({project?.members?.length})</>}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        tasks.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <CheckSquare size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div className="empty-title">No tasks yet</div>
              <p style={{ marginBottom: 16 }}>Add your first task to this project</p>
              <button className="btn btn-primary" onClick={openCreateTask}><Plus size={16} /> Add Task</button>
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {STATUS_OPTIONS.map((status) => (
              <div key={status}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className={`badge badge-${status.toLowerCase()}`}>
                    {statusIcons[status]} {STATUS_LABEL[status]}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>({grouped[status].length})</span>
                </div>
                {grouped[status].length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text2)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    No tasks
                  </div>
                ) : (
                  grouped[status].map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                    return (
                      <div key={task.id} className="task-item" style={{ flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <div className="task-title">{task.title}</div>
                          <div className="task-actions" style={{ opacity: 1 }}>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '3px 7px' }} onClick={() => openEditTask(task)}>
                              <Edit3 size={13} />
                            </button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '3px 7px' }} onClick={() => handleDeleteTask(task.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0 8px', lineHeight: 1.5 }}>{task.description}</p>
                        )}
                        <div className="task-meta" style={{ width: '100%' }}>
                          <span className={`badge badge-${(task.priority || 'medium').toLowerCase()}`}>{task.priority || 'MEDIUM'}</span>
                          {task.assignee && <span>👤 {task.assignee.name}</span>}
                          {task.dueDate && (
                            <span className={isOverdue ? 'overdue' : ''}>
                              {isOverdue ? '⚠ ' : '📅 '}{new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {/* Quick status change */}
                        <select
                          className="form-select"
                          style={{ marginTop: 8, fontSize: 12, padding: '4px 8px' }}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Project Members</h3>
            {isOwnerOrAdmin && nonMembers.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                <UserPlus size={14} /> Add Member
              </button>
            )}
          </div>
          {project?.members?.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="user-avatar">{m.user.name[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.user.email}</div>
              </div>
              <span className={`badge badge-${m.user.role.toLowerCase()}`}>{m.user.role}</span>
              {isOwnerOrAdmin && project.ownerId !== m.userId && (
                <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.userId)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingTask ? 'Edit Task' : 'New Task'}</div>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Task title" value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Optional description" value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {project?.members?.map((m) => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Members</div>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}><X size={18} /></button>
            </div>
            {nonMembers.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>All users are already members of this project.</p>
            ) : (
              nonMembers.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="user-avatar">{u.name[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{u.email}</div>
                  </div>
                  <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddMember(u.id)}>
                    <Plus size={13} /> Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;