import type { Locale } from "./locale";

// A graduated scale, not an ornament: three decades of per-request pricing with
// the public devnet demo's real 0.01 USDC setting marked on it.
const DECADES = [0.001, 0.01, 0.1, 1] as const;
const MARKED = 0.01;

// The axis lands on the same left and right terminus as every ruled register
// on the field; in a world made of rules, missing that terminus reads as a slip.
const WIDTH = 480;
const LEFT = 0;
const RIGHT = WIDTH;
const BASELINE = 74;

const copy = {
  en: { caption: "Per-request price", marked: "public demo" },
  es: { caption: "Precio por request", marked: "demo pública" },
  "pt-BR": { caption: "Preço por requisição", marked: "demo pública" },
} as const;

function x(value: number) {
  const span = Math.log10(1) - Math.log10(0.001);
  const position = (Math.log10(value) - Math.log10(0.001)) / span;
  return LEFT + position * (RIGHT - LEFT);
}

export function PriceGraticule({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const minors: number[] = [];
  for (const decade of DECADES.slice(0, -1)) {
    for (let step = 2; step <= 9; step += 1) minors.push(decade * step);
  }

  return (
    <figure className="heroGraticule">
      <svg viewBox={`0 0 ${WIDTH} 108`} role="img" aria-labelledby="grat-title">
        <title id="grat-title">
          {`${text.caption}: 0.001 to 1 USDC, marked at ${MARKED} USDC`}
        </title>
        <line
          className="gratRule"
          x1={LEFT}
          y1={BASELINE}
          x2={RIGHT}
          y2={BASELINE}
        />
        {minors.map((value) => (
          <line
            key={value}
            className="gratMinor"
            x1={x(value)}
            y1={BASELINE}
            x2={x(value)}
            y2={BASELINE - 7}
          />
        ))}
        {DECADES.map((value, index) => (
          <g key={value}>
            <line
              className="gratMajor"
              x1={x(value)}
              y1={BASELINE}
              x2={x(value)}
              y2={BASELINE - 16}
            />
            {/* End labels anchor inward so no glyph overhangs the terminus. */}
            <text
              className="gratLabel"
              x={x(value)}
              y={BASELINE + 18}
              textAnchor={
                index === 0
                  ? "start"
                  : index === DECADES.length - 1
                    ? "end"
                    : "middle"
              }
            >
              {value.toFixed(3)}
            </text>
          </g>
        ))}
        <line
          className="gratMarked"
          x1={x(MARKED)}
          y1={BASELINE}
          x2={x(MARKED)}
          y2={BASELINE - 44}
        />
        <text className="gratMarkedLabel" x={x(MARKED)} y={BASELINE - 52}>
          {MARKED.toFixed(2)} USDC
        </text>
      </svg>
      <figcaption>
        {text.caption} · {text.marked}
      </figcaption>
    </figure>
  );
}
