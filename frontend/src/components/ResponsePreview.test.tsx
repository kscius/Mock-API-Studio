import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsePreview } from './ResponsePreview';
import { fakerDocsApi } from '../api/faker-docs';

vi.mock('../api/faker-docs', () => ({
  fakerDocsApi: {
    renderTemplate: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ResponsePreview', () => {
  const mockOnClose = vi.fn();

  const mockResponseBody = {
    id: '{{faker.string.uuid}}',
    name: '{{faker.person.fullName}}',
    email: '{{faker.internet.email}}',
  };

  const mockRenderedBody = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fakerDocsApi.renderTemplate as any).mockResolvedValue({
      data: mockRenderedBody,
    });
  });

  it('should render the modal', () => {
    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    expect(screen.getByText('Response Preview with Faker.js')).toBeInTheDocument();
  });

  it('should show generate preview button initially', () => {
    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    expect(screen.getByText('Generate Preview')).toBeInTheDocument();
    expect(screen.getByText(/click "generate preview"/i)).toBeInTheDocument();
  });

  it('should generate preview when button is clicked', async () => {
    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    const generateButton = screen.getByText('Generate Preview');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(fakerDocsApi.renderTemplate).toHaveBeenCalledWith(mockResponseBody);
    });

    await waitFor(() => {
      expect(screen.getByText('Generated Data')).toBeInTheDocument();
    });
  });

  it('should display loading state while generating', async () => {
    (fakerDocsApi.renderTemplate as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockRenderedBody }), 100))
    );

    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('Generate Preview'));

    expect(screen.getByText('Generating preview...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Generated Data')).toBeInTheDocument();
    });
  });

  it('should display both template and output side by side', async () => {
    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('Generate Preview'));

    await waitFor(() => {
      expect(screen.getByText('Original Template')).toBeInTheDocument();
      expect(screen.getByText('Generated Output')).toBeInTheDocument();
    });

    // Check if template is displayed
    const templateCode = screen.getAllByText(/faker\.string\.uuid/i)[0];
    expect(templateCode).toBeInTheDocument();

    // Check if output is displayed
    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });

  it('should handle regenerate', async () => {
    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    // First generation
    fireEvent.click(screen.getByText('Generate Preview'));
    await waitFor(() => {
      expect(screen.getByText('🔄 Regenerate')).toBeInTheDocument();
    });

    vi.clearAllMocks();

    // Regenerate
    fireEvent.click(screen.getByText('🔄 Regenerate'));

    await waitFor(() => {
      expect(fakerDocsApi.renderTemplate).toHaveBeenCalledTimes(1);
    });
  });

  it('should copy to clipboard when copy button is clicked', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('Generate Preview'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('📋 Copy'));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockRenderedBody, null, 2)
    );
  });

  it('should handle error when no Faker placeholders found', async () => {
    const bodyWithoutFaker = {
      id: '123',
      name: 'Static Name',
    };

    render(
      <ResponsePreview responseBody={bodyWithoutFaker} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('Generate Preview'));

    await waitFor(() => {
      expect(screen.getByText(/no faker\.js placeholders found/i)).toBeInTheDocument();
    });
  });

  it('should handle API error', async () => {
    (fakerDocsApi.renderTemplate as any).mockRejectedValue({
      response: { data: { message: 'Template error' } },
    });

    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('Generate Preview'));

    await waitFor(() => {
      expect(screen.getByText(/⚠️ template error/i)).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', () => {
    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when overlay is clicked', () => {
    render(
      <ResponsePreview responseBody={mockResponseBody} onClose={mockOnClose} />
    );

    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay!);
    expect(mockOnClose).toHaveBeenCalled();
  });
});

