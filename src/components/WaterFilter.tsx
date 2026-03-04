import React from 'react';

export const WaterFilter: React.FC = () => {
  return (
    <svg className="hidden" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        <filter id="caustics" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.035 0.04" numOctaves="6" result="noise">
            <animate attributeName="baseFrequency" values="0.035 0.04;0.055 0.06;0.035 0.04" dur="5s" repeatCount="indefinite" />
          </feTurbulence>
          <feColorMatrix type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.7  0 0 0 0 1  0 0 0 1.5 -0.3" result="coloredNoise" />
          <feBlend in="SourceGraphic" in2="coloredNoise" mode="screen" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="underwater" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.006" numOctaves="3" result="noise" seed="5">
            <animate attributeName="seed" from="1" to="100" dur="15s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};
