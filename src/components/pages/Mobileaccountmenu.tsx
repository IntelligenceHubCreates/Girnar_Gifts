'use client';

import { useState, type ReactNode } from 'react';
import styles from './AccountPage.module.css';
import { brand } from '@/config/brand';

interface MenuCounts {
  orders: number;
  wishlist: number;
  addresses: number;
  reviews: number;
  pendingReviews: number;
  coupons: number;
}

interface MobileAccountMenuProps {
  profileImage: string | null;
  displayName: string;
  displayEmail: string;
  hasEmail: boolean;
  counts: MenuCounts;
  onNavigate: (tab: string) => void; // reuse AccountPage setTab
  onDashboard: () => void;           // open existing rich dashboard
  onSignOut: () => void;             // reuse AccountPage handleSignOut
}

interface Row {
  key: string;
  label: string;
  desc: string;
  icon: ReactNode;
  bg: string;
  color: string;
  badge?: number;
  isNew?: boolean;
  danger?: boolean;
  onClick?: () => void;
}
interface Section { label: string; rows: Row[]; }

/* ── Icons (stroke-based, match the desktop sidebar) ─────────────── */
const Arrow    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>);
const Verified = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6"><path d="M12 1.6l2.3 1.7 2.85-.27.95 2.7 2.5 1.43-.96 2.74.96 2.74-2.5 1.43-.95 2.7-2.85-.27L12 22.4l-2.3-1.7-2.85.27-.95-2.7-2.5-1.43.96-2.74-.96-2.74 2.5-1.43.95-2.7 2.85.27z" /><polyline points="8.6 12 11 14.3 15.4 9.7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const EditI    = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);
const MailI    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const CloseI   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const GridI    = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
const BagI     = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>);
const HeartI   = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>);
const PinI     = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>);
const TicketI  = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>);
const TrophyI  = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>);
const StarI    = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const BellI    = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
const GearI    = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>);
const HelpI    = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const LogoutI  = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);

export default function MobileAccountMenu({
  profileImage, displayName, displayEmail, hasEmail, counts,
  onNavigate, onDashboard, onSignOut,
}: MobileAccountMenuProps) {
  const initial = (displayName?.[0] || 'U').toUpperCase();
  const [showVerify, setShowVerify] = useState(!hasEmail);

  const sections: Section[] = [
    {
      label: 'Main',
      rows: [
        { key: 'dashboard', label: 'Dashboard', desc: 'Overview & insights',              icon: <GridI />,  bg: '#fff3ee', color: 'var(--gg-primary)', onClick: onDashboard },
        { key: 'orders',    label: 'My Orders', desc: `${counts.orders} order${counts.orders !== 1 ? 's' : ''} placed`, icon: <BagI />, bg: '#eff6ff', color: '#3b82f6', badge: counts.orders, onClick: () => onNavigate('orders') },
        { key: 'wishlist',  label: 'Wishlist',  desc: `${counts.wishlist} item${counts.wishlist !== 1 ? 's' : ''} saved`, icon: <HeartI />, bg: '#fff1f2', color: '#f43f5e', badge: counts.wishlist, onClick: () => onNavigate('wishlist') },
        { key: 'addresses', label: 'Addresses', desc: `${counts.addresses} saved`,         icon: <PinI />,   bg: '#f0fdf4', color: '#10b981', badge: counts.addresses, onClick: () => onNavigate('addresses') },
      ],
    },
    {
      label: 'Rewards',
      rows: [
        { key: 'coupons', label: 'Coupons',          desc: `${counts.coupons} active`,        icon: <TicketI />, bg: '#fffbeb', color: '#f59e0b', badge: counts.coupons, onClick: () => onNavigate('coupons') },
        { key: 'club',    label: `${brand.shortName} Club`, desc: 'Exclusive member perks',   icon: <TrophyI />, bg: '#f5f3ff', color: '#7c3aed', isNew: true, onClick: () => onNavigate('coupons') },
      ],
    },
    {
      label: 'Activity',
      rows: [
        { key: 'reviews',       label: 'My Reviews',    desc: counts.pendingReviews > 0 ? `${counts.pendingReviews} pending` : 'Your reviews', icon: <StarI />, bg: '#faf5ff', color: '#a855f7', badge: counts.pendingReviews, onClick: () => onNavigate('reviews') },
        { key: 'notifications', label: 'Notifications', desc: 'Orders, offers & more',         icon: <BellI />, bg: '#fff7ed', color: 'var(--gg-primary)', onClick: () => onNavigate('notifications') },
      ],
    },
    {
      label: 'Account',
      rows: [
        { key: 'settings', label: 'Settings',       desc: 'Profile & preferences',  icon: <GearI />,   bg: '#f8fafc', color: '#475569', onClick: () => onNavigate('settings') },
        { key: 'help',     label: 'Help & Support', desc: "We're here 24/7",        icon: <HelpI />,   bg: '#f0fdf4', color: '#10b981', onClick: () => onNavigate('help') },
        { key: 'logout',   label: 'Logout',         desc: 'Sign out of your account', icon: <LogoutI />, bg: '#fff1f2', color: '#f43f5e', danger: true, onClick: onSignOut },
      ],
    },
  ];

  return (
    <div className={styles.mobileMenu} role="region" aria-label="Account menu">

      {/* Profile card */}
      <div className={styles.mmProfileCard}>
        <div className={styles.mmAvatarWrap} onClick={() => onNavigate('settings')}>
          {profileImage
            ? <img src={profileImage} alt={displayName} className={styles.mmAvatar} referrerPolicy="no-referrer" />
            : <div className={styles.mmAvatarFallback}>{initial}</div>}
        </div>
        <div className={styles.mmProfileInfo}>
          <div className={styles.mmName}>
            <span className={styles.mmNameText}>{displayName}</span>
            {hasEmail && <span className={styles.mmVerified} title="Verified account"><Verified /></span>}
          </div>
          <div className={styles.mmEmail}>{displayEmail}</div>
          <button type="button" className={styles.mmEditBtn} onClick={() => onNavigate('settings')}>
            <EditI /> Edit Profile
          </button>
        </div>
      </div>

      {/* Verify with email — only when an email is missing */}
      {showVerify && (
        <div className={styles.mmVerifyCard}>
          <span className={styles.mmVerifyIcon}><MailI /></span>
          <div className={styles.mmVerifyBody}>
            <div className={styles.mmVerifyTitle}>Verify with email</div>
            <div className={styles.mmVerifyText}>Use email to log in or recover your account.</div>
            <button type="button" className={styles.mmVerifyCta} onClick={() => onNavigate('settings')}>Add email</button>
          </div>
          <button type="button" className={styles.mmVerifyClose} aria-label="Dismiss" onClick={() => setShowVerify(false)}>
            <CloseI />
          </button>
        </div>
      )}

      {/* Grouped menu — mirrors the desktop sidebar sections */}
      {sections.map(sec => (
        <div key={sec.label} className={styles.mmSection}>
          <div className={styles.mmSectionLabel}>{sec.label}</div>
          <div className={styles.mmCard}>
            {sec.rows.map(r => (
              <button
                key={r.key}
                type="button"
                className={`${styles.mmRow} ${r.danger ? styles.mmRowDanger : ''}`}
                onClick={r.onClick}
              >
                <span className={styles.mmRowIcon} style={{ background: r.bg, color: r.color }}>{r.icon}</span>
                <span className={styles.mmRowBody}>
                  <span className={`${styles.mmRowLabel} ${r.danger ? styles.mmLogoutLabel : ''}`}>{r.label}</span>
                  <span className={styles.mmRowDesc}>{r.desc}</span>
                </span>
                {r.isNew && <span className={styles.mmBadgeNew}>New</span>}
                {typeof r.badge === 'number' && r.badge > 0 && <span className={styles.mmRowBadge}>{r.badge}</span>}
                <span className={styles.mmRowArrow}><Arrow /></span>
              </button>
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}