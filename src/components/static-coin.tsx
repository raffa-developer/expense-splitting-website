export function StaticCoin({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square ${className}`} aria-hidden="true">
      <div className="absolute inset-0 overflow-hidden rounded-full bg-[#080b10] shadow-[0_30px_90px_rgba(0,0,0,0.7)]" />

      <div
        className="absolute inset-[4%] rounded-full"
        style={{
          background:
            "conic-gradient(from -90deg, #d7dee5 0deg 84deg, #7e8894 84deg 90deg, #aab4bf 90deg 174deg, #717b87 174deg 180deg, #cbd4dc 180deg 264deg, #7e8894 264deg 270deg, #9aa5b0 270deg 354deg, #717b87 354deg 360deg)"
        }}
      />
      <div className="absolute inset-[4%] rounded-full shadow-[inset_0_3px_10px_rgba(255,255,255,0.4),inset_0_-12px_26px_rgba(8,11,16,0.6)]" />

      <div className="absolute inset-[4%] overflow-hidden rounded-full">
        <span className="absolute inset-y-0 left-1/2 w-[2.5%] -translate-x-1/2 bg-[#080b10]" />
        <span className="absolute inset-x-0 top-1/2 h-[2.5%] -translate-y-1/2 bg-[#080b10]" />
      </div>

      <div className="absolute inset-[15%] rounded-full border border-[#080b10]/70" />
      <div className="absolute inset-[19%] rounded-full border border-white/20" />

      <div
        className="absolute inset-[32%] rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 38%, #2b3541, #080b10 74%)",
          boxShadow: "inset 0 0 26px rgba(0,0,0,0.9)"
        }}
      />
      <div
        className="absolute inset-[38%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, #72e1b1, rgba(114,225,177,0.4) 58%, transparent 76%)",
          boxShadow: "0 0 26px rgba(114,225,177,0.45)"
        }}
      />

      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.38), transparent 46%)"
        }}
      />
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_rgba(8,11,16,0.6)]" />
    </div>
  );
}
