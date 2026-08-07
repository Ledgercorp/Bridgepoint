import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalOnboardingTourProps {
  organizationId: string;
  isAdmin: boolean;
  onComplete?: () => void;
}

export function ProfessionalOnboardingTour({
  organizationId,
  isAdmin,
  onComplete
}: ProfessionalOnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('onboarding_completed, onboarding_step')
          .eq('id', organizationId)
          .single();

        if (org && !org.onboarding_completed && isAdmin) {
          // Start tour from last saved step
          setStepIndex(org.onboarding_step || 0);

          // Record onboarding start if not started
          if (org.onboarding_step === 0) {
            await supabase
              .from('organizations')
              .update({ onboarding_started_at: new Date().toISOString() })
              .eq('id', organizationId);
          }

          // Small delay to ensure DOM is ready
          setTimeout(() => setRun(true), 1000);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    if (isAdmin) {
      checkOnboardingStatus();
    }
  }, [organizationId, isAdmin]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Welcome to Professional Mode! 🎉</h3>
          <p className="mb-3">
            Let's take a quick tour to help you set up your organization and start using powerful tools for serving your community.
          </p>
          <p className="text-sm text-muted-foreground">
            This will only take 2 minutes. You can exit anytime and resume later.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="subscription-card"]',
      content: (
        <div>
          <h4 className="font-semibold mb-2">Your Subscription Status</h4>
          <p className="text-sm">
            This shows your current subscription tier. Professional Mode requires an active subscription to access premium features like AI System Navigator and Analytics.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="org-admin-panel"]',
      content: (
        <div>
          <h4 className="font-semibold mb-2">Organization Management Hub</h4>
          <p className="text-sm mb-2">
            As an admin, you can manage your organization's settings, team members, and subscription here.
          </p>
          <ul className="text-sm space-y-1">
            <li>• View seat usage and add members</li>
            <li>• Customize organization branding</li>
            <li>• Manage billing and subscription</li>
          </ul>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="invite-members-btn"]',
      content: (
        <div>
          <h4 className="font-semibold mb-2">Invite Your Team 👥</h4>
          <p className="text-sm mb-2">
            Click here to invite colleagues to your organization. Each team member gets access to:
          </p>
          <ul className="text-sm space-y-1">
            <li>• Shared resource bundles</li>
            <li>• Collaborative tools</li>
            <li>• Organization analytics</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Your plan includes seats for team members. Check the usage meter above.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div>
          <h4 className="font-semibold mb-2">Quick Access Tools ⚡</h4>
          <p className="text-sm mb-2">
            These shortcuts give you instant access to your most-used features:
          </p>
          <ul className="text-sm space-y-1">
            <li>• <strong>AI Navigator</strong> - Guide clients through complex processes</li>
            <li>• <strong>Resource Bundles</strong> - Create custom resource packages</li>
            <li>• <strong>Analytics</strong> - Track usage and outcomes</li>
            <li>• <strong>Professional Tools</strong> - Access all premium features</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="resource-bundles-action"]',
      content: (
        <div>
          <h4 className="font-semibold mb-2">Create Your First Resource Bundle 📦</h4>
          <p className="text-sm mb-2">
            Resource Bundles are collections of community resources you can share with clients or colleagues. Perfect for:
          </p>
          <ul className="text-sm space-y-1">
            <li>• Creating housing assistance packages</li>
            <li>• Building food security resource lists</li>
            <li>• Organizing healthcare referral guides</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Click this button to navigate to Resource Bundles when you're ready!
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="premium-features"]',
      content: (
        <div>
          <h4 className="font-semibold mb-2">Professional Tools Overview</h4>
          <p className="text-sm mb-2">
            Scroll through these cards to explore all the advanced capabilities available with Professional Mode.
          </p>
          <p className="text-sm">
            These tools are available to all staff members of verified organizations with active subscriptions.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">You're All Set! 🚀</h3>
          <p className="mb-3">
            You now know the basics of your Professional Dashboard. Here's what to do next:
          </p>
          <ol className="text-sm space-y-2 mb-3">
            <li>1. Invite your team members</li>
            <li>2. Create your first resource bundle</li>
            <li>3. Explore the AI System Navigator</li>
            <li>4. Check out Analytics to track your impact</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Need help? Contact support at support@bridgepoint.app
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, type, index, action } = data;

    // Save progress on each step
    if (type === EVENTS.STEP_AFTER && action !== ACTIONS.CLOSE) {
      try {
        await supabase
          .from('organizations')
          .update({ onboarding_step: index + 1 })
          .eq('id', organizationId);
      } catch (error) {
        console.error('Error saving onboarding progress:', error);
      }
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      try {
        await supabase
          .from('organizations')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            onboarding_step: steps.length
          })
          .eq('id', organizationId);

        setRun(false);

        if (status === STATUS.FINISHED) {
          toast({
            title: 'Onboarding Complete! 🎉',
            description: 'You\'re ready to start using Professional Mode',
          });
        }

        if (onComplete) onComplete();
      } catch (error) {
        console.error('Error completing onboarding:', error);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: 'hsl(var(--background))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 600,
        },
        buttonBack: {
          marginRight: 10,
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: 14,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
