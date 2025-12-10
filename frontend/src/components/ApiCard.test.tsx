import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ApiCard } from './ApiCard';

describe('ApiCard', () => {
  const mockApi = {
    id: '1',
    workspaceId: 'ws-1',
    name: 'Test API',
    slug: 'test-api',
    version: '1.0.0',
    basePath: '/',
    description: 'Test description',
    isActive: true,
    tags: ['test'],
    endpoints: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOnDelete = vi.fn();
  const mockOnExport = vi.fn();

  it('renders API name', () => {
    render(
      <BrowserRouter>
        <ApiCard api={mockApi} onDelete={mockOnDelete} onExport={mockOnExport} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test API')).toBeDefined();
  });

  it('renders API slug', () => {
    render(
      <BrowserRouter>
        <ApiCard api={mockApi} onDelete={mockOnDelete} onExport={mockOnExport} />
      </BrowserRouter>
    );

    expect(screen.getByText(/test-api/)).toBeDefined();
  });
});

