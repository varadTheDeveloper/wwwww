// The hero's bottom edge, drawn like the scalloped hem of a toran with pearl tassels.
// One tile is 120 units wide; the tassel sits on the tile seam so adjacent tiles complete it.
const W = 120;
const H = 104;
const SCALE = 1.4;

function cubic(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

const pearls = [];
for (let i = 1; i < 12; i++) {
  const t = i / 12;
  // left half of scallop: (0,12) -> (60,44), right half mirrored
  if (t <= 0.5) {
    const s = t * 2;
    pearls.push([cubic(s, 0, 0, 24, 60), cubic(s, 12, 34, 44, 44)]);
  } else {
    const s = (t - 0.5) * 2;
    pearls.push([cubic(s, 60, 96, 120, 120), cubic(s, 44, 44, 34, 12)]);
  }
}

function Tassel({ x }) {
  return (
    <g className="tassel">
      <line x1={x} y1="10" x2={x} y2="46" stroke="#B8945A" strokeWidth="1" />
      <circle cx={x} cy="50" r="3" fill="url(#pearl)" />
      <circle cx={x} cy="57" r="3" fill="url(#pearl)" />
      <circle cx={x} cy="64" r="3" fill="url(#pearl)" />
      <path d={`M${x - 3.2} 70 h6.4 l1.2 3 h-8.8z`} fill="#C9A86A" />
      <circle cx={x} cy="79" r="5.2" fill="url(#pearl)" />
      {[-4, -2, 0, 2, 4].map((dx) => (
        <g key={dx}>
          <line x1={x + dx * 0.5} y1="84" x2={x + dx} y2={98 + Math.abs(dx) * -0.6} stroke="#C9A86A" strokeWidth="0.6" />
          <circle cx={x + dx} cy={100 - Math.abs(dx) * 0.6} r="1.6" fill="url(#pearl)" />
        </g>
      ))}
    </g>
  );
}

export default function ToranEdge({ id = 'toran' }) {
  return (
    <div className="toran-edge" aria-hidden="true">
      <svg width="100%" height={H * SCALE}>
        <defs>
          <radialGradient id="pearl" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#FFFDF7" />
            <stop offset="0.55" stopColor="#EFE4CC" />
            <stop offset="1" stopColor="#B99D6C" />
          </radialGradient>
          <pattern id={id} width={W} height={H} patternUnits="userSpaceOnUse" patternTransform={`scale(${SCALE})`}>
            <path d="M0 0H120V12C120 34 96 44 60 44C24 44 0 34 0 12Z" fill="#012D36" />
            <path d="M0 12C0 34 24 44 60 44C96 44 120 34 120 12" fill="none" stroke="#C9A86A" strokeWidth="0.8" />
            {pearls.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py + 2.4} r="1.7" fill="url(#pearl)" />
            ))}
            <Tassel x={0} />
            <Tassel x={W} />
          </pattern>
        </defs>
        <rect width="100%" height={H * SCALE} fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
