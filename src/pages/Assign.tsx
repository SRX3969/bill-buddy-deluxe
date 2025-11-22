import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";
import { toast } from "sonner";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Assignment {
  [personName: string]: number;
}

const Assign = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<BillItem[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<{ [itemId: string]: Assignment }>({});

  useEffect(() => {
    const storedItems = sessionStorage.getItem('billItems');
    const storedPeople = sessionStorage.getItem('people');

    if (!storedItems || !storedPeople) {
      toast.error("Missing data. Redirecting...");
      navigate('/upload');
      return;
    }

    const parsedItems = JSON.parse(storedItems);
    const parsedPeople = JSON.parse(storedPeople);

    setItems(parsedItems);
    setPeople(parsedPeople);

    // Initialize assignments
    const initialAssignments: { [itemId: string]: Assignment } = {};
    parsedItems.forEach((item: BillItem) => {
      initialAssignments[item.id] = {};
      parsedPeople.forEach((person: string) => {
        initialAssignments[item.id][person] = 0;
      });
    });
    setAssignments(initialAssignments);
  }, [navigate]);

  const updateAssignment = (itemId: string, person: string, qty: number) => {
    setAssignments(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [person]: qty,
      },
    }));
  };

  const getTotalAssigned = (itemId: string) => {
    return Object.values(assignments[itemId] || {}).reduce((sum, qty) => sum + qty, 0);
  };

  const isOverAssigned = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? getTotalAssigned(itemId) > item.quantity : false;
  };

  const handleCalculate = () => {
    // Validate all items are fully assigned
    let hasErrors = false;
    items.forEach(item => {
      const assigned = getTotalAssigned(item.id);
      if (assigned !== item.quantity) {
        hasErrors = true;
        toast.error(`${item.name}: Assigned ${assigned}/${item.quantity} quantities`);
      }
    });

    if (hasErrors) return;

    sessionStorage.setItem('assignments', JSON.stringify(assignments));
    navigate('/summary');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingRupees />
      <Navbar />
      
      <main className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Assign <span className="text-gradient-gold">Items</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Assign quantities to each person for every item
            </p>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className={`card-luxury p-4 sm:p-6 animate-fade-in transition-all ${
                  isOverAssigned(item.id) ? 'border-warning' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="w-full sm:w-auto">
                      <h3 className="text-lg sm:text-xl font-semibold">{item.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <p className="text-xs sm:text-sm text-muted-foreground">Assigned</p>
                      <p className={`text-base sm:text-lg font-bold ${
                        isOverAssigned(item.id) ? 'text-warning' : 
                        getTotalAssigned(item.id) === item.quantity ? 'text-success' : 
                        'text-primary'
                      }`}>
                        {getTotalAssigned(item.id)} / {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                    {people.map((person) => (
                      <div key={person} className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium">{person}</label>
                        <Select
                          value={assignments[item.id]?.[person]?.toString() || '0'}
                          onValueChange={(value) => updateAssignment(item.id, person, parseInt(value))}
                        >
                          <SelectTrigger className="border-primary/30 h-9 sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: item.quantity + 1 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  {isOverAssigned(item.id) && (
                    <p className="text-xs sm:text-sm text-warning flex items-center gap-2">
                      <span>⚠️</span>
                      Total assigned quantity exceeds available quantity
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center px-4">
            <Button 
              variant="luxury" 
              size="lg"
              onClick={handleCalculate}
              className="w-full sm:w-auto min-w-[200px]"
            >
              Calculate Split
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Assign;
