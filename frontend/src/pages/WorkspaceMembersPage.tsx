import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  userId: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  user: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export function WorkspaceMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('VIEWER');

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wsResponse, membersResponse] = await Promise.all([
        apiClient.get(`/admin/workspaces/${workspaceId}`),
        apiClient.get(`/admin/workspaces/${workspaceId}/members`),
      ]);
      setWorkspace(wsResponse.data);
      setMembers(membersResponse.data);
    } catch (err) {
      toast.error('Failed to load members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/admin/workspaces/${workspaceId}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success('Member invited successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('VIEWER');
      loadData();
    } catch (err: any) {
      toast.error(`Failed to invite member: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await apiClient.patch(`/admin/workspaces/${workspaceId}/members/${memberId}`, {
        role: newRole,
      });
      toast.success('Role updated successfully!');
      loadData();
    } catch (err: any) {
      toast.error(`Failed to update role: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await apiClient.delete(`/admin/workspaces/${workspaceId}/members/${memberId}`);
      toast.success('Member removed successfully!');
      loadData();
    } catch (err: any) {
      toast.error(`Failed to remove member: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#e74c3c';
      case 'EDITOR':
        return '#3498db';
      case 'VIEWER':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/workspaces')}>
            ← Back to Workspaces
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginTop: '16px' }}>
            {workspace?.name} - Members
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
          + Invite Member
        </button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Joined</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No members in this workspace yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>{member.user.email}</td>
                  <td style={{ padding: '12px' }}>{member.user.name || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <select
                      className="select"
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: getRoleBadgeColor(member.role),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                      }}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveMember(member.id)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Invite Member
            </h2>

            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Role</label>
                <select className="select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)}>
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="EDITOR">Editor (Create & Edit)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {inviteRole === 'VIEWER' && 'Can view APIs and endpoints'}
                  {inviteRole === 'EDITOR' && 'Can create and edit APIs and endpoints'}
                  {inviteRole === 'ADMIN' && 'Can manage workspace settings and members'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Invite
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

