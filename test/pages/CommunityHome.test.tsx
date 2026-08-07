import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils';

// Mock useUserMode hook
const mockUseUserMode = vi.fn();
vi.mock('@/hooks/useUserMode', () => ({
  useUserMode: () => mockUseUserMode(),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useGeolocation
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    coordinates: null,
    error: null,
    loading: false,
    requestLocation: vi.fn(),
  }),
}));

vi.mock('@/hooks/useOrganizationConnection', () => ({
  useOrganizationConnection: () => ({
    isConnected: false,
    organizationId: null,
    organizationName: null,
    connectionCode: null,
    loading: false,
    connectToOrganization: vi.fn(),
    disconnectFromOrganization: vi.fn(),
  }),
}));

// Import after mocks
import CommunityHome from '@/pages/CommunityHome';

describe('CommunityHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockUseUserMode.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      currentMode: 'community',
      isAdmin: false,
      isEduVerified: false,
      isProfessionalVerified: false,
      isInstructorVerified: false,
      hasCompletedOnboarding: true,
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
      completeOnboarding: vi.fn(),
      updateMode: vi.fn(),
    });

    render(<CommunityHome />);
    expect(screen.getByRole('status', { name: /Loading BridgePoint/i })).toBeInTheDocument();
  });

  it('renders the community shell when auth state is settled without a profile', () => {
    mockUseUserMode.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      currentMode: 'community',
      isAdmin: false,
      isEduVerified: false,
      isProfessionalVerified: false,
      isInstructorVerified: false,
      hasCompletedOnboarding: true,
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
      completeOnboarding: vi.fn(),
      updateMode: vi.fn(),
    });

    render(<CommunityHome />);
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
  });

  it('renders for authenticated community user', async () => {
    mockUseUserMode.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      profile: {
        id: 'profile-id',
        user_id: 'test-user',
        email: 'test@example.com',
        current_mode: 'community',
        has_completed_onboarding: true,
        first_name: 'Test',
        home_location: 'Test City, Test State',
      },
      loading: false,
      currentMode: 'community',
      isAdmin: false,
      isEduVerified: false,
      isProfessionalVerified: false,
      isInstructorVerified: false,
      hasCompletedOnboarding: true,
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
      completeOnboarding: vi.fn(),
      updateMode: vi.fn(),
    });

    render(<CommunityHome />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hi, Test' })).toBeInTheDocument();
    });
  });
});
