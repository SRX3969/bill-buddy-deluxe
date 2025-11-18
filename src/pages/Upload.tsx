import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";
import { toast } from "sonner";

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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

  const handleContinue = () => {
    if (file && preview) {
      // Store the image data in sessionStorage for the next page
      sessionStorage.setItem('billImage', preview);
      navigate('/review');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingRupees />
      <Navbar />
      
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Upload Your <span className="text-gradient-gold">Bill</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Take a photo or upload an image of your restaurant bill
            </p>
          </div>

          <div className="card-luxury p-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
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
                    className="max-h-96 mx-auto rounded-lg border border-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    {isDragActive ? (
                      <ImageIcon className="h-8 w-8 text-primary animate-bounce" />
                    ) : (
                      <UploadIcon className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-2">
                      {isDragActive ? 'Drop your bill here' : 'Drag & drop your bill here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-4">
                    Supports JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {file && (
            <div className="flex justify-center animate-fade-in">
              <Button 
                variant="luxury" 
                size="lg" 
                onClick={handleContinue}
                className="min-w-[200px]"
              >
                Continue to Review
              </Button>
            </div>
          )}

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
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
