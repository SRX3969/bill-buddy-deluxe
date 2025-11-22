import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PersonSummary {
  name: string;
  items: { name: string; quantity: number; amount: number }[];
  subtotal: number;
  tax: number;
  total: number;
}

const Summary = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<PersonSummary[]>([]);

  useEffect(() => {
    const storedItems = sessionStorage.getItem('billItems');
    const storedPeople = sessionStorage.getItem('people');
    const storedAssignments = sessionStorage.getItem('assignments');

    if (!storedItems || !storedPeople || !storedAssignments) {
      navigate('/upload');
      return;
    }

    const items: BillItem[] = JSON.parse(storedItems);
    const people: string[] = JSON.parse(storedPeople);
    const assignments = JSON.parse(storedAssignments);

    // Calculate per person
    const taxRate = 0.18; // 18% tax
    const calculatedSummaries: PersonSummary[] = people.map(person => {
      const personItems: { name: string; quantity: number; amount: number }[] = [];
      let subtotal = 0;

      items.forEach(item => {
        const qty = assignments[item.id]?.[person] || 0;
        if (qty > 0) {
          const amount = (item.price / item.quantity) * qty;
          personItems.push({
            name: item.name,
            quantity: qty,
            amount,
          });
          subtotal += amount;
        }
      });

      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      return {
        name: person,
        items: personItems,
        subtotal,
        tax,
        total,
      };
    });

    setSummaries(calculatedSummaries);
  }, [navigate]);

  const handleDownload = () => {
    const content = summaries.map(s => 
      `${s.name}\n` +
      s.items.map(i => `  ${i.name} x${i.quantity}: ₹${i.amount.toFixed(2)}`).join('\n') +
      `\n  Subtotal: ₹${s.subtotal.toFixed(2)}\n  Tax: ₹${s.tax.toFixed(2)}\n  Total: ₹${s.total.toFixed(2)}\n\n`
    ).join('---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bill-split-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewBill = () => {
    sessionStorage.clear();
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingRupees />
      <Navbar />
      
      <main className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Your Split <span className="text-gradient-gold">Summary</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Here's how the bill is split between everyone
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {summaries.map((summary, index) => (
              <div 
                key={summary.name}
                className="card-luxury p-4 sm:p-6 space-y-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="border-b border-muted pb-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gradient-gold">{summary.name}</h2>
                </div>

                <div className="space-y-2">
                  {summary.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">
                        {item.name} ×{item.quantity}
                      </span>
                      <span className="font-medium">₹{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-muted pt-3 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Tax (18%)</span>
                    <span className="font-medium">₹{summary.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-muted">
                    <span>Total</span>
                    <span className="text-primary">₹{summary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button 
              variant="luxury" 
              size="lg"
              onClick={handleDownload}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Summary
            </Button>
            <Button 
              variant="luxury-outline" 
              size="lg"
              onClick={handleNewBill}
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-5 w-5" />
              Start New Bill
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Summary;
