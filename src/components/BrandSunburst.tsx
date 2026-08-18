// Éclat décoratif de la charte Diabolo : rayons irréguliers rayonnant d'un centre,
// utilisé en fond à faible opacité pour ajouter de la profondeur sans surcharger.
export function BrandSunburst({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  const spikes = 14;
  const paths = Array.from({ length: spikes }, (_, i) => {
    const angle = (i / spikes) * 360;
    const length = i % 2 === 0 ? 46 : 34;
    const width = 3.5;
    return (
      <rect
        key={i}
        x={-width / 2}
        y={-length}
        width={width}
        height={length}
        rx={width / 2}
        fill={color}
        transform={`rotate(${angle})`}
      />
    );
  });

  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden>
      <g>{paths}</g>
    </svg>
  );
}
