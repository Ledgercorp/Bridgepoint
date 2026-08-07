import bridgepointLogo from "@/assets/bridgepoint-logo.png";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <img
          src={bridgepointLogo}
          alt="BridgePoint"
          className="h-24 w-auto"
        />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};
