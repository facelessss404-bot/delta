import React, { useState, useContext } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ChevronDown, GraduationCap, BookOpen, Award, Shield, MapPin, Building, Phone, Facebook, Youtube, Mail, Lock, Loader2, User, UserPlus, LogIn as LogInIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import RegistrationSection from '../components/RegistrationSection';

// Import newly added images from the workspace root
import scholarshipPoster from '../../../download (2).jpg';
import officerTrainingPoster from '../../../download (3).jpg';

/* ─── Shared animation config ─── */
const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};
const revealTransition = { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] };

/* ─── Stat Counter ─── */
const StatCounter = ({ end, label, suffix = '' }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) { setCount(end); clearInterval(timer); }
        else { setCount(Math.floor(start)); }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, end]);

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 40, fontWeight: 700, color: '#C9A84C', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(245,245,240,0.45)', marginTop: 8, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
};

/* ─── Activity Card ─── */
const ActivityCard = ({ icon: Icon, title, desc, index }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={reveal}
    transition={{ ...revealTransition, delay: index * 0.1 }}
    className="shadow-premium"
    style={{
      background: '#0F2119',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 32,
      transition: 'all 250ms ease-out',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.classList.add('shadow-glow');
      e.currentTarget.classList.remove('shadow-premium');
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.classList.add('shadow-premium');
      e.currentTarget.classList.remove('shadow-glow');
    }}
  >
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 24,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
    }}>
      <Icon size={24} />
    </div>
    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F0', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
    <p style={{ fontSize: 15, color: '#A1A1AA', lineHeight: 1.65, margin: 0 }}>{desc}</p>
  </motion.div>
);

const CADET_CATEGORIES = [
  { id: 'JLP', badge: 'JLP', name: 'Junior Leadership Program', sub: 'Students in Classes 8–12', icon: GraduationCap },
  { id: 'SLP', badge: 'SLP', name: 'Student Leadership Program', sub: 'For Graduates', icon: BookOpen },
  { id: 'SSLP', badge: 'SSLP', name: 'Senior Student Leadership Program', sub: 'Online Attendees', icon: Shield },
];

/* ─── Main Component ─── */
const Login = () => {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [activeRoleTab, setActiveRoleTab] = useState('commander'); // 'commander' | 'admin' | 'cadet'
  const [cadetCategory, setCadetCategory] = useState('JLP');

  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRollNo, setSignupRollNo] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const yCollage = useTransform(scrollY, [0, 1000], [0, 80]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const payload = {
        email: email.trim(),
        password
      };
      const { data } = await api.post('/auth/login', payload);
      login(data);
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'commander') navigate('/commander');
      else navigate('/cadet');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSignupSuccess('');
    try {
      const payload = {
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        category: cadetCategory,
        phone: signupPhone.trim(),
        rollNo: signupRollNo.trim() || undefined,
        batch: '2025-2026'
      };
      const { data } = await api.post('/auth/cadet-signup', payload);
      setSignupSuccess(`Welcome Cadet ${data.name}! Enrolled into ${cadetCategory} division. Entering portal...`);
      setTimeout(() => {
        login(data);
        navigate('/cadet');
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll cadet account');
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#0B1A13',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '13px 16px 13px 44px',
    color: '#F5F5F0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 200ms ease',
    boxSizing: 'border-box',
  };

  return (
    <div className="public-page" style={{ backgroundColor: '#0B1A13', minHeight: '100vh', color: '#F5F5F0', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ════════════════════════════════════════════════════════ */}
      <section className="public-hero" style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <video
          className="hero-video"
          src="/logo_animation.mp4"
          autoPlay muted playsInline loop
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(11,26,19,0.5) 0%, rgba(11,26,19,0.85) 100%)', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 900 }}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 24px', color: '#F5F5F0', textShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
          >
            Delta Squad{' '}
            <span style={{ color: '#C9A84C', fontWeight: 400, textShadow: '0 0 30px rgba(201,168,76,0.3)' }}>Foundation</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', color: '#A1A1AA', letterSpacing: '0.04em', fontWeight: 500, margin: '0 auto 48px', maxWidth: 600, lineHeight: 1.6 }}
          >
            Train Hard. Lead Stronger. Building the next generation of commissioned officers.
          </motion.p>

          <motion.a
            className="hero-primary"
            href="#counselling-registration"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            style={{
              display: 'inline-flex', padding: '16px 40px', borderRadius: 12,
              background: '#C9A84C', color: '#0B1A13', fontWeight: 800, fontSize: 15,
              textDecoration: 'none', letterSpacing: '0.02em',
              transition: 'all 200ms ease',
              boxShadow: '0 8px 24px rgba(201,168,76,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
              alignItems: 'center', gap: 8
            }}
            onMouseEnter={e => {
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,168,76,0.25), inset 0 1px 0 rgba(255,255,255,0.4)';
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Apply Now →
          </motion.a>
          <motion.a
            className="hero-secondary"
            href="#login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.35 }}
          >
            Personnel sign in
          </motion.a>
        </div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: 40, zIndex: 2 }}
        >
          <ChevronDown size={24} color="rgba(245,245,240,0.3)" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — PHOTO GALLERY
          ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="lg:grid-cols-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Collage — main image */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
              variants={reveal} transition={revealTransition}
              className="lg:col-span-8 image-frame"
              style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}
            >
              <motion.img
                style={{ y: yCollage, display: 'block', width: '100%', height: 'auto', scale: 1.05 }}
                src="/collage.jpeg"
                alt="JLP 2025-2026 Activities — Delta Squad Foundation"
                loading="lazy" decoding="async"
                width={1200} height={800}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 32px 32px', background: 'linear-gradient(to top, rgba(11,26,19,0.95), transparent)' }}>
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: '#C9A84C', margin: 0, lineHeight: 1.5 }}>
                  "JLP 2025–2026 — Not just Memories, It's Legacy Carried on"
                </p>
              </div>
            </motion.div>

            {/* Posters */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
              variants={reveal} transition={{ ...revealTransition, delay: 0.15 }}
              className="lg:col-span-4"
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <div className="image-frame" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <img
                  src={scholarshipPoster}
                  alt="100% Scholarship Commissioned Officer Training"
                  loading="lazy" decoding="async"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  width={400} height={400}
                />
              </div>

              <div className="image-frame" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <img
                  src={officerTrainingPoster}
                  alt="Delta Squad Foundation — 100% Free Officer Training"
                  loading="lazy" decoding="async"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  width={400} height={400}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 3 — ABOUT
          ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 80 }}>
            <StatCounter end={350} suffix="+" label="Defence Officers Guided" />
            <StatCounter end={10} suffix="+" label="Years of Service" />
            <StatCounter end={100} suffix="%" label="Scholarship Programs" />
            <StatCounter end={15} label="Active HADR Missions" />
          </div>

          {/* Intro */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={reveal} transition={revealTransition}
            style={{ maxWidth: 800, margin: '0 auto 96px', paddingLeft: 32, borderLeft: '2px solid #C9A84C' }}
          >
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#F5F5F0', letterSpacing: '-0.02em', marginBottom: 20 }}>
              About The Foundation
            </h2>
            <p style={{ fontSize: 18, color: '#A1A1AA', lineHeight: 1.75, margin: 0 }}>
              The Delta Squad Foundation (DSF) is a Coimbatore-based non-profit organisation that focuses on training youth for careers in the Indian Armed Forces and Civil Services, while also engaging in humanitarian disaster relief operations. Led by Lt. Esan, a former Naval Architect and training commander, the foundation operates the Officers Preparing Academy to mentor aspirants from humble backgrounds.
            </p>
          </motion.div>

          {/* Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16, marginBottom: 80 }}>
            {[
              { icon: GraduationCap, title: 'Officers Preparing Academy', desc: 'Specialized coaching for NDA, CDS, AFCAT, and SSB interviews.' },
              { icon: BookOpen, title: 'Foundation Programs', desc: 'Long-term training for students in classes 8–12 using the NIOS curriculum, integrating academic support with physical and leadership training.' },
              { icon: Award, title: '100% Scholarships', desc: 'Free residential training programs for high-achieving engineering graduates (CGPA 8.0+) aiming to become commissioned officers.' },
              { icon: Shield, title: 'Disaster Relief (HADR)', desc: 'Active team of trained responders who participate in rescue operations during floods and landslides across Wayanad and Tamil Nadu.' },
            ].map((card, i) => (
              <ActivityCard key={i} {...card} index={i} />
            ))}
          </div>

          {/* Contact */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={reveal} transition={revealTransition}
            className="shadow-premium"
            style={{ background: '#0F2119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '48px', maxWidth: 880, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.12)' }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Headquarters & Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { Icon: MapPin, label: 'Registered Address', value: 'No. 730, V. K. K. Menon Road, Coimbatore, 641044' },
                  { Icon: Building, label: 'Training Venue', value: 'Maileri Palayam, Othakalmandapam' },
                  { Icon: Phone, label: 'Contact', value: '+91 90430 90462 / 90430 90464 / 90430 90468' },
                ].map(({ Icon, label, value }, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Icon size={18} style={{ color: '#C9A84C', marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(245,245,240,0.5)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 15, color: 'rgba(245,245,240,0.8)', lineHeight: 1.5 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: 'https://www.facebook.com/OfficersPreparingAcademy/', icon: Facebook, iconColor: '#1877F2', label: 'Officers Preparing Academy' },
                  { href: 'https://www.facebook.com/esan.delta/', icon: Facebook, iconColor: '#1877F2', label: 'Esan Delta Squad' },
                  { href: 'https://www.youtube.com/c/ESANDELTASQUAD', icon: Youtube, iconColor: '#FF0000', label: 'ESANDELTASQUAD' },
                ].map(({ href, icon: SIcon, iconColor, label }, i) => (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent', color: '#F5F5F0', textDecoration: 'none',
                      fontSize: 14, fontWeight: 500, transition: 'background 200ms ease, border-color 200ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                  >
                    <SIcon size={18} style={{ color: iconColor }} />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          COUNSELLING REGISTRATION
          ════════════════════════════════════════════════════════ */}
      <RegistrationSection />

      {/* ════════════════════════════════════════════════════════
          SECTION 4 — AUTHENTICATION (SIGN IN / CADET SIGN UP)
          ════════════════════════════════════════════════════════ */}
      <section id="login" style={{ padding: '80px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
          variants={reveal} transition={revealTransition}
          className="login-panel"
          style={{ width: '100%', maxWidth: 460, background: '#0F2119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
        >
          {/* Mode Switcher Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'rgba(0,0,0,0.35)', padding: 4, borderRadius: 12, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              data-testid="tab-signin"
              onClick={() => { setAuthMode('signin'); setError(''); setSignupSuccess(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, transition: 'all 180ms ease',
                background: authMode === 'signin' ? '#C9A84C' : 'transparent',
                color: authMode === 'signin' ? '#0B1A13' : 'rgba(245,245,240,0.6)',
              }}
            >
              <LogInIcon size={15} />
              Personnel Sign In
            </button>
            <button
              type="button"
              data-testid="tab-signup"
              onClick={() => { setAuthMode('signup'); setError(''); setSignupSuccess(''); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, transition: 'all 180ms ease',
                background: authMode === 'signup' ? '#C9A84C' : 'transparent',
                color: authMode === 'signup' ? '#0B1A13' : 'rgba(245,245,240,0.6)',
              }}
            >
              <UserPlus size={15} />
              Cadet Sign Up
            </button>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6, color: '#F5F5F0' }}>
              {authMode === 'signin' ? 'Command & Cadet Access' : 'Cadet Self-Registration'}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(245,245,240,0.5)', margin: 0 }}>
              {authMode === 'signin'
                ? 'Sign in to access your division timetable, logs, and portal'
                : 'Enrol yourself directly to avoid manual administrative entry'}
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div data-testid="login-error" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#FCA5A5', padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'center', fontWeight: 500, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {signupSuccess && (
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#6EE7B7', padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'center', fontWeight: 600, marginBottom: 16 }}>
              {signupSuccess}
            </div>
          )}

          {/* ══════════════════════════════════════
              MODE 1: PERSONNEL SIGN IN
              ══════════════════════════════════════ */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quick Role Select / 1-Click Access */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.85)', marginBottom: 8, textAlign: 'center' }}>
                  Quick Role Access (1-Click)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  <button
                    type="button"
                    data-testid="demo-login-commander"
                    onClick={() => {
                      setEmail('onlyesan@gmail.com');
                      setPassword('ESAN@DELTA');
                      setActiveRoleTab('commander');
                      setError('');
                    }}
                    style={{
                      padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 8,
                      border: activeRoleTab === 'commander' ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)',
                      background: activeRoleTab === 'commander' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.03)',
                      color: activeRoleTab === 'commander' ? '#C9A84C' : 'rgba(245,245,240,0.7)',
                      cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'center'
                    }}
                  >
                    🛡️ Commander
                  </button>
                  <button
                    type="button"
                    data-testid="demo-login-admin"
                    onClick={() => {
                      setEmail('admin@admin.com');
                      setPassword('password123');
                      setActiveRoleTab('admin');
                      setError('');
                    }}
                    style={{
                      padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 8,
                      border: activeRoleTab === 'admin' ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)',
                      background: activeRoleTab === 'admin' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.03)',
                      color: activeRoleTab === 'admin' ? '#C9A84C' : 'rgba(245,245,240,0.7)',
                      cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'center'
                    }}
                  >
                    📋 Admin
                  </button>
                  <button
                    type="button"
                    data-testid="demo-login-cadet"
                    onClick={() => {
                      setEmail('cadet@cadet.com');
                      setPassword('password123');
                      setActiveRoleTab('cadet');
                      setError('');
                    }}
                    style={{
                      padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 8,
                      border: activeRoleTab === 'cadet' ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)',
                      background: activeRoleTab === 'cadet' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.03)',
                      color: activeRoleTab === 'cadet' ? '#C9A84C' : 'rgba(245,245,240,0.7)',
                      cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'center'
                    }}
                  >
                    🎖️ Cadet
                  </button>
                </div>
              </div>



              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)' }} />
                <input
                  data-testid="login-email" type="email" required placeholder="Email address"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)' }} />
                <input
                  data-testid="login-password" type="password" required placeholder="Password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setActiveRoleTab('cadet'); }}
                  style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Need to self-register as a cadet?
                </button>
                <a href="/forgot-password" style={{ color: 'rgba(201,168,76,0.8)', fontSize: 12, textAlign: 'right', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>

              <button
                data-testid="login-submit" type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 8, border: 'none',
                  background: '#C9A84C', color: '#0B1A13', fontWeight: 700, fontSize: 14,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'filter 150ms ease, transform 100ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {isLoading ? ( <><Loader2 size={16} className="animate-spin" /> Authenticating...</> ) : 'Sign in to Console'}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════
              MODE 2: CADET SELF-SIGNUP
              ══════════════════════════════════════ */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Category Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C9A84C', marginBottom: 6 }}>
                  Select Training Category *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {CADET_CATEGORIES.map((cat) => {
                    const isSelected = cadetCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCadetCategory(cat.id)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                          padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                          cursor: 'pointer', transition: 'all 150ms ease',
                          background: isSelected ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon size={14} style={{ color: isSelected ? '#C9A84C' : 'rgba(245,245,240,0.6)' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#C9A84C' : '#F5F5F0' }}>
                              {cat.badge}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 size={13} style={{ color: '#C9A84C' }} />}
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(245,245,240,0.45)', lineHeight: 1.2 }}>
                          {cat.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name */}
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)' }} />
                <input
                  type="text" required placeholder="Cadet Full Name *"
                  value={signupName} onChange={e => setSignupName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Email */}
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)' }} />
                <input
                  type="email" required placeholder="Cadet Email Address *"
                  value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Password */}
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)' }} />
                <input
                  type="password" required minLength={8} placeholder="Password (minimum 8 characters) *"
                  value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Phone */}
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)' }} />
                <input
                  type="tel" placeholder="Mobile / WhatsApp Number (Optional)"
                  value={signupPhone} onChange={e => setSignupPhone(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Roll Number (Optional) */}
              <div style={{ position: 'relative' }}>
                <Award size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)' }} />
                <input
                  type="text" placeholder={`Roll No (leave blank to auto-generate: DS-${cadetCategory}-XXXX)`}
                  value={signupRollNo} onChange={e => setSignupRollNo(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <button
                type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 8, border: 'none',
                  background: '#C9A84C', color: '#0B1A13', fontWeight: 700, fontSize: 14,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'filter 150ms ease, transform 100ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 6,
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {isLoading ? ( <><Loader2 size={16} className="animate-spin" /> Enrolling Cadet...</> ) : 'Complete Registration & Enter Portal'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(245,245,240,0.6)', fontSize: 13, cursor: 'pointer', padding: 0 }}
                >
                  Already registered? <span style={{ color: '#C9A84C', fontWeight: 600, textDecoration: 'underline' }}>Sign In here</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </section>

    </div>
  );
};

export default Login;
