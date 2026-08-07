import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

const state = vi.hoisted(() => ({
  userLoading: true,
  orgLoading: true,
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => state.navigate,
}));

vi.mock('@/hooks/useUserMode', () => ({
  useUserMode: () => ({
    isProfessionalVerified: false,
    isAdmin: false,
    loading: state.userLoading,
  }),
}));

vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({
    organization: null,
    loading: state.orgLoading,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

import AnalyticsDashboard from '@/pages/AnalyticsDashboard';
import ClientJourneyTracking from '@/pages/ClientJourneyTracking';

describe('professional access loading transitions', () => {
  beforeEach(() => {
    state.userLoading = true;
    state.orgLoading = true;
    state.navigate.mockReset();
  });

  it('keeps AnalyticsDashboard hook order stable when access loading resolves', () => {
    const view = render(<AnalyticsDashboard />);

    state.userLoading = false;
    state.orgLoading = false;

    expect(() => view.rerender(<AnalyticsDashboard />)).not.toThrow();
    expect(state.navigate).toHaveBeenCalledWith('/');
  });

  it('keeps ClientJourneyTracking hook order stable when access loading resolves', () => {
    const view = render(<ClientJourneyTracking />);

    state.userLoading = false;

    expect(() => view.rerender(<ClientJourneyTracking />)).not.toThrow();
    expect(state.navigate).toHaveBeenCalledWith('/');
  });
});
