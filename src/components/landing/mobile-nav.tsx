'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const scrollToSection = (id: string) => {
    onClose();
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div
      className={`${styles.mobileNav} ${isOpen ? styles.active : ''}`}
      role="dialog"
      aria-modal="true"
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      <div className={styles.mobileNavHeader}>
        <Link href="/" className={styles.logo} onClick={onClose}>
          <Image
            src="/logo/termly-logo.svg"
            alt="Termly"
            width={70}
            height={20}
          />
        </Link>
        <button
          className={styles.mobileNavClose}
          onClick={onClose}
          aria-label="Close menu"
        >
          <i className="ph ph-x"></i>
        </button>
      </div>

      <nav className={styles.mobileNavLinks}>
        <button
          className={styles.mobileNavLink}
          onClick={() => scrollToSection('features')}
        >
          Features
        </button>
        <button
          className={styles.mobileNavLink}
          onClick={() => scrollToSection('how-it-works')}
        >
          How it works
        </button>
        <button
          className={styles.mobileNavLink}
          onClick={() => scrollToSection('pricing')}
        >
          Pricing
        </button>
      </nav>

      <div className={styles.mobileNavActions}>
        <Link
          href="/sign-in"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={onClose}
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onClose}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
