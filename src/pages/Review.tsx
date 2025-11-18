import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Minus, Lightbulb } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";
import { toast } from "sonner";
import { preprocessImage } from "@/utils/imagePreprocessing";
import { performOCR, ExtractedItem } from "@/utils/ocrEngine";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Review = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    processImage();
  }, []);

  const processImage = async () => {
    try {
      const billImage = sessionStorage.getItem('billImage');
      if (!billImage) {
        toast.error("No bill image found");
        navigate('/upload');
        return;
      }

      // Step 1: Preprocess image
      toast.info("Preprocessing image...");
      const preprocessed = await preprocessImage(billImage, {
        enhanceContrast: true,
        sharpen: true,
        removeBackground: false, // Optional - can be slow
      });

      // Step 2: Perform OCR
      toast.info("Extracting text...");
      const extractedItems = await performOCR(
        preprocessed.dataUrl,
        (progress) => setOcrProgress(progress)
      );

      if (extractedItems.length === 0) {
        toast.warning("No items detected. Please add them manually.");
        // Add empty item for manual entry
        setItems([{
          id: '1',
          name: '',
          price: 0,
          quantity: 1,
          confidence: 100,
        }]);
      } else {
        setItems(extractedItems);
        toast.success(`Extracted ${extractedItems.length} items!`);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error("Failed to process image. Please try again.");
      
      // Fallback to manual entry
      setItems([{
        id: '1',
        name: '',
        price: 0,
        quantity: 1,
        confidence: 100,
      }]);
      setIsLoading(false);
    }
  };

  const updateItem = (id: string, field: keyof ExtractedItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const applySuggestion = (id: string) => {
    setItems(items.map(item => 
      item.id === id && item.suggestion ? { ...item, name: item.suggestion, suggestion: undefined, confidence: 95 } : item
    ));
    toast.success("Suggestion applied!");
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success("Item removed");
  };

  const adjustQuantity = (id: string, delta: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const handleContinue = () => {
    sessionStorage.setItem('billItems', JSON.stringify(items));
    navigate('/add-people');
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <FloatingRupees />
        <Navbar />
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div 
              className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
              style={{ 
                background: `conic-gradient(from 0deg, hsl(var(--primary)) ${ocrProgress}%, transparent ${ocrProgress}%)`
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{ocrProgress}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold">Analyzing your bill...</p>
            <p className="text-sm text-muted-foreground">
              {ocrProgress < 30 && "Preprocessing image..."}
              {ocrProgress >= 30 && ocrProgress < 70 && "Extracting text..."}
              {ocrProgress >= 70 && "Recognizing items..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingRupees />
      <Navbar />
      
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Recognized <span className="text-gradient-gold">Items</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Tap to edit any item or adjust quantities
            </p>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className={`card-luxury p-6 animate-fade-in transition-all ${
                  item.confidence < 70 ? 'border-warning' : 'hover:border-primary/50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  {/* Header with confidence indicator */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {editingId === item.id ? (
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          className="text-lg font-medium"
                        />
                      ) : (
                        <div>
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            {item.name}
                            {item.confidence < 70 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">
                                Low confidence ({item.confidence}%)
                              </span>
                            )}
                          </h3>
                          {item.suggestion && (
                            <button
                              onClick={() => applySuggestion(item.id)}
                              className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              <Lightbulb className="h-4 w-4" />
                              Did you mean "{item.suggestion}"?
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Price:</span>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                            className="w-24 h-8"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Qty:</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustQuantity(item.id, -1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustQuantity(item.id, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className="text-xl font-bold text-primary">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-luxury p-6 bg-primary/5">
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              variant="luxury" 
              size="lg"
              onClick={handleContinue}
              className="min-w-[200px]"
            >
              Continue to Add People
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Review;
