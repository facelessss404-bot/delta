import React, { useState, useContext } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ChevronDown, GraduationCap, BookOpen, Award, Shield, MapPin, Building, Phone, Facebook, Youtube, Mail, Lock, Loader2 } from 'lucide-react';
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

/* ─── Main Component ─── */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const yCollage = useTransform(scrollY, [0, 1000], [0, 80]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'commander') navigate('/commander');
      else navigate('/cadet');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#0B1A13',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '14px 16px 14px 44px',
    color: '#F5F5F0',
    fontSize: 15,
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
          SECTION 4 — LOGIN
          ════════════════════════════════════════════════════════ */}
      <section id="login" style={{ padding: '80px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
          variants={reveal} transition={revealTransition}
          className="login-panel"
          style={{ width: '100%', maxWidth: 400, background: '#0F2119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '40px 32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>
              Personnel Login
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(245,245,240,0.4)', margin: 0 }}>
              Access your Delta Squad console
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div data-testid="login-error" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#F87171', padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'center', fontWeight: 500 }}>
                {error}
              </div>
            )}

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
            <a href="/forgot-password" style={{ color: 'rgba(201,168,76,0.8)', fontSize: 13, textAlign: 'right', textDecoration: 'none' }}>Forgot password?</a>

            <button
              data-testid="login-submit" type="submit" disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 8, border: 'none',
                background: '#C9A84C', color: '#0B1A13', fontWeight: 700, fontSize: 14,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                transition: 'filter 150ms ease, transform 100ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 8,
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseDown={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isLoading ? ( <><Loader2 size={16} className="animate-spin" /> Authenticating...</> ) : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </section>

    </div>
  );
};

export default Login;
