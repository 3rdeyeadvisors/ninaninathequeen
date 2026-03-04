import React from 'react';

export const WaterFilter: React.FC = () => {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        <filter id="water-distortion" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.015"
            numOctaves="3"
            result="noise"
            seed="1"
          >
            <animate
              attributeName="baseFrequency"
              values="0.01 0.015; 0.015 0.02; 0.01 0.015"
              dur="8s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="25"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="water-draining" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02 0.04"
            numOctaves="2"
            result="noise"
            seed="2"
          >
            <animate
              attributeName="seed"
              from="1"
              to="100"
              dur="15s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="40"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="splash-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
      </defs>
    </svg>
  );
};
