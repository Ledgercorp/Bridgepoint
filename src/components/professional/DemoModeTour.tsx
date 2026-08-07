import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useNavigate } from "react-router-dom";

interface DemoModeTourProps {
  isActive: boolean;
  onComplete: () => void;
}

export function DemoModeTour({ isActive, onComplete }: DemoModeTourProps) {
  const [run, setRun] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => setRun(true), 500);
    } else {
      setRun(false);
    }
  }, [isActive]);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Welcome to Demo Mode! 🎉</h3>
          <p>
            You're now exploring Professional Mode with sample data from a fictional organization.
            This is a risk-free way to see how the platform works.
          </p>
          <p className="text-sm text-muted-foreground">
            Note: To use these features with real data, you'll need to purchase Professional Mode.
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-demo-tour="org-stats"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Organization Overview</h3>
          <p>
            Track your team's activity, resource bundles created, and member engagement at a glance.
          </p>
          <p className="text-sm text-accent">Sample data shown here</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: '[data-demo-tour="recent-bundles"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Resource Bundles</h3>
          <p>
            Create curated lists of community resources to share with clients. Each bundle can include multiple resources with custom notes.
          </p>
          <p className="text-sm text-accent">These are example bundles from Harbor Community Services</p>
        </div>
      ),
      placement: "top",
    },
    {
      target: '[data-demo-tour="team-members"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Team Management</h3>
          <p>
            Invite team members, assign roles, and manage your organization's seats. Collaborate seamlessly with your team.
          </p>
          <p className="text-sm text-accent">Sample team members shown</p>
        </div>
      ),
      placement: "top",
    },
    {
      target: '[data-demo-tour="demo-toggle"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Exit Demo Anytime</h3>
          <p>
            You can exit demo mode at any time. Your actual organization data will be preserved.
          </p>
        </div>
      ),
      placement: "left",
    },
    {
      target: "body",
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Ready to Get Started? 🚀</h3>
          <p>
            You've seen what Professional Mode can do. To use these powerful features with your real organization:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Create and share unlimited resource bundles</li>
            <li>Invite and manage team members</li>
            <li>Track team activity and impact</li>
          </ul>
          <p className="font-semibold text-primary pt-2">
            Purchase Professional Mode to unlock full access!
          </p>
        </div>
      ),
      placement: "center",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          arrowColor: "hsl(var(--background))",
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          fontSize: "14px",
          padding: "8px 16px",
          borderRadius: "6px",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          fontSize: "14px",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: "14px",
        },
        tooltip: {
          borderRadius: "8px",
          padding: "16px",
        },
        tooltipContent: {
          padding: "8px 0",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Get Started",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
