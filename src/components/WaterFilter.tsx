import React from 'react';

export const WaterFilter: React.FC = () => {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        {/* Classic goo filter for droplets */}
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

        {/* Surface of the draining water body */}
        <filter id="water-surface" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.008"
            numOctaves="4"
            result="noise"
          >
            <animate
              attributeName="seed"
              from="1"
              to="50"
              dur="12s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Light caustic shimmer inside the water */}
        <filter id="caustics">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.04"
            numOctaves="6"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values="0.04;0.06;0.04"
              dur="4s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix type="saturate" values="3" result="saturatedNoise" />
          <feBlend in="SourceGraphic" in2="saturatedNoise" mode="screen" />
        </filter>

        {/* Ripple rings after splash */}
        <filter id="ripple">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.065 0.065"
            numOctaves="1"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};
