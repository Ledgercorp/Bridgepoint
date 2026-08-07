import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommunityTourProps {
  onComplete?: () => void;
}

export function CommunityTour({ onComplete }: CommunityTourProps) {
  const [run, setRun] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setRun(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">Welcome to BridgePoint!</h3>
          <p>
            Let's take a quick tour to help you get the most out of the app. This will only take a minute.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Quick Actions</h4>
          <p className="text-sm">
            These are your go-to shortcuts for the most common tasks:
          </p>
          <ul className="text-sm space-y-1 mt-2">
            <li>• <strong>Talk to Solace</strong> - Get instant guidance</li>
            <li>• <strong>Find Resources</strong> - Search local services</li>
            <li>• <strong>Quick Tasks</strong> - Common actions made easy</li>
            <li>• <strong>Life Navigation</strong> - Step-by-step guides</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="talk-to-solace"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Meet Solace</h4>
          <p className="text-sm">
            Solace is your personal guide. Click here anytime to ask questions, get help finding resources, or just talk through what you need.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Solace uses simple, friendly language and never judges.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="find-resources"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Find Local Resources</h4>
          <p className="text-sm">
            Search for community services near you - housing, food, healthcare, legal aid, and more.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="support-tools"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Support Tools</h4>
          <p className="text-sm">
            Extra help for everyday challenges:
          </p>
          <ul className="text-sm space-y-1 mt-2">
            <li>• Phone Companion - Prepare for important calls</li>
            <li>• Form Helper - Guidance filling out forms</li>
            <li>• Document Safe Box - Store important files</li>
          </ul>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="resource-categories"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Browse by Category</h4>
          <p className="text-sm">
            Quickly jump to specific types of resources like housing, food, transportation, or legal help.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="my-hub"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Your Personal Hub</h4>
          <p className="text-sm">
            Save resources, create collections, and keep track of what matters to you. Everything you save stays here for easy access.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="organization-section"]',
      content: (
        <div className="space-y-2">
          <h4 className="font-semibold">Connect with Organizations</h4>
          <p className="text-sm">
            If you're working with a community organization, you can connect here to receive their updates, resources, and events.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">You're Ready!</h3>
          <p>
            You now know the basics of BridgePoint. Remember:
          </p>
          <ul className="text-sm space-y-1 mt-2">
            <li>• Click "Talk to Solace" anytime for help</li>
            <li>• Save resources to your hub for later</li>
            <li>• All your information stays private</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Need help? Solace is always here for you.
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);

      if (status === STATUS.FINISHED) {
        toast({
          title: 'Welcome to BridgePoint!',
          description: 'You\'re all set to start exploring.',
        });
      }

      if (onComplete) onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(142 76% 36%)',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: 'hsl(var(--background))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: 'hsl(142 76% 36%)',
          borderRadius: 8,
          padding: '10px 20px',
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
        spotlight: {
          borderRadius: 12,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Get Started',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
