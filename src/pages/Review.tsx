import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Minus } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";
import { toast } from "sonner";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Review = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<BillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate OCR processing
    setTimeout(() => {
      // Mock extracted items
      const mockItems: BillItem[] = [
        { id: '1', name: 'Paneer Butter Masala', price: 220, quantity: 2 },
        { id: '2', name: 'Butter Naan', price: 40, quantity: 4 },
        { id: '3', name: 'Dal Makhani', price: 180, quantity: 1 },
        { id: '4', name: 'Gulab Jamun', price: 80, quantity: 3 },
      ];
      setItems(mockItems);
      setIsLoading(false);
      toast.success("Items extracted successfully!");
    }, 2000);
  }, []);

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
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
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-xl text-muted-foreground">Analyzing your bill...</p>
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
                className="card-luxury p-6 animate-fade-in hover:border-primary/50 transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
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
                      <h3 className="text-lg font-medium">{item.name}</h3>
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
