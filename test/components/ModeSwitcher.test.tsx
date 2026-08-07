import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils';
import userEvent from '@testing-library/user-event';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { UserMode } from '@/hooks/useUserMode';

describe('ModeSwitcher', () => {
  const defaultProps = {
    currentMode: 'community' as UserMode,
    isEduVerified: false,
    isProfessionalVerified: false,
    isInstructorVerified: false,
    isAdmin: false,
    onModeChange: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current mode badge', () => {
    render(<ModeSwitcher {...defaultProps} />);
    expect(screen.getByText('Community Mode')).toBeInTheDocument();
  });

  it('shows only community mode when no verifications', () => {
    render(<ModeSwitcher {...defaultProps} />);
    // Should not show dropdown since only one mode available
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows dropdown when multiple modes available', () => {
    render(
      <ModeSwitcher
        {...defaultProps}
        isEduVerified={true}
      />
    );
    // Badge should be clickable when multiple modes
    const badge = screen.getByText('Community Mode');
    expect(badge).toBeInTheDocument();
  });

  it('shows all modes for admin', async () => {
    const user = userEvent.setup();
    render(
      <ModeSwitcher
        {...defaultProps}
        isAdmin={true}
      />
    );

    // Click to open dropdown
    await user.click(screen.getByText('Community Mode'));

    await waitFor(() => {
      expect(screen.getByText('Student Mode')).toBeInTheDocument();
      expect(screen.getByText('Professional Mode (Organization Access)')).toBeInTheDocument();
      expect(screen.getByText('Instructor Mode')).toBeInTheDocument();
    });
  });

  it('calls onModeChange when switching modes', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn().mockResolvedValue(true);

    render(
      <ModeSwitcher
        {...defaultProps}
        isAdmin={true}
        onModeChange={onModeChange}
      />
    );

    // Open dropdown
    await user.click(screen.getByText('Community Mode'));

    await waitFor(() => {
      expect(screen.getByText('Student Mode')).toBeInTheDocument();
    });

    // Click student mode
    await user.click(screen.getByText('Student Mode'));

    await waitFor(() => {
      expect(onModeChange).toHaveBeenCalledWith('student');
    });
  });

  it('shows student mode when edu verified', async () => {
    const user = userEvent.setup();
    render(
      <ModeSwitcher
        {...defaultProps}
        isEduVerified={true}
      />
    );

    await user.click(screen.getByText('Community Mode'));

    await waitFor(() => {
      expect(screen.getByText('Student Mode')).toBeInTheDocument();
    });
  });

  it('shows professional mode when professional verified', async () => {
    const user = userEvent.setup();
    render(
      <ModeSwitcher
        {...defaultProps}
        isProfessionalVerified={true}
      />
    );

    await user.click(screen.getByText('Community Mode'));

    await waitFor(() => {
      expect(screen.getByText('Professional Mode (Organization Access)')).toBeInTheDocument();
    });
  });
});
