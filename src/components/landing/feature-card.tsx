'use client';

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import styles from './landing.module.css';

export interface FeatureCardProps {
  title: string;
  description: string;
  preview: React.ReactNode;
}

export function FeatureCard({ title, description, preview }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featurePreview}>{preview}</div>
      <div className={styles.featureContent}>
        <div className={styles.featureTitle}>{title}</div>
        <div className={styles.featureDesc}>{description}</div>
      </div>
    </div>
  );
}

// -------------------- Feature Preview Components --------------------

export function DocumentExtractionPreview() {
  const [activeDoc, setActiveDoc] = useState(0);
  const docs = [
    { icon: 'ph-file-text', label: 'Q4 Financials', status: 'Extracted' },
    { icon: 'ph-chart-bar', label: 'Balance Sheet', status: 'Extracted' },
    { icon: 'ph-currency-dollar', label: 'Income Statement', status: 'Processing' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDoc((prev) => (prev + 1) % docs.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      {docs.map((doc, i) => (
        <div
          key={doc.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: i === activeDoc ? 'var(--primary-50)' : 'var(--gray-50)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: i === activeDoc ? 'var(--primary-500)' : 'var(--gray-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}>
            <i className={`ph-fill ${doc.icon}`} style={{
              fontSize: '1rem',
              color: i === activeDoc ? 'white' : 'var(--gray-500)'
            }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: i === activeDoc ? 600 : 500,
              color: i === activeDoc ? 'var(--gray-900)' : 'var(--gray-600)',
              display: 'block'
            }}>
              {doc.label}
            </span>
          </div>
          {doc.status === 'Extracted' && (
            <i className="ph-fill ph-check-circle" style={{
              fontSize: '1rem',
              color: 'var(--primary-500)'
            }}></i>
          )}
        </div>
      ))}
    </div>
  );
}

export function RealtimeMonitoringPreview() {
  const [values, setValues] = useState([2.8, 4.2, 1.15, 1.8]);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev => prev.map(v => {
        const change = (Math.random() - 0.5) * 0.2;
        return Math.max(0.5, Math.min(5, v + change));
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { name: 'D/EBITDA', limit: 3.5 },
    { name: 'Int. Cov.', limit: 2.0 },
    { name: 'Curr. Ratio', limit: 1.25 },
    { name: 'Fix. Chg.', limit: 1.2 },
  ];

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <i className="ph-fill ph-chart-line-up" style={{ fontSize: '1rem', color: 'var(--primary-500)' }}></i>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Live Metrics
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {metrics.map((metric, i) => {
          const isCompliant = metric.name === 'D/EBITDA' ? values[i] < metric.limit : values[i] > metric.limit;
          return (
            <div key={metric.name} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: 'var(--gray-50)'
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray-700)' }}>{metric.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isCompliant ? 'var(--primary-600)' : '#b45309'
                }}>
                  {values[i].toFixed(1)}x
                </span>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isCompliant ? 'var(--primary-500)' : '#f59e0b'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SmartAlertsPreview() {
  const [alerts] = useState([
    { type: 'warning', text: 'Current Ratio approaching limit' },
    { type: 'info', text: 'New documents received' },
    { type: 'success', text: 'All covenants compliant' },
  ]);

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <i className="ph-fill ph-bell-ringing" style={{ fontSize: '1rem', color: 'var(--primary-500)' }}></i>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-900)' }}>
          Smart Alerts
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.map((alert, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '8px',
            background: alert.type === 'warning' ? '#fef3c7' : 'var(--primary-50)'
          }}>
            <i className={`ph-fill ${alert.type === 'warning' ? 'ph-warning' : alert.type === 'info' ? 'ph-info' : 'ph-check-circle'}`} style={{
              fontSize: '0.875rem',
              color: alert.type === 'warning' ? '#b45309' : 'var(--primary-600)'
            }}></i>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-700)' }}>{alert.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreditMemoPreview() {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <i className="ph-fill ph-file-doc" style={{ fontSize: '1rem', color: 'var(--primary-500)' }}></i>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Credit Memo
        </span>
      </div>
      <div style={{
        background: 'var(--gray-50)',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Borrower</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-900)' }}>Acme Corp</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Period</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-900)' }}>Q4 2024</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Status</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)' }}>Compliant</span>
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.625rem',
        background: 'var(--primary-500)',
        borderRadius: '8px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: 'white'
      }}>
        <i className="ph ph-export" style={{ fontSize: '0.875rem' }}></i>
        Generate PDF
      </div>
    </div>
  );
}

export function TableauIntegrationPreview() {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <i className="ph-fill ph-chart-pie-slice" style={{ fontSize: '1rem', color: 'var(--primary-500)' }}></i>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Analytics
        </span>
      </div>
      {/* Mini chart visualization */}
      <div style={{
        height: '80px',
        background: 'var(--gray-50)',
        borderRadius: '8px',
        padding: '0.75rem',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.375rem',
        marginBottom: '0.5rem'
      }}>
        {[60, 45, 70, 55, 80, 65, 75].map((h, i) => (
          <div key={i} style={{
            flex: 1,
            height: `${h}%`,
            background: `var(--primary-${i === 6 ? '500' : '200'})`,
            borderRadius: '3px',
            transition: 'height 0.3s ease'
          }}></div>
        ))}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--gray-500)'
      }}>
        <span>Portfolio trend</span>
        <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>+12%</span>
      </div>
    </div>
  );
}

export function AuditTrailPreview() {
  const [events] = useState([
    { action: 'Approved', user: 'J. Smith', time: '2m ago' },
    { action: 'Calculated', user: 'System', time: '5m ago' },
    { action: 'Uploaded', user: 'M. Jones', time: '1h ago' },
  ]);

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <i className="ph-fill ph-shield-check" style={{ fontSize: '1rem', color: 'var(--primary-500)' }}></i>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Audit Log
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {events.map((event, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            background: 'var(--gray-50)'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--primary-500)'
            }}></div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gray-700)', flex: 1 }}>{event.action}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)' }}>{event.time}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--primary-50)',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: 'var(--primary-600)',
        textAlign: 'center',
        fontWeight: 500
      }}>
        Full compliance history
      </div>
    </div>
  );
}

export function MontyAssistantPreview() {
  const [messages] = useState([
    { role: 'user', text: 'Which loans are in breach?' },
    { role: 'assistant', text: '2 loans need attention: Acme Corp and TechStart have leverage ratio breaches.' },
  ]);

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: '12px',
      padding: '1rem',
      width: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {/* Header with Monty */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--gray-100)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <DotLottieReact
            src="https://lottie.host/4b389c28-a4ce-45a2-874f-ad136a763d03/0r03GIKCXg.lottie"
            autoplay
            loop
            style={{ width: '100%', height: '100%', transform: 'scale(1.1)' }}
          />
        </div>
        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-900)', display: 'block' }}>
            Monty
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            Your covenant assistant
          </span>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '0.625rem 0.875rem',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: msg.role === 'user' ? 'var(--primary-500)' : 'var(--gray-100)',
              color: msg.role === 'user' ? 'white' : 'var(--gray-700)',
              fontSize: '0.8125rem',
              lineHeight: 1.4
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input hint */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--gray-50)',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: 'var(--gray-400)'
      }}>
        <i className="ph ph-chat-dots" style={{ fontSize: '0.875rem' }}></i>
        Ask about your portfolio...
      </div>
    </div>
  );
}
