'use client';

import Image from 'next/image';

export function PreviewSection() {
  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 2rem 4rem',
    }}>
      <Image
        src="https://framerusercontent.com/images/1ZDZdiL041AZWzfRQT4iedpLeJE.png?scale-down-to=2048"
        alt="Termly Dashboard Preview"
        width={2656}
        height={1472}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: '8px'
        }}
        priority
        unoptimized
      />
    </div>
  );
}
