import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FakerMethodBrowser } from './FakerMethodBrowser';
import { fakerDocsApi } from '../api/faker-docs';

// Mock the API
vi.mock('../api/faker-docs', () => ({
  fakerDocsApi: {
    getAvailableMethods: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FakerMethodBrowser', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  const mockMethods = {
    person: ['fullName', 'firstName', 'lastName', 'email'],
    internet: ['email', 'url', 'userName'],
    location: ['city', 'country', 'zipCode'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fakerDocsApi.getAvailableMethods as any).mockResolvedValue({
      data: mockMethods,
    });
  });

  it('should render the modal', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    expect(screen.getByText('Faker.js Method Browser')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search modules/i)).toBeInTheDocument();
    });
  });

  it('should load and display modules', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(screen.getByText('person')).toBeInTheDocument();
      expect(screen.getByText('internet')).toBeInTheDocument();
      expect(screen.getByText('location')).toBeInTheDocument();
    });
  });

  it('should display method counts for each module', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    await waitFor(() => {
      // person has 4 methods
      const personModule = screen.getByText('person').closest('.module-item');
      expect(personModule).toHaveTextContent('4');

      // internet has 3 methods
      const internetModule = screen.getByText('internet').closest('.module-item');
      expect(internetModule).toHaveTextContent('3');
    });
  });

  it('should display methods when a module is selected', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    await waitFor(() => {
      const personModule = screen.getByText('person');
      fireEvent.click(personModule);
    });

    await waitFor(() => {
      expect(screen.getByText('fullName')).toBeInTheDocument();
      expect(screen.getByText('firstName')).toBeInTheDocument();
      expect(screen.getByText('lastName')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
    });
  });

  it('should call onSelect with correct syntax when Insert is clicked', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('person'));
    });

    await waitFor(() => {
      const insertButtons = screen.getAllByText('Insert');
      fireEvent.click(insertButtons[0]); // Click first Insert button (fullName)
    });

    expect(mockOnSelect).toHaveBeenCalledWith('{{faker.person.fullName}}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should filter modules and methods by search query', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(screen.getByText('person')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search modules/i);
    fireEvent.change(searchInput, { target: { value: 'inter' } });

    await waitFor(() => {
      expect(screen.getByText('internet')).toBeInTheDocument();
      expect(screen.queryByText('person')).not.toBeInTheDocument();
      expect(screen.queryByText('location')).not.toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when overlay is clicked', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close modal when content is clicked', async () => {
    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    await waitFor(() => {
      const content = document.querySelector('.faker-browser');
      fireEvent.click(content!);
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle API error gracefully', async () => {
    (fakerDocsApi.getAvailableMethods as any).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    // Should still render without crashing
    expect(screen.getByText('Faker.js Method Browser')).toBeInTheDocument();
  });

  it('should copy to clipboard when copy button is clicked', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <FakerMethodBrowser onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('person'));
    });

    await waitFor(() => {
      const copyButtons = screen.getAllByText('📋');
      fireEvent.click(copyButtons[0]);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{{faker.person.fullName}}');
  });
});

