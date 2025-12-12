import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateVariablesPanel } from './TemplateVariablesPanel';

describe('TemplateVariablesPanel', () => {
  const mockOnInsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should render collapsed by default', () => {
    render(<TemplateVariablesPanel path="/users" onInsert={mockOnInsert} />);

    expect(screen.getByText('Template Variables')).toBeInTheDocument();
    expect(screen.getByText('(Click to expand)')).toBeInTheDocument();
  });

  it('should expand when toggle button is clicked', () => {
    render(<TemplateVariablesPanel path="/users" onInsert={mockOnInsert} />);

    const toggleButton = screen.getByText('Template Variables');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Path Parameters')).toBeInTheDocument();
    expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    expect(screen.getByText('Request Body')).toBeInTheDocument();
  });

  it('should extract path parameters from route', () => {
    render(<TemplateVariablesPanel path="/users/:id/posts/:postId" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    expect(screen.getByText('{{params.id}}')).toBeInTheDocument();
    expect(screen.getByText('{{params.postId}}')).toBeInTheDocument();
  });

  it('should show "No path parameters" message when path has no params', () => {
    render(<TemplateVariablesPanel path="/users" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    const pathParamsSection = screen.getByText('Path Parameters').closest('.variable-group');
    expect(pathParamsSection).toHaveTextContent('No path parameters detected');
  });

  it('should display all variable groups', () => {
    render(<TemplateVariablesPanel path="/users/:id" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    expect(screen.getByText('Path Parameters')).toBeInTheDocument();
    expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    expect(screen.getByText('Request Body')).toBeInTheDocument();
    expect(screen.getByText('Request Headers')).toBeInTheDocument();
    expect(screen.getByText('Special Variables')).toBeInTheDocument();
  });

  it('should call onInsert when Insert button is clicked', () => {
    render(<TemplateVariablesPanel path="/users/:id" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    const insertButtons = screen.getAllByText('Insert');
    fireEvent.click(insertButtons[0]);

    expect(mockOnInsert).toHaveBeenCalledWith('{{params.id}}');
  });

  it('should copy to clipboard when copy button is clicked', () => {
    render(<TemplateVariablesPanel path="/users/:id" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    const copyButtons = screen.getAllByText('📋');
    fireEvent.click(copyButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{{params.id}}');
  });

  it('should display query parameter examples', () => {
    render(<TemplateVariablesPanel path="/users" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    expect(screen.getByText('{{query.page}}')).toBeInTheDocument();
    expect(screen.getByText('{{query.limit}}')).toBeInTheDocument();
    expect(screen.getByText('{{query.search}}')).toBeInTheDocument();
  });

  it('should display special variables', () => {
    render(<TemplateVariablesPanel path="/users" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    expect(screen.getByText('{{timestamp}}')).toBeInTheDocument();
    expect(screen.getByText('{{date}}')).toBeInTheDocument();
    expect(screen.getByText('{{uuid}}')).toBeInTheDocument();
  });

  it('should collapse when toggle button is clicked again', () => {
    render(<TemplateVariablesPanel path="/users" onInsert={mockOnInsert} />);

    const toggleButton = screen.getByText('Template Variables');
    
    // Expand
    fireEvent.click(toggleButton);
    expect(screen.getByText('Path Parameters')).toBeInTheDocument();

    // Collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Path Parameters')).not.toBeInTheDocument();
  });

  it('should handle multiple path parameters correctly', () => {
    render(
      <TemplateVariablesPanel 
        path="/api/:version/users/:userId/posts/:postId/comments/:commentId" 
        onInsert={mockOnInsert} 
      />
    );

    fireEvent.click(screen.getByText('Template Variables'));

    expect(screen.getByText('{{params.version}}')).toBeInTheDocument();
    expect(screen.getByText('{{params.userId}}')).toBeInTheDocument();
    expect(screen.getByText('{{params.postId}}')).toBeInTheDocument();
    expect(screen.getByText('{{params.commentId}}')).toBeInTheDocument();
  });

  it('should display descriptions for each variable group', () => {
    render(<TemplateVariablesPanel path="/users" onInsert={mockOnInsert} />);

    fireEvent.click(screen.getByText('Template Variables'));

    expect(screen.getByText('Dynamic segments from the URL path')).toBeInTheDocument();
    expect(screen.getByText('Parameters from the URL query string')).toBeInTheDocument();
    expect(screen.getByText('Data from the request body (POST/PUT/PATCH)')).toBeInTheDocument();
    expect(screen.getByText('HTTP headers from the request')).toBeInTheDocument();
    expect(screen.getByText('Built-in utility variables')).toBeInTheDocument();
  });
});

