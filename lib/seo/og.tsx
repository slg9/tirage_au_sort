import { Locale, t } from "@/lib/i18n";

const segmentColors = ["#d946ef", "#7c3aed", "#06b6d4", "#fbbf24", "#fb7185", "#4f46e5"];

function WheelMark({ size = 250 }: { size?: number }) {
  const center = size / 2;
  const radius = size * 0.38;
  const wedgePath = (index: number) => {
    const start = -90 + index * 60;
    const end = start + 60;
    const startRad = (Math.PI / 180) * start;
    const endRad = (Math.PI / 180) * end;
    const x1 = center + Math.cos(startRad) * radius;
    const y1 = center + Math.sin(startRad) * radius;
    const x2 = center + Math.cos(endRad) * radius;
    const y2 = center + Math.sin(endRad) * radius;
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius + 18} fill="#fbbf24" opacity="0.95" />
      <circle cx={center} cy={center} r={radius + 9} fill="#11112d" />
      {segmentColors.map((color, index) => (
        <path key={color} d={wedgePath(index)} fill={color} />
      ))}
      <circle cx={center} cy={center} r={34} fill="#0a0a1a" stroke="#fbbf24" strokeWidth="8" />
      <circle cx={center} cy={center} r={12} fill="#fbbf24" />
      <path
        d={`M ${center - 26} ${center - radius - 52} L ${center + 26} ${center - radius - 52} L ${center} ${center - radius - 10} Z`}
        fill="#fbbf24"
      />
    </svg>
  );
}

export function OgArtwork({ locale }: { locale: Locale }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0a0a1a 0%, #1e1b4b 54%, #4c1d95 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: 260,
          background: "rgba(217, 70, 239, 0.28)",
          left: -120,
          top: 120,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: 180,
          background: "rgba(251, 191, 36, 0.18)",
          right: -70,
          top: -80,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 62,
          width: 1040,
          position: "relative",
        }}
      >
        <WheelMark />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 94,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 0,
              lineHeight: 1,
            }}
          >
            Wheel<span style={{ color: "#fbbf24" }}>Draw</span>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 640,
              fontSize: 34,
              lineHeight: 1.22,
              color: "#e2e8f0",
            }}
          >
            {t("brand.tagline", locale)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 24,
              color: "#f8fafc",
            }}
          >
            <span style={{ color: "#fbbf24" }}>Multi-cycle</span>
            <span style={{ color: "#94a3b8" }}>•</span>
            <span>Drag & drop</span>
            <span style={{ color: "#94a3b8" }}>•</span>
            <span>Fullscreen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
