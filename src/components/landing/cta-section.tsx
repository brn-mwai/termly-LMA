'use client';

import Link from 'next/link';
import styles from './landing.module.css';

export function CTASection() {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaInner}>
        <h2 className={styles.ctaTitle}>Stop copying numbers from PDFs</h2>
        <p className={styles.ctaDesc}>
          Try Termly free. See how much time you save.
        </p>
        <div className={styles.ctaButtons}>
          <Link href="/sign-up" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}>
            Start Free Trial
          </Link>
        </div>
      </div>
    </section>
  );
}
