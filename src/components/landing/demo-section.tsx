"use client";

import {
  ChartLine,
  Bell,
  FileText,
  Bank,
  House,
  Gear,
  Desktop,
} from "@phosphor-icons/react";
import styles from "./landing.module.css";

export function DemoSection() {
  const navItems = [
    { icon: House, label: "Dashboard", active: true },
    { icon: Bank, label: "Loans", active: false },
    { icon: FileText, label: "Documents", active: false },
    { icon: ChartLine, label: "Reports", active: false },
    { icon: Bell, label: "Alerts", active: false, badge: "3" },
  ];

  const stats = [
    { label: "Total Loans", value: "127" },
    { label: "Breaches", value: "3", color: "#ef4444", badge: "Action Required", badgeColor: "#fef2f2", badgeText: "#ef4444" },
    { label: "At Risk", value: "6", color: "#f59e0b", badge: "Monitor", badgeColor: "#fffbeb", badgeText: "#f59e0b" },
    { label: "Compliant", value: "118", color: "#17A417", badge: "Healthy", badgeColor: "#f0fdf4", badgeText: "#17A417" },
  ];

  const tableRows = [
    { borrower: "Acme Manufacturing Ltd", status: "Breach", statusBg: "#fef2f2", statusColor: "#dc2626", date: "15 Jan", exposure: "$12.5M" },
    { borrower: "GlobalTech Industries", status: "At Risk", statusBg: "#fffbeb", statusColor: "#d97706", date: "22 Jan", exposure: "$8.2M" },
    { borrower: "Summit Holdings PLC", status: "Compliant", statusBg: "#f0fdf4", statusColor: "#17A417", date: "01 Feb", exposure: "$24.0M" },
  ];

  return (
    <section id="demo" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>
            <Desktop size={16} weight="fill" />
            Product
          </div>
          <h2 className={styles.sectionTitle}>See Termly in action</h2>
          <p className={styles.sectionDesc}>
            A unified dashboard for your entire loan portfolio. Track covenants,
            manage documents, and stay compliant.
          </p>
        </div>

        <div className={styles.demoContainer}>
          <div className={styles.demoBrowser}>
            <div className={styles.demoDots}>
              <div className={`${styles.demoDot} ${styles.demoDotRed}`} />
              <div className={`${styles.demoDot} ${styles.demoDotYellow}`} />
              <div className={`${styles.demoDot} ${styles.demoDotGreen}`} />
            </div>
            <div className={styles.demoUrl}>
              <div className={styles.demoUrlBar}>app.termly.com/dashboard</div>
            </div>
          </div>

          <div className={styles.demoContent}>
            <div className={styles.demoSidebar}>
              <div className={styles.demoSidebarLogo}>
                <div className={styles.demoSidebarIcon}>
                  <ChartLine size={16} weight="bold" />
                </div>
                <span className={styles.demoSidebarTitle}>Termly</span>
              </div>
              <nav className={styles.demoNav}>
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className={`${styles.demoNavItem} ${item.active ? styles.demoNavItemActive : ""}`}
                  >
                    <item.icon size={16} />
                    {item.label}
                    {item.badge && (
                      <span className={styles.demoNavBadge}>{item.badge}</span>
                    )}
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #e4e4e7", marginTop: "1rem", paddingTop: "1rem" }}>
                  <div className={styles.demoNavItem}>
                    <Gear size={16} />
                    Settings
                  </div>
                </div>
              </nav>
            </div>

            <div className={styles.demoMain}>
              <div className={styles.demoStats}>
                {stats.map((stat) => (
                  <div key={stat.label} className={styles.demoStat}>
                    <div className={styles.demoStatValue} style={{ color: stat.color || "#18181b" }}>
                      {stat.value}
                    </div>
                    <div className={styles.demoStatLabel}>{stat.label}</div>
                    {stat.badge && (
                      <div
                        className={styles.demoStatBadge}
                        style={{ background: stat.badgeColor, color: stat.badgeText }}
                      >
                        {stat.badge}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.demoTable}>
                <div className={styles.demoTableHeader}>
                  <div>Borrower</div>
                  <div>Status</div>
                  <div>Next Test</div>
                  <div>Exposure</div>
                  <div>Action</div>
                </div>
                {tableRows.map((row) => (
                  <div key={row.borrower} className={styles.demoTableRow}>
                    <div className={styles.demoTableBorrower}>{row.borrower}</div>
                    <div>
                      <span
                        className={styles.demoTableStatus}
                        style={{ background: row.statusBg, color: row.statusColor }}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div style={{ color: "#71717a" }}>{row.date}</div>
                    <div style={{ fontWeight: 500 }}>{row.exposure}</div>
                    <div className={styles.demoTableLink}>View →</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
