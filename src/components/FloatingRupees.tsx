const FloatingRupees = () => {
  const rupees = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 20,
    duration: 15 + Math.random() * 10,
    size: 8 + Math.random() * 4,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {rupees.map((rupee) => (
        <div
          key={rupee.id}
          className="absolute animate-float-up opacity-10 blur-[2px] text-primary"
          style={{
            left: `${rupee.left}%`,
            fontSize: `${rupee.size}px`,
            animationDelay: `${rupee.delay}s`,
            animationDuration: `${rupee.duration}s`,
          }}
        >
          ₹
        </div>
      ))}
    </div>
  );
};

export default FloatingRupees;
