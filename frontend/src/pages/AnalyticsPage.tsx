// frontend/src/pages/AnalyticsPage.tsx
import React, { useState, useEffect } from 'react';
import { AnalyticsApi, AnalyticsStats } from '../api/analytics';
import { ApiDefinitionsApi, ApiDefinition } from '../api/api-definitions';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [selectedApi, setSelectedApi] = useState<string>('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadApis();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedApi, dateRange]);

  const loadApis = async () => {
    try {
      const data = await ApiDefinitionsApi.list();
      setApis(data);
    } catch (error) {
      console.error('Error cargando APIs:', error);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      
      if (selectedApi) {
        filters.apiSlug = selectedApi;
      }

      if (dateRange === '7d') {
        filters.from = subDays(new Date(), 7).toISOString();
      } else if (dateRange === '30d') {
        filters.from = subDays(new Date(), 30).toISOString();
      }

      const data = await AnalyticsApi.getStats(filters);
      setStats(data);
    } catch (error) {
      console.error('Error cargando stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <p>No se pudieron cargar las estadísticas.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>📊 Analytics</h1>

      {/* Filtros */}
      <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
            API
          </label>
          <select
            value={selectedApi}
            onChange={(e) => setSelectedApi(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minWidth: '200px' }}
          >
            <option value="">Todas las APIs</option>
            {apis.map((api) => (
              <option key={api.id} value={api.slug}>
                {api.name} ({api.slug})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
            Período
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 'auto' }}
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Resumen en Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#e3f2fd', padding: '1.5rem', borderRadius: '8px', border: '1px solid #90caf9' }}>
          <div style={{ fontSize: '0.85rem', color: '#1565c0', marginBottom: '0.5rem' }}>Total Requests</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0d47a1' }}>{stats.totalRequests.toLocaleString()}</div>
        </div>

        <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '8px', border: '1px solid #81c784' }}>
          <div style={{ fontSize: '0.85rem', color: '#2e7d32', marginBottom: '0.5rem' }}>Success Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1b5e20' }}>{stats.successRate}%</div>
        </div>

        <div style={{ background: '#fff3e0', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ffb74d' }}>
          <div style={{ fontSize: '0.85rem', color: '#e65100', marginBottom: '0.5rem' }}>Avg Duration</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#bf360c' }}>{stats.avgDurationMs}ms</div>
        </div>

        <div style={{ background: '#ffebee', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e57373' }}>
          <div style={{ fontSize: '0.85rem', color: '#c62828', marginBottom: '0.5rem' }}>Error Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b71c1c' }}>{stats.errorRate}%</div>
        </div>
      </div>

      {/* Gráfica de Requests por Día */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Requests por Día</h2>
        {stats.requestsByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.requestsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
                name="Requests"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center', color: '#999' }}>No hay datos para mostrar</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Top APIs */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Top APIs</h2>
          {stats.topApis.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topApis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="apiSlug" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>No hay datos</p>
          )}
        </div>

        {/* Top Endpoints */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Top Endpoints</h2>
          {stats.topEndpoints.length > 0 ? (
            <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd', position: 'sticky', top: 0, background: 'white' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.85rem' }}>Method</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.85rem' }}>Path</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.85rem' }}>Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topEndpoints.map((endpoint, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <code style={{ background: '#f1f3f4', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.85rem' }}>
                          {endpoint.method}
                        </code>
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
                        <code>{endpoint.path}</code>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {endpoint.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>No hay datos</p>
          )}
        </div>
      </div>
    </div>
  );
};

