'use client';

import styles from './landing.module.css';

export function Banner() {
  return (
    <div className={styles.banner} style={{
      background: '#07301E',
      color: 'white',
      padding: '0.625rem 1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }}>
      <i className="ph ph-trophy" style={{ fontSize: '14px', color: '#DDFFB3' }}></i>
      <span style={{ color: 'white' }}>
        Built for
      </span>
      <a
        href="https://lmaedgehackathon.devpost.com/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'white',
          fontWeight: 500,
          textDecoration: 'underline'
        }}
      >
        LMA EDGE Hackathon 2026
      </a>
    </div>
  );
}
