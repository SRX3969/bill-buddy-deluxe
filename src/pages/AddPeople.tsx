import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingRupees from "@/components/FloatingRupees";
import { toast } from "sonner";

const AddPeople = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<string[]>(['']);

  const addPerson = () => {
    setPeople([...people, '']);
  };

  const removePerson = (index: number) => {
    if (people.length > 1) {
      setPeople(people.filter((_, i) => i !== index));
    }
  };

  const updatePerson = (index: number, value: string) => {
    const updated = [...people];
    updated[index] = value;
    setPeople(updated);
  };

  const handleContinue = () => {
    const validPeople = people.filter(p => p.trim());
    if (validPeople.length < 2) {
      toast.error("Please add at least 2 people");
      return;
    }
    sessionStorage.setItem('people', JSON.stringify(validPeople));
    navigate('/assign');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingRupees />
      <Navbar />
      
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Who's <span className="text-gradient-gold">Sharing?</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Add the names of everyone splitting this bill
            </p>
          </div>

          <div className="card-luxury p-8 space-y-4">
            {people.map((person, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Input
                  value={person}
                  onChange={(e) => updatePerson(index, e.target.value)}
                  placeholder={`Person ${index + 1} name`}
                  className="flex-1 h-12 text-lg border-primary/30 focus:border-primary"
                />
                {people.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePerson(index)}
                    className="h-12 w-12 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="luxury-outline"
              onClick={addPerson}
              className="w-full h-12"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Person
            </Button>
          </div>

          <div className="flex justify-center">
            <Button 
              variant="luxury" 
              size="lg"
              onClick={handleContinue}
              className="min-w-[200px]"
            >
              Continue to Assignment
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddPeople;
