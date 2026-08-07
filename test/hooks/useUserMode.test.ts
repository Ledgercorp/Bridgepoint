/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as RTL from '@testing-library/react';
import { useUserMode, UserMode } from '@/hooks/useUserMode';

const { renderHook, waitFor } = RTL as any;

// Mock Supabase
const mockSession = { user: { id: 'test-user-id', email: 'test@example.com' } };
const mockProfile = {
  id: 'profile-id',
  user_id: 'test-user-id',
  email: 'test@example.com',
  current_mode: 'community' as UserMode,
  is_edu_verified: false,
  is_professional_verified: false,
  is_instructor_verified: false,
  has_completed_onboarding: true,
};

const mockFromReturn = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn().mockReturnThis(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => mockFromReturn),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('useUserMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromReturn.single.mockResolvedValue({ data: mockProfile, error: null });
    mockFromReturn.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockFromReturn.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('should start in loading state', () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useUserMode());
    expect(result.current.loading).toBe(true);
  });

  it('should return null user when not authenticated', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useUserMode());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('should load profile when authenticated', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockFromReturn.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    const { result } = renderHook(() => useUserMode());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.currentMode).toBe('community');
  });

  it('should allow switching to student mode when edu verified', async () => {
    const verifiedProfile = { ...mockProfile, is_edu_verified: true };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockFromReturn.single.mockResolvedValueOnce({
      data: verifiedProfile,
      error: null,
    });

    mockFromReturn.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useUserMode());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.updateMode('student');
    expect(success).toBe(true);
  });

  it('should not allow switching to student mode when not edu verified', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockFromReturn.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    const { result } = renderHook(() => useUserMode());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.updateMode('student');
    expect(success).toBe(false);
  });

  it('should allow admins to switch to any mode', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockFromReturn.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });
    mockFromReturn.maybeSingle.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    });

    mockFromReturn.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useUserMode());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.updateMode('professional');
    expect(success).toBe(true);
  });
});
