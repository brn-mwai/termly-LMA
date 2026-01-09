'use client';

import { useState, useEffect } from 'react';
import styles from './landing.module.css';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      className={`${styles.backToTop} ${isVisible ? styles.backToTopVisible : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <i className="ph-bold ph-arrow-up"></i>
    </button>
  );
}
