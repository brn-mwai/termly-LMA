'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './landing.module.css';
import { VideoPopup } from './video-popup';

export function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const openVideo = () => {
    setIsVideoOpen(true);
  };

  const closeVideo = () => {
    setIsVideoOpen(false);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <a
          href="https://pitch.com/v/termly-ai-hm3tqm"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.heroBadge}
        >
          <i className="ph-fill ph-seal-check" style={{ fontSize: '1.125rem' }}></i>
          Learn how Termly works
          <i className="ph ph-arrow-right" style={{ fontSize: '12px' }}></i>
        </a>

        <h1 className={styles.heroTitle}>
          Built for lenders.
          <br />
          <span className={styles.heroTitleHighlight}>Designed for compliance.</span>
        </h1>

        <p className={styles.heroDesc}>
          Stop manually tracking covenants in spreadsheets. Termly automates
          financial extraction, monitors compliance in real-time, and alerts you
          before breaches happen.
        </p>

        <div className={styles.heroButtons}>
          <Link href="/sign-up" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}>
            Start Free Trial
          </Link>
          <button
            className={`${styles.btn} ${styles.btnOutlineDark} ${styles.btnLg}`}
            onClick={openVideo}
          >
            Watch Demo
          </button>
        </div>

        </div>

      <VideoPopup isOpen={isVideoOpen} onClose={closeVideo} />
    </section>
  );
}
