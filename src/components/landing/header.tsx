'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';

interface HeaderProps {
  onMobileMenuClick: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Banner height is 42px
      setIsScrolled(window.scrollY > 42);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
      <div className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo/termly-logo.svg"
              alt="Termly"
              width={160}
              height={44}
              className={styles.logoImg}
              priority
            />
          </Link>
        </div>

        <nav className={styles.desktopNav}>
          <button
            className={styles.navLink}
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
          <button
            className={styles.navLink}
            onClick={() => scrollToSection('how-it-works')}
          >
            How it works
          </button>
          <button
            className={styles.navLink}
            onClick={() => scrollToSection('pricing')}
          >
            Pricing
          </button>
        </nav>

        <div className={styles.navActions}>
          <Link href="/sign-in" className={`${styles.btn} ${styles.btnGhost}`}>
            Sign in
          </Link>
          <Link href="/sign-up" className={`${styles.btn} ${styles.btnBlack}`}>
            Get Started
          </Link>
        </div>

        <button
          className={styles.mobileMenuBtn}
          onClick={onMobileMenuClick}
          aria-label="Open menu"
        >
          <i className="ph ph-list"></i>
        </button>
      </div>
    </header>
  );
}
