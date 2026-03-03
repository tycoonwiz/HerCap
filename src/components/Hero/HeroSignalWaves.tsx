import React from 'react';
import styles from './HeroSignalWaves.module.css';

interface HeroSignalWavesProps {
  originXPercent?: number;
  originYPercent?: number;
}

export function HeroSignalWaves({
  originXPercent = 22,
  originYPercent = 45
}: HeroSignalWavesProps) {
  const viewBoxWidth = 1000;
  const viewBoxHeight = 600;

  const originX = (viewBoxWidth * originXPercent) / 100;
  const originY = (viewBoxHeight * originYPercent) / 100;

  const rings = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className={styles.heroSignalWaves} aria-hidden="true">
      <svg
        className={styles.waves}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient
            id="ringFade"
            cx={`${originXPercent}%`}
            cy={`${originYPercent}%`}
            r="65%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </radialGradient>
        </defs>

        <g className={styles.ringGroup}>
          {rings.map((n) => (
            <circle
              key={n}
              className={`${styles.ring} ${styles[`r${n}`]}`}
              cx={originX}
              cy={originY}
              r={40}
              style={{
                transformOrigin: `${originX}px ${originY}px`
              }}
            />
          ))}
        </g>

        <rect
          width={viewBoxWidth}
          height={viewBoxHeight}
          fill="url(#ringFade)"
          opacity="0.65"
        />
      </svg>

      <div className={styles.grain} />
    </div>
  );
}
