import React from 'react';

export default function EconzLogo({ size = 36, className = '', style = {} }) {
  return (
    <img
      src="/econz-logo.svg"
      alt="Econz Orbit"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        ...style
      }}
    />
  );
}
