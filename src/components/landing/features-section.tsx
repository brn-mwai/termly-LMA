'use client';

import {
  DocumentExtractionPreview,
  RealtimeMonitoringPreview,
  SmartAlertsPreview,
  CreditMemoPreview,
  TableauIntegrationPreview,
  AuditTrailPreview,
} from './feature-card';
import styles from './landing.module.css';

const FEATURES = [
  {
    title: 'AI Document Reading',
    description:
      'Upload a PDF. AI reads it in 60 seconds and pulls out the numbers you need. No more copying from documents to spreadsheets.',
    preview: <DocumentExtractionPreview />,
  },
  {
    title: 'Portfolio Dashboard',
    description:
      'See all your loans in one place. Green means good, red means attention needed. Know your portfolio status at a glance.',
    preview: <RealtimeMonitoringPreview />,
  },
  {
    title: 'Early Warnings',
    description:
      'Get notified before a covenant breaches, not after. Set your own thresholds and never be caught off guard.',
    preview: <SmartAlertsPreview />,
  },
  {
    title: 'Auto Memos',
    description:
      'Generate compliance memos with one click. Ready for review and sign-off. Save hours on documentation.',
    preview: <CreditMemoPreview />,
  },
  {
    title: 'Tableau Dashboard',
    description:
      'Interactive charts and visualizations. Drill down into any loan or metric. Export reports for stakeholders.',
    preview: <TableauIntegrationPreview />,
  },
  {
    title: 'Full Audit Trail',
    description:
      'Every calculation logged. Every change tracked. Ready for any audit or regulatory review.',
    preview: <AuditTrailPreview />,
  },
];

export function FeaturesSection() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything you need</h2>
          <p className={styles.sectionDesc}>
            From reading documents to generating reports, all in one place.
          </p>
        </div>

        <div className={styles.featureRows}>
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`${styles.featureRow} ${index % 2 === 1 ? styles.featureRowReverse : ''}`}
            >
              <div className={styles.featurePreview}>
                {feature.preview}
              </div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
