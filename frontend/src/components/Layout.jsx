import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/authStateContext';
import { Shield, ShieldAlert, FileText, LogOut, Megaphone, BookOpen, CalendarOff, Award, BarChart3, ScrollText, UsersRound, UserRound, Bell, Settings, ClipboardCheck, Dumbbell, Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return [{ to: '/admin', icon: ShieldAlert, label: t('nav.dashboard') }, { to: '/subjects', icon: BookOpen, label: 'Subjects' }, { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' }, { to: '/academics', icon: Award, label: 'Academics' }, { to: '/physical', icon: Dumbbell, label: 'Physical Training' }, { to: '/notices', icon: Megaphone, label: t('nav.notices') }, { to: '/notes', icon: BookOpen, label: t('nav.notes') }, { to: '/results', icon: Award, label: t('nav.results') }, { to: '/leaves', icon: CalendarOff, label: t('nav.leave') }, { to: '/notifications', icon: Bell, label: t('nav.notifications') }, { to: '/settings', icon: Settings, label: t('nav.settings') }, { to: '/reports', icon: BarChart3, label: t('nav.reports') }, { to: '/audit-logs', icon: ScrollText, label: t('nav.audit') }];
      case 'commander':
        return [{ to: '/commander', icon: Shield, label: t('nav.dashboard') }, { to: '/admins', icon: UsersRound, label: t('nav.admins') }, { to: '/admin', icon: UsersRound, label: 'Cadet management' }, { to: '/subjects', icon: BookOpen, label: 'Subjects' }, { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' }, { to: '/academics', icon: Award, label: 'Academics' }, { to: '/physical', icon: Dumbbell, label: 'Physical Training' }, { to: '/notices', icon: Megaphone, label: t('nav.notices') }, { to: '/notes', icon: BookOpen, label: t('nav.notes') }, { to: '/results', icon: Award, label: t('nav.results') }, { to: '/leaves', icon: CalendarOff, label: t('nav.leave') }, { to: '/notifications', icon: Bell, label: t('nav.notifications') }, { to: '/settings', icon: Settings, label: t('nav.settings') }, { to: '/reports', icon: BarChart3, label: t('nav.reports') }, { to: '/audit-logs', icon: ScrollText, label: t('nav.audit') }];
      case 'cadet':
        return [{ to: '/cadet', icon: FileText, label: t('nav.dashboard') }, { to: '/profile', icon: UserRound, label: 'My profile' }, { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' }, { to: '/academics', icon: Award, label: 'Academics' }, { to: '/physical', icon: Dumbbell, label: 'Physical Training' }, { to: '/notices', icon: Megaphone, label: t('nav.notices') }, { to: '/notes', icon: BookOpen, label: t('nav.notes') }, { to: '/results', icon: Award, label: t('nav.results') }, { to: '/leaves', icon: CalendarOff, label: t('nav.leave') }, { to: '/notifications', icon: Bell, label: t('nav.notifications') }, { to: '/settings', icon: Settings, label: t('nav.settings') }];
      default:
        return [];
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column' }}>
        <div className="sidebar-header">
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F0', letterSpacing: '0.06em', margin: 0 }}>
            <span style={{ color: '#C9A84C' }}>Delta</span> Squad
          </h1>
          <div className="sidebar-header-actions">
            <LanguageSwitcher />
            <button data-testid="logout-button" onClick={logout} className="ml-2 inline-flex min-h-9 items-center gap-1 rounded-lg border border-red-400/20 px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-400/10" aria-label="Sign out" title="Sign out"><LogOut size={14} />Sign out</button>
            <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close navigation"><X size={20} /></button>
          </div>
        </div>

        <nav className="app-nav" style={{ padding: '0 12px', display: 'flex', flex: 1, flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {getLinks().map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium relative overflow-hidden ${
                    isActive
                      ? 'text-gold'
                      : 'text-white/55 hover:text-white/85'
                  }`
                }
                aria-current={({ isActive }) => isActive ? 'page' : undefined}
                style={({ isActive }) => isActive
                  ? {
                      background: 'linear-gradient(90deg, rgba(201,168,76,.12), rgba(201,168,76,.04))',
                      border: '1px solid rgba(201,168,76,.18)',
                      boxShadow: '0 1px 0 rgba(201,168,76,.1) inset',
                    }
                  : {
                      border: '1px solid transparent',
                      background: 'transparent',
                    }
                }
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '0 4px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(201,168,76,.15), rgba(201,168,76,.08))',
            border: '1.5px solid rgba(201,168,76,.35)',
            boxShadow: '0 0 12px rgba(201,168,76,.2), 0 2px 8px rgba(0,0,0,.4)',
            color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em',
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#F0EFE8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(201,168,76,.65)', margin: 0, textTransform: 'capitalize', fontWeight: 600, letterSpacing: '0.04em' }}>{user?.role}</p>
          </div>
        </div>
        <button
          data-testid="logout-button-secondary" onClick={logout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '8px 16px', background: 'rgba(248,113,113,0.06)', color: '#F87171',
            border: '1px solid rgba(248,113,113,0.1)', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, transition: 'background 200ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', background: '#0B1A13', overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <a className="skip-link" href="#main-content">Skip to main content</a>

      {/* Mobile topbar */}
      <header className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F0', margin: 0 }}>
          <span style={{ color: '#C9A84C' }}>Delta</span> Squad
        </h1>
        <div style={{ width: 36 }} />
      </header>

      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="app-sidebar desktop-sidebar"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
            />
            <motion.aside
              className="app-sidebar mobile-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main id="main-content" tabIndex="-1" className="app-main">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
