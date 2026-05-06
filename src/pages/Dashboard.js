import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CheckCheck, Clock, AlertTriangle, FolderOpen, ArrowRight } from 'lucide-react';

const statusLabel = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const { stats, recentTasks } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">Here's what's happening with your projects</div>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <FolderOpen size={16} /> View Projects
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124,106,247,0.15)' }}>
            <LayoutDashboard size={18} color="var(--accent2)" />
          </div>
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{stats?.totalTasks ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Clock size={18} color="var(--blue)" />
          </div>
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats?.inProgressTasks ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <CheckCheck size={18} color="var(--green)" />
          </div>
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats?.doneTasks ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={18} color="var(--red)" />
          </div>
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{stats?.overdueTasks ?? 0}</div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Tasks</h2>
          <Link to="/projects" className="btn btn-secondary btn-sm">
            All Projects <ArrowRight size={14} />
          </Link>
        </div>

        {recentTasks?.length === 0 ? (
          <div className="empty-state">
            <CheckCheck size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div className="empty-title">No tasks yet</div>
            <p>Create a project and add some tasks to get started.</p>
          </div>
        ) : (
          recentTasks?.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
            return (
              <div key={task.id} className="task-item">
                <div style={{ flex: 1 }}>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`badge badge-${task.status.toLowerCase()}`}>
                      {statusLabel[task.status]}
                    </span>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    {task.project && (
                      <span>📁 {task.project.name}</span>
                    )}
                    {task.assignee && <span>👤 {task.assignee.name}</span>}
                    {task.dueDate && (
                      <span className={isOverdue ? 'overdue' : ''}>
                        {isOverdue ? '⚠ ' : '📅 '}
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
