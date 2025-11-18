import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error("Unable to access camera. Please check permissions.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const usePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gradient-gold">
            {capturedImage ? 'Review Photo' : 'Capture Bill'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Camera/Preview Area */}
        <div className="card-luxury p-2 overflow-hidden">
          <div className="relative aspect-[3/4] md:aspect-video bg-black rounded-lg overflow-hidden">
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured bill" 
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {capturedImage ? (
            <>
              <Button
                variant="luxury-outline"
                size="lg"
                onClick={retake}
                className="flex-1 max-w-[200px]"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Retake
              </Button>
              <Button
                variant="luxury"
                size="lg"
                onClick={usePhoto}
                className="flex-1 max-w-[200px]"
              >
                Use Photo
              </Button>
            </>
          ) : (
            <Button
              variant="luxury"
              size="lg"
              onClick={capturePhoto}
              className="min-w-[200px]"
            >
              <Camera className="mr-2 h-5 w-5" />
              Capture
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Make sure the bill is clearly visible and well-lit
        </p>
      </div>
    </div>
  );
};

export default CameraCapture;
