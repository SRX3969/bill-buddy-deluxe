import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, Image as ImageIcon, Camera } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";
import CameraCapture from "@/components/CameraCapture";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { toast } from "sonner";

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { isMobileOrTablet } = useDeviceDetection();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      toast.success("Bill uploaded successfully!");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
  });

  const handleCameraCapture = (imageData: string) => {
    setPreview(imageData);
    setFile(null); // Clear file since we're using camera
    toast.success("Photo captured successfully!");
  };

  const handleContinue = () => {
    if (preview) {
      // Store the image data in sessionStorage for the next page
      sessionStorage.setItem('billImage', preview);
      navigate('/review');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingRupees />
      <Navbar />
      
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      
      <main className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 pb-20">
        <div className={`mx-auto space-y-8 ${isMobileOrTablet ? 'max-w-2xl' : 'max-w-3xl'}`}>
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Upload Your <span className="text-gradient-gold">Bill</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Take a photo or upload an image of your restaurant bill
            </p>
          </div>

          <div className="card-luxury p-4 sm:p-6 lg:p-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 lg:p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-muted hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <input {...getInputProps()} />
              
              {preview ? (
                <div className="space-y-4">
                  <img 
                    src={preview} 
                    alt="Bill preview" 
                    className="max-h-64 sm:max-h-80 lg:max-h-96 mx-auto rounded-lg border border-muted"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    {isDragActive ? (
                      <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-bounce" />
                    ) : (
                      <UploadIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-medium mb-2">
                      {isDragActive ? 'Drop your bill here' : 'Drag & drop your bill here'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 sm:pt-4">
                    Supports JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Camera Button - Mobile/Tablet Only */}
          {isMobileOrTablet && !preview && (
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Button
                variant="luxury-outline"
                size="lg"
                onClick={() => setShowCamera(true)}
                className="w-full h-12 sm:h-14"
              >
                <Camera className="mr-2 h-5 w-5" />
                Click Picture
              </Button>
            </div>
          )}

          {preview && (
            <div className="flex justify-center animate-fade-in px-4">
              <Button 
                variant="luxury" 
                size="lg" 
                onClick={handleContinue}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Continue to Review
              </Button>
            </div>
          )}

          <div className="text-center pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-success rounded-full"></span>
              Your bill is processed securely and never stored
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;
