'use client';

import Link from 'next/link';
import styles from './landing.module.css';

export function PricingSection() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Try it out',
      features: [
        'Up to 5 loans',
        '10 document uploads/month',
        'Basic dashboard',
        'Email alerts',
      ],
      cta: 'Start free',
      href: '/sign-up',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$299',
      period: '/month',
      description: 'For most teams',
      features: [
        'Up to 100 loans',
        'Unlimited uploads',
        'Tableau dashboard',
        'Auto memo generation',
        'Priority support',
      ],
      cta: 'Start free trial',
      href: '/sign-up',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large teams',
      features: [
        'Unlimited loans',
        'Custom integrations',
        'SSO login',
        'Dedicated support',
        'On-premise option',
      ],
      cta: 'Contact us',
      href: '/contact',
      featured: false,
    },
  ];

  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <p className={styles.sectionDesc}>
            Start free. Scale as your portfolio grows.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`${styles.pricingCard} ${plan.featured ? styles.pricingCardFeatured : ''}`}
            >
              {plan.featured && (
                <div className={styles.pricingFeaturedBadge}>Most Popular</div>
              )}
              <h3 className={styles.pricingName}>{plan.name}</h3>
              <div className={styles.pricingPrice}>
                {plan.price}
                {plan.period && (
                  <span className={styles.pricingPeriod}>{plan.period}</span>
                )}
              </div>
              <p className={styles.pricingDesc}>{plan.description}</p>

              <ul className={styles.pricingFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature} className={styles.pricingFeature}>
                    <i className="ph-bold ph-check" style={{ color: 'var(--primary-500)' }}></i>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`${styles.btn} ${styles.btnLg} ${
                  plan.featured ? styles.btnPrimary : styles.btnOutline
                }`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
