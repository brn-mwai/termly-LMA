'use client';

import styles from './landing.module.css';

function UploadVisual() {
  const files = [
    { name: 'Loan_Agreement.pdf', pages: '200 pages', active: true },
    { name: 'Q4_Financials.pdf', pages: '45 pages', active: false },
  ];

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '240px',
      height: '220px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Drop zone */}
      <div style={{
        border: '2px dashed var(--primary-300)',
        borderRadius: '8px',
        padding: '0.75rem',
        background: 'var(--primary-50)',
        textAlign: 'center',
        marginBottom: '0.5rem'
      }}>
        <i className="ph-fill ph-cloud-arrow-up" style={{
          fontSize: '1.25rem',
          color: 'var(--primary-500)',
          display: 'block',
          marginBottom: '0.25rem'
        }}></i>
        <span style={{ fontSize: '0.6875rem', color: 'var(--gray-600)' }}>
          Drop PDF here
        </span>
      </div>
      {/* File list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
        {files.map((file) => (
          <div key={file.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '6px',
            background: file.active ? 'var(--primary-50)' : 'var(--gray-50)',
            border: file.active ? '1px solid var(--primary-300)' : '1px solid transparent'
          }}>
            <i className="ph-fill ph-file-pdf" style={{
              fontSize: '1rem',
              color: file.active ? 'var(--primary-500)' : 'var(--gray-400)'
            }}></i>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray-900)' }}>{file.name}</div>
              <div style={{ fontSize: '0.5625rem', color: 'var(--gray-500)' }}>{file.pages}</div>
            </div>
            {file.active && (
              <i className="ph-fill ph-check-circle" style={{ fontSize: '0.875rem', color: 'var(--primary-500)' }}></i>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtractVisual() {
  const metrics = [
    { label: 'Revenue', value: '$24.5M', confidence: '98%' },
    { label: 'EBITDA', value: '$3.2M', confidence: '96%' },
    { label: 'Total Debt', value: '$8.7M', confidence: '99%' },
  ];

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '0.75rem',
      width: '240px',
      height: '220px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--gray-100)',
        flexShrink: 0
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: 'var(--primary-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <i className="ph-fill ph-robot" style={{ fontSize: '0.75rem', color: 'white' }}></i>
        </div>
        <div>
          <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--gray-900)' }}>AI Extraction</div>
          <div style={{ fontSize: '0.5rem', color: 'var(--primary-600)' }}>Processing...</div>
        </div>
      </div>
      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, paddingTop: '0.5rem' }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.375rem 0.5rem',
            borderRadius: '6px',
            background: 'var(--gray-50)',
            flex: 1
          }}>
            <div>
              <div style={{ fontSize: '0.5rem', color: 'var(--gray-500)' }}>{metric.label}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-900)' }}>{metric.value}</div>
            </div>
            <div style={{
              padding: '0.125rem 0.375rem',
              borderRadius: '4px',
              background: 'var(--primary-50)',
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: 'var(--primary-600)'
            }}>
              {metric.confidence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitorVisual() {
  const covenants = [
    { name: 'Debt/EBITDA', value: '2.8x', limit: '3.5x', status: 'good' },
    { name: 'Interest Coverage', value: '4.2x', limit: '2.0x', status: 'good' },
    { name: 'Current Ratio', value: '1.15x', limit: '1.25x', status: 'warning' },
  ];

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '240px',
      height: '220px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <i className="ph-fill ph-chart-line-up" style={{ fontSize: '0.875rem', color: 'var(--primary-500)' }}></i>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray-900)' }}>Dashboard</span>
        </div>
        <div style={{
          padding: '0.125rem 0.5rem',
          borderRadius: '9999px',
          background: 'var(--primary-50)',
          fontSize: '0.5625rem',
          fontWeight: 600,
          color: 'var(--primary-600)'
        }}>
          2/3 Pass
        </div>
      </div>
      {/* Covenants */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, justifyContent: 'center' }}>
        {covenants.map((cov) => (
          <div key={cov.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '6px',
            background: cov.status === 'warning' ? '#fef3c7' : 'var(--gray-50)',
            border: cov.status === 'warning' ? '1px solid #fcd34d' : '1px solid transparent'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: cov.status === 'good' ? 'var(--primary-500)' : '#f59e0b'
            }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--gray-700)' }}>{cov.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: cov.status === 'good' ? 'var(--primary-600)' : '#b45309' }}>{cov.value}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--gray-400)' }}>Limit: {cov.limit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <p className={styles.sectionDesc}>
            Three steps. That&apos;s it.
          </p>
        </div>

        <div className={styles.stepsContainer}>
          <div className={styles.stepCard}>
            <div className={styles.stepVisual}>
              <UploadVisual />
            </div>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepTitle}>Upload your PDF</div>
            <div className={styles.stepDesc}>Drop in your loan agreement or financial statement.</div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepVisual}>
              <ExtractVisual />
            </div>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepTitle}>AI reads it</div>
            <div className={styles.stepDesc}>Extracts all the numbers with confidence scores you can verify.</div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepVisual}>
              <MonitorVisual />
            </div>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepTitle}>Stay compliant</div>
            <div className={styles.stepDesc}>See your status at a glance. Get alerts if anything changes.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
