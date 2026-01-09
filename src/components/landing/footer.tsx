'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerLogo}>
          <Image
            src="/logo/termly-logo.svg"
            alt="Termly"
            width={80}
            height={26}
            className={styles.footerLogoImg}
          />
        </div>

        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            Terms of Service
          </Link>
          <Link href="/support" className={styles.footerLink}>
            Support
          </Link>
        </div>

        <div className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Termly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
