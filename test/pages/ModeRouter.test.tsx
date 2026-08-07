import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../utils';

// Mock useUserMode hook
const mockUseUserMode = vi.fn();
vi.mock('@/hooks/useUserMode', () => ({
  useUserMode: () => mockUseUserMode(),
}));

// Track navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import ModeRouter from '@/pages/ModeRouter';

describe('ModeRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('shows loading state while checking auth', () => {
    mockUseUserMode.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      currentMode: 'community',
      isEduVerified: false,
      isInstructorVerified: false,
      isProfessionalVerified: false,
    });

    const { container } = render(<ModeRouter />);
    expect(container.textContent).toContain('Loading BridgePoint');
  });

  it('redirects to auth when not logged in', async () => {
    mockUseUserMode.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      currentMode: 'community',
      isEduVerified: false,
      isInstructorVerified: false,
      isProfessionalVerified: false,
    });

    render(<ModeRouter />);

    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('redirects community user to community-home', async () => {
    mockUseUserMode.mockReturnValue({
      user: { id: 'test-user' },
      profile: { current_mode: 'community' },
      loading: false,
      currentMode: 'community',
      isEduVerified: false,
      isInstructorVerified: false,
      isProfessionalVerified: false,
    });

    render(<ModeRouter />);

    expect(mockNavigate).toHaveBeenCalledWith('/community-home');
  });

  it('redirects verified student to student-home', async () => {
    mockUseUserMode.mockReturnValue({
      user: { id: 'test-user' },
      profile: { current_mode: 'student' },
      loading: false,
      currentMode: 'student',
      isEduVerified: true,
      isInstructorVerified: false,
      isProfessionalVerified: false,
    });

    render(<ModeRouter />);

    expect(mockNavigate).toHaveBeenCalledWith('/student-home');
  });

  it('redirects unverified student to community-home', async () => {
    mockUseUserMode.mockReturnValue({
      user: { id: 'test-user' },
      profile: { current_mode: 'student' },
      loading: false,
      currentMode: 'student',
      isEduVerified: false,
      isInstructorVerified: false,
      isProfessionalVerified: false,
    });

    render(<ModeRouter />);

    expect(mockNavigate).toHaveBeenCalledWith('/community-home');
  });

  it('redirects verified professional to professional-home', async () => {
    mockUseUserMode.mockReturnValue({
      user: { id: 'test-user' },
      profile: { current_mode: 'professional' },
      loading: false,
      currentMode: 'professional',
      isEduVerified: false,
      isInstructorVerified: false,
      isProfessionalVerified: true,
    });

    render(<ModeRouter />);

    expect(mockNavigate).toHaveBeenCalledWith('/professional-home');
  });

  it('redirects verified instructor to instructor-home', async () => {
    mockUseUserMode.mockReturnValue({
      user: { id: 'test-user' },
      profile: { current_mode: 'instructor' },
      loading: false,
      currentMode: 'instructor',
      isEduVerified: false,
      isInstructorVerified: true,
      isProfessionalVerified: false,
    });

    render(<ModeRouter />);

    expect(mockNavigate).toHaveBeenCalledWith('/instructor-home');
  });
});
