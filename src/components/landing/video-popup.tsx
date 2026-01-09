'use client';

import { useEffect, useRef } from 'react';
import styles from './landing.module.css';

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPopup({ isOpen, onClose }: VideoPopupProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      document.body.style.overflow = '';
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.videoPopupOverlay} onClick={onClose}>
      <div className={styles.videoPopupContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.videoPopupClose}
          onClick={onClose}
          aria-label="Close video"
        >
          <i className="ph ph-x"></i>
        </button>
        <div className={styles.videoPopupWrapper}>
          <video
            ref={videoRef}
            className={styles.videoPopupVideo}
            controls
            playsInline
            preload="metadata"
          >
            <source src="/demo-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
