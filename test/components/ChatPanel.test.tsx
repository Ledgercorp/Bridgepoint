import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils';
import { ChatPanel } from '@/components/ChatPanel';

// Mock fetch for AI streaming
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('ChatPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentMode: 'community' as const,
    isEduVerified: false,
    isProfessionalVerified: false,
    userLocation: 'Test City, Test State',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('renders when open', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Solace' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ChatPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Solace/)).not.toBeInTheDocument();
  });

  it('shows welcome message on initial render', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByText(/I'm here whenever you're ready/i)).toBeInTheDocument();
  });

  it('renders input field for user messages', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Ask Solace/i)).toBeInTheDocument();
  });

  it('allows typing in the input field', () => {
    render(<ChatPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Ask Solace/i);

    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');
  });

  it('sends message when submit button clicked', async () => {
    // Mock successful streaming response
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n')
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Ask Solace/i);
    fireEvent.change(input, { target: { value: 'Hello Solace' } });

    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('shows quick action buttons', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Find resources in my area/i })).toBeInTheDocument();
  });

  it('populates input when quick action clicked', () => {
    render(<ChatPanel {...defaultProps} />);

    const quickAction = screen.getByRole('button', { name: /Find resources in my area/i });
    fireEvent.click(quickAction);

    const input = screen.getByPlaceholderText(/Ask Solace/i);
    expect(input).toHaveValue('Find resources in my area');
  });

  it('shows student mode context when in student mode', () => {
    render(<ChatPanel {...defaultProps} currentMode="student" isEduVerified={true} />);
    expect(screen.getByText(/Student Mode: For educational use only/i)).toBeInTheDocument();
  });
});
