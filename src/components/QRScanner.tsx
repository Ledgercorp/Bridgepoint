import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, AlertCircle, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'error' | 'no-camera';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const QRScanner = ({ open, onClose, onScan }: QRScannerProps) => {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setScannerState('idle');
      setErrorMessage('');
      return;
    }

    const checkCameraPermission = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setScannerState('no-camera');
          setErrorMessage('Camera API not supported on this device');
          return false;
        }

        // Request camera permission
        setScannerState('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        // Stop the stream immediately - we just needed to check permission
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (error) {
        console.error('Camera permission error:', error);

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setScannerState('error');
          setErrorMessage('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setScannerState('no-camera');
          setErrorMessage('No camera found on this device.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setScannerState('error');
          setErrorMessage('Camera is already in use by another application.');
        } else {
          setScannerState('error');
          setErrorMessage('Could not access camera. Please try again.');
        }
        return false;
      }
    };

    const startScanner = async () => {
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) return;

      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Successfully scanned
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Scanning in progress, errors are normal
            console.debug('QR scan error:', errorMessage);
          }
        );

        setScannerState('scanning');
      } catch (error) {
        console.error('Failed to start scanner:', error);
        setScannerState('error');
        setErrorMessage('Failed to initialize scanner. Please try again.');
        toast({
          title: 'Scanner Error',
          description: 'Could not start QR scanner',
          variant: 'destructive',
        });
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
          scannerRef.current = null;
          setScannerState('idle');
        } catch (error) {
          console.error('Error stopping scanner:', error);
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [open, onScan, toast]);

  const handleRetry = () => {
    setScannerState('idle');
    setErrorMessage('');
    // Trigger a re-render to restart the scanner
    window.location.reload();
  };

  const handleClose = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setScannerState('idle');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Organization QR Code
          </DialogTitle>
          <DialogDescription>
            Point your camera at the organization's QR code to connect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Permission Request State */}
          {scannerState === 'requesting' && (
            <div className="p-8 text-center space-y-4">
              <Camera className="h-12 w-12 mx-auto animate-pulse text-primary" />
              <div>
                <p className="font-medium">Requesting Camera Access</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please allow camera access in your browser
                </p>
              </div>
            </div>
          )}

          {/* Scanner Active State */}
          {scannerState === 'scanning' && (
            <>
              <div
                id="qr-reader"
                className="w-full rounded-lg overflow-hidden border-2 border-border"
              />
              <div className="text-center text-sm text-muted-foreground">
                <p>Position the QR code within the frame</p>
              </div>
            </>
          )}

          {/* Error State */}
          {scannerState === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              <div className="p-6 text-center space-y-4 bg-muted/50 rounded-lg">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium mb-2">Camera Access Required</p>
                  <p className="text-sm text-muted-foreground">
                    To scan QR codes, you'll need to:
                  </p>
                  <ol className="text-sm text-muted-foreground text-left mt-3 space-y-1 max-w-sm mx-auto">
                    <li>1. Click the camera/lock icon in your browser's address bar</li>
                    <li>2. Allow camera access for this site</li>
                    <li>3. Refresh the page and try again</li>
                  </ol>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleRetry}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* No Camera State */}
          {scannerState === 'no-camera' && (
            <div className="space-y-4">
              <Alert>
                <CameraOff className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              <div className="p-6 text-center space-y-4 bg-muted/50 rounded-lg">
                <CameraOff className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium mb-2">No Camera Available</p>
                  <p className="text-sm text-muted-foreground">
                    This device doesn't have a camera or it's not supported by your browser.
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    You can still connect by manually entering your organization's connection code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Idle State (initial loading) */}
          {scannerState === 'idle' && (
            <div
              id="qr-reader"
              className="w-full rounded-lg overflow-hidden border-2 border-border min-h-[300px] flex items-center justify-center bg-muted"
            >
              <Camera className="h-12 w-12 text-muted-foreground animate-pulse" />
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            {scannerState === 'no-camera' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
