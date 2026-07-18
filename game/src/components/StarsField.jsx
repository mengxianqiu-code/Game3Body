export function buildStarsPattern(seed = 0) {
  const stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      r: Math.random() * 0.9 + 0.2,
      o: Math.random() * 0.6 + 0.2,
    });
  }
  return stars;
}

export function StarsField() {
  const stars = buildStarsPattern();
  return (
    <svg
      className="bg-stars"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x.toFixed(1)}
          cy={s.y.toFixed(1)}
          r={s.r.toFixed(2)}
          fill="#e8e6df"
          opacity={s.o.toFixed(2)}
        />
      ))}
    </svg>
  );
}