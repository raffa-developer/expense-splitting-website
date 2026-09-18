export function StaticCoin({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square ${className}`}>
      <div
        className="absolute inset-0 rounded-full shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
        style={{
          background:
            "conic-gradient(from -90deg, #4fbfae 0turn 0.4turn, #ff9e72 0.4turn 0.65turn, #a78bfa 0.65turn 0.8turn, #e58270 0.8turn 0.9turn, #6fbfaa 0.9turn 1turn)"
        }}
      />
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_70px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-4 rounded-full border border-white/10" />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.35), transparent 42%)"
        }}
      />
    </div>
  );
}
