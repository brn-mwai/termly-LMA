'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './landing.module.css';

export function AudienceSection() {
  const audiences = [
    {
      title: 'For Credit Analysts',
      description: 'Stop copying numbers from PDFs into Excel',
      image: '/Credit analysts.png',
    },
    {
      title: 'For Portfolio Managers',
      description: 'See your entire portfolio at a glance',
      image: '/Portfolio managers.png',
    },
  ];

  return (
    <section id="audience" className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built for loan professionals</h2>
          <p className={styles.sectionDesc}>
            Whether you analyze individual loans or manage entire portfolios, Termly saves you hours every week.
          </p>
        </div>

        <div className={styles.audienceGrid}>
          {audiences.map((audience) => (
            <div key={audience.title} className={styles.audienceCard}>
              <div className={styles.audienceCardText}>
                <h3 className={styles.audienceTitle}>{audience.title}</h3>
                <p className={styles.audienceDesc}>{audience.description}</p>
              </div>
              <div className={styles.audienceCardImage}>
                <Image
                  src={audience.image}
                  alt={audience.title}
                  width={800}
                  height={800}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div className={styles.audienceCardButtons}>
                  <Link href="/sign-in" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
                    Explore
                  </Link>
                  <a href="https://cal.com" target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnOutlineLight} ${styles.btnSm}`}>
                    Book a meeting
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
