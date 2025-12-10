// frontend/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthApi, ApiKey } from '../api/auth';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRaw, setNewKeyRaw] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await AuthApi.listApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Error cargando API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const response = await AuthApi.createApiKey({
        name: newKeyName,
        scope: ['*'],
      });

      setNewKeyRaw(response.rawKey);
      setApiKeys([...apiKeys, response.apiKey]);
      setNewKeyName('');
    } catch (error) {
      console.error('Error creando API key:', error);
      alert('Error al crear API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('¿Estás seguro de revocar esta API key?')) return;

    try {
      await AuthApi.revokeApiKey(id);
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (error) {
      console.error('Error revocando API key:', error);
      alert('Error al revocar API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  if (!user) return null;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Perfil</h1>
        <button onClick={logout} style={{ padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      {/* Información del Usuario */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Información</h2>
        <p><strong>Nombre:</strong> {user.name || 'Sin nombre'}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Rol:</strong> {user.role}</p>
        <p><strong>Estado:</strong> {user.isActive ? '✅ Activo' : '❌ Inactivo'}</p>
      </div>

      {/* API Keys */}
      <div>
        <h2>API Keys</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Usa estas claves para acceder a la API de forma programática.
        </p>

        {/* Formulario de creación */}
        <form onSubmit={handleCreateKey} style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Nombre de la API key (ej: Mi App)"
            required
            style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            type="submit"
            disabled={creating}
            style={{ padding: '0.5rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: creating ? 'not-allowed' : 'pointer' }}
          >
            {creating ? 'Creando...' : '+ Crear API Key'}
          </button>
        </form>

        {/* Mostrar clave nueva */}
        {newKeyRaw && (
          <div style={{ padding: '1rem', background: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', marginBottom: '1rem' }}>
            <strong>⚠️ ¡Guarda esta clave! Solo se muestra una vez:</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <code style={{ flex: 1, background: 'white', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {newKeyRaw}
              </code>
              <button onClick={() => copyToClipboard(newKeyRaw)} style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Copiar
              </button>
            </div>
            <button onClick={() => setNewKeyRaw('')} style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cerrar
            </button>
          </div>
        )}

        {/* Lista de API keys */}
        {loading ? (
          <p>Cargando API keys...</p>
        ) : apiKeys.length === 0 ? (
          <p style={{ color: '#999' }}>No tienes API keys creadas todavía.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Scope</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Último uso</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Creada</th>
                <th style={{ textAlign: 'center', padding: '0.75rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}><strong>{key.name}</strong></td>
                  <td style={{ padding: '0.75rem' }}><code>{key.scope.join(', ')}</code></td>
                  <td style={{ padding: '0.75rem' }}>
                    {key.isActive ? (
                      <span style={{ color: '#28a745' }}>✓ Activa</span>
                    ) : (
                      <span style={{ color: '#dc3545' }}>✗ Revocada</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Nunca'}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {key.isActive && (
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        style={{ padding: '0.25rem 0.75rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Revocar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

