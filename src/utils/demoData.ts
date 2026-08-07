// Demo data for Professional Mode exploration

// Admin preview organization - used when super admin views without an org (fresh state, just subscribed)
export const adminPreviewOrganization = {
  id: 'admin-preview-org-id',
  name: 'Your Organization',
  domain: null,
  subscription_status: 'active',
  subscription_seats: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  onboarding_completed: true,
  onboarding_step: 3,
  onboarding_completed_at: new Date().toISOString(),
  onboarding_started_at: new Date().toISOString(),
  stripe_customer_id: null,
  stripe_subscription_id: null,
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  logo_url: null,
};

// Fresh/empty data for admin preview (just subscribed state)
export const adminPreviewMembers: never[] = [];
export const adminPreviewSeatUsage = {
  total_seats: 5,
  used_seats: 1, // Just the admin
  available_seats: 4,
};
export const adminPreviewStats = {
  bundlesCreatedThisMonth: 0,
  bundlesLastMonth: 0,
  totalResources: 0,
  activeMembers: 1,
  recentActivity: []
};

export const demoOrganization = {
  id: 'demo-org-id',
  name: 'Harbor Community Services (Demo)',
  domain: 'harborcommunity.org',
  subscription_status: 'active',
  subscription_seats: 10,
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  onboarding_completed: true,
  onboarding_step: 3,
  onboarding_completed_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
  onboarding_started_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  stripe_customer_id: null,
  stripe_subscription_id: null,
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  logo_url: null,
};

export const demoMembers = [
  {
    id: 'demo-member-1',
    user_id: 'demo-user-1',
    organization_id: 'demo-org-id',
    role: 'admin',
    joined_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    invited_by: null,
    user_profiles: {
      display_name: 'Sarah Johnson',
      first_name: 'Sarah',
      email: 'sarah@harborcommunity.org',
    }
  },
  {
    id: 'demo-member-2',
    user_id: 'demo-user-2',
    organization_id: 'demo-org-id',
    role: 'member',
    joined_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    invited_by: 'demo-user-1',
    user_profiles: {
      display_name: 'Michael Chen',
      first_name: 'Michael',
      email: 'michael@harborcommunity.org',
    }
  },
  {
    id: 'demo-member-3',
    user_id: 'demo-user-3',
    organization_id: 'demo-org-id',
    role: 'member',
    joined_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    invited_by: 'demo-user-1',
    user_profiles: {
      display_name: 'Emma Rodriguez',
      first_name: 'Emma',
      email: 'emma@harborcommunity.org',
    }
  },
  {
    id: 'demo-member-4',
    user_id: 'demo-user-4',
    organization_id: 'demo-org-id',
    role: 'admin',
    joined_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    invited_by: 'demo-user-1',
    user_profiles: {
      display_name: 'James Wilson',
      first_name: 'James',
      email: 'james@harborcommunity.org',
    }
  }
];

export const demoSeatUsage = {
  total_seats: 10,
  used_seats: 4,
  available_seats: 6,
};

export const demoBundles = [
  {
    id: 'demo-bundle-1',
    title: 'Emergency Housing Resources',
    description: 'Comprehensive list of emergency shelter and temporary housing options in the downtown area',
    notes: 'Updated monthly. Call ahead to verify bed availability.',
    resources: [
      {
        name: 'City Emergency Shelter',
        address: '123 Main St, Downtown',
        phone: '(555) 123-4567',
        website: 'https://cityemergencyshelter.org',
        hours: '24/7 intake'
      },
      {
        name: 'Harbor House',
        address: '456 Harbor Ave',
        phone: '(555) 234-5678',
        website: 'https://harborhouse.org',
        hours: 'Mon-Fri 9am-5pm'
      },
      {
        name: 'Safe Haven Shelter',
        address: '789 Oak Street',
        phone: '(555) 345-6789',
        website: 'https://safehavenshelter.org',
        hours: '24/7 emergency intake'
      }
    ],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: 'demo-user-1',
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'demo-bundle-2',
    title: 'Food Assistance Programs',
    description: 'Food banks, meal programs, and SNAP enrollment resources',
    notes: 'Most locations require ID. Food bank schedules may vary on holidays.',
    resources: [
      {
        name: 'Community Food Bank',
        address: '321 Community Blvd',
        phone: '(555) 456-7890',
        website: 'https://communityfoodbank.org',
        hours: 'Tue, Thu 10am-2pm'
      },
      {
        name: 'Daily Bread Kitchen',
        address: '654 Union Ave',
        phone: '(555) 567-8901',
        website: 'https://dailybread.org',
        hours: 'Mon-Fri 11:30am-1pm'
      },
      {
        name: 'SNAP Enrollment Center',
        address: '987 State St',
        phone: '(555) 678-9012',
        website: 'https://snap.gov',
        hours: 'Mon-Fri 8am-4pm'
      }
    ],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: 'demo-user-2',
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'demo-bundle-3',
    title: 'Healthcare Access',
    description: 'Free and low-cost healthcare clinics, mental health services, and substance use treatment',
    notes: 'Many clinics offer sliding scale fees. Call for eligibility requirements.',
    resources: [
      {
        name: 'Community Health Center',
        address: '147 Medical Plaza',
        phone: '(555) 789-0123',
        website: 'https://communityhealthcenter.org',
        hours: 'Mon-Fri 8am-6pm, Sat 9am-1pm'
      },
      {
        name: 'Mental Health Crisis Line',
        address: 'N/A',
        phone: '(555) 890-1234',
        website: 'https://mentalhealthcrisis.org',
        hours: '24/7 hotline'
      },
      {
        name: 'Recovery Center',
        address: '258 Hope Street',
        phone: '(555) 901-2345',
        website: 'https://recoverycenter.org',
        hours: 'Mon-Fri 9am-5pm'
      }
    ],
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: 'demo-user-1',
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'demo-bundle-4',
    title: 'Employment Resources',
    description: 'Job training, employment services, and resume assistance programs',
    notes: 'Some programs have income requirements or enrollment deadlines.',
    resources: [
      {
        name: 'Workforce Development Center',
        address: '369 Career Way',
        phone: '(555) 012-3456',
        website: 'https://workforcecenter.org',
        hours: 'Mon-Fri 8am-5pm'
      },
      {
        name: 'Skills Training Institute',
        address: '741 Trade Blvd',
        phone: '(555) 123-4567',
        website: 'https://skillstraining.org',
        hours: 'Mon-Thu 9am-7pm'
      }
    ],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: 'demo-user-3',
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  }
];

export const demoStats = {
  bundlesCreatedThisMonth: 12,
  bundlesLastMonth: 8,
  totalResources: 47,
  activeMembers: 4,
  recentActivity: [
    {
      id: 'demo-activity-1',
      type: 'bundle_created',
      title: 'Employment Resources',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'Emma Rodriguez'
    },
    {
      id: 'demo-activity-2',
      type: 'bundle_updated',
      title: 'Healthcare Access',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'Sarah Johnson'
    },
    {
      id: 'demo-activity-3',
      type: 'member_invited',
      title: 'New team member invited',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'James Wilson'
    }
  ]
};

export const isDemoMode = (organizationId?: string | null): boolean => {
  return organizationId === 'demo-org-id';
};
