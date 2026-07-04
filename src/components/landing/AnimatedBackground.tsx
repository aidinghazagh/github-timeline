export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full">
        <div
          className="absolute inset-0 animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(99,102,241,0.1), transparent, rgba(139,92,246,0.1), transparent)',
            animationDuration: '20s',
          }}
        />
      </div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96">
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)',
            animationDuration: '4s',
          }}
        />
      </div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80">
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-15 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)',
            animationDuration: '6s',
            animationDelay: '2s',
          }}
        />
      </div>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
