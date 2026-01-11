'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
          Covenant monitoring
          <br />
          <span className={styles.heroTitleHighlight}>in minutes, not hours.</span>
        </h1>

        <p className={styles.heroDesc}>
          Termly extracts covenants from loan documents using AI and monitors compliance in real-time.
          Cut monitoring time from 8 hours to 5 minutes per loan. Catch breaches before they become defaults.
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

      {/* Hero Image */}
      <div className={styles.heroImageContainer}>
        <Image
          src="/Hero section image.png"
          alt="Termly dashboard showing loan covenant monitoring"
          width={1200}
          height={675}
          className={styles.heroImage}
          priority
        />
      </div>

      <VideoPopup isOpen={isVideoOpen} onClose={closeVideo} />
    </section>
  );
}
