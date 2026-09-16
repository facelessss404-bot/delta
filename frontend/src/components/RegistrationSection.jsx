import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, GraduationCap, Users, Shield, Award, Phone, Mail, User, Calendar, Loader2 } from 'lucide-react';
import api from '../services/api';

// --- Configuration ---
// TODO: confirm official program names and descriptions with team
const PROGRAMS = [
  { id: 'JLP', name: 'Junior Leadership Program', desc: 'Foundation training for young cadets.', icon: GraduationCap },
  { id: 'SLP', name: 'Student Leadership Program', desc: 'Intermediate leadership development.', icon: Users },
  { id: 'YLP', name: 'Youth Leadership Program', desc: 'Advanced skills and civil service prep.', icon: Shield },
  { id: 'SSLP', name: 'Senior Student Leadership Program', desc: 'Pre-commissioning and elite coaching.', icon: Award },
];

const RegistrationSection = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', dobOrAge: '',
    educationLevel: '', mode: 'phone', additionalNotes: '',
    consent: false, honeypot: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const formRef = useRef(null);

  // --- Handlers ---
  const handleProgramSelect = (id) => {
    setSelectedProgram(id);
    if (!selectedProgram) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateField = (name, value) => {
    let error = null;
    if (name === 'fullName' && value.trim().length < 2) error = 'Name is too short';
    if (name === 'phone' && !/^[+\d\s-]{10,15}$/.test(value)) error = 'Invalid phone number';
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email address';
    if (name === 'dobOrAge' && !value.trim()) error = 'DOB or Age is required';
    if (name === 'consent' && !value) error = 'You must agree to be contacted';
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    validateField(name, type === 'checkbox' ? checked : value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = ['fullName', 'phone', 'dobOrAge', 'consent'].every(field => validateField(field, formData[field]));
    if (!isValid || !selectedProgram) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await api.post('/counselling-registrations', {
        ...formData,
        program: selectedProgram
      });
      
      if (response.data.ok) {
        setSuccessData(response.data);
      }
    } catch (err) {
      setErrors({ 
        submit: err.response?.data?.errors?.general || err.response?.data?.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setSelectedProgram(null);
    setFormData({
      fullName: '', phone: '', email: '', dobOrAge: '',
      educationLevel: '', mode: 'phone', additionalNotes: '',
      consent: false, honeypot: ''
    });
  };

  // --- Render Helpers ---
  const selectedProgramObj = PROGRAMS.find(p => p.id === selectedProgram);

  const inputStyle = {
    width: '100%', background: '#0B1A13', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '12px 16px', color: '#F5F5F0', fontSize: 15,
    outline: 'none', transition: 'border-color 200ms ease', boxSizing: 'border-box'
  };

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(245,245,240,0.6)', marginBottom: 6 };

  return (
    <section id="counselling-registration" style={{ padding: '96px 24px', backgroundColor: '#0B1A13' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        
        {/* --- Header --- */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 12 }}>
            Registration
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#F5F5F0', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Register for Counselling
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(245,245,240,0.6)', margin: 0 }}>
            Choose your program track to get started.
          </p>
        </div>

        {/* --- Stage 1: Program Selector --- */}
        <motion.div 
          role="radiogroup" 
          aria-label="Select Program" 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" 
          style={{ gap: 24, marginBottom: 64 }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {PROGRAMS.map((prog) => {
            const isSelected = selectedProgram === prog.id;
            return (
              <motion.button
                key={prog.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleProgramSelect(prog.id)}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
                }}
                className={isSelected ? "shadow-glow" : "shadow-premium"}
                style={{
                  background: isSelected ? 'rgba(201,168,76,0.05)' : '#0F2119',
                  border: `1px solid ${isSelected ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 16, padding: '32px 24px', textAlign: 'left',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  transition: 'all 250ms ease-out',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.classList.add('shadow-glow');
                    e.currentTarget.classList.remove('shadow-premium');
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.classList.add('shadow-premium');
                    e.currentTarget.classList.remove('shadow-glow');
                  }
                }}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #0B1A13, 0 0 0 4px #C9A84C'}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  // Re-apply class-based shadow on blur
                  if(isSelected) {
                    e.currentTarget.classList.add('shadow-glow');
                  } else {
                    e.currentTarget.classList.add('shadow-premium');
                  }
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: 16, right: 16, color: '#C9A84C' }}>
                    <CheckCircle2 size={24} weight="fill" />
                  </div>
                )}
                
                <div style={{ color: isSelected ? '#C9A84C' : 'rgba(245,245,240,0.4)', marginBottom: 20, transition: 'color 250ms ease' }}>
                  <prog.icon size={32} />
                </div>
                
                <h3 style={{ fontSize: 32, fontWeight: 800, color: '#F5F5F0', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{prog.id}</h3>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(245,245,240,0.8)', marginBottom: 12 }}>{prog.name}</div>
                <p style={{ fontSize: 13, color: '#A1A1AA', margin: '0 0 24px', lineHeight: 1.6 }}>{prog.desc}</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: isSelected ? '#C9A84C' : 'rgba(245,245,240,0.4)', transition: 'color 250ms ease' }}>
                  {isSelected ? 'Selected' : 'Select'} <ChevronRight size={16} />
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* --- Stage 2: Form or Success --- */}
        <div ref={formRef} style={{ scrollMarginTop: 80 }}>
          <AnimatePresence mode="wait">
            {selectedProgram && !successData && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="shadow-premium" style={{ maxWidth: 640, margin: '0 auto', background: '#0F2119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24 }}>
                  
                  {/* Banner */}
                  <div style={{ background: 'rgba(201,168,76,0.05)', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 14, color: 'rgba(245,245,240,0.8)', fontWeight: 500 }}>
                      Applying for: <span style={{ color: '#C9A84C', fontWeight: 700 }}>{selectedProgramObj?.name}</span>
                    </div>
                    <button onClick={() => setSelectedProgram(null)} style={{ background: 'none', border: 'none', color: 'rgba(245,245,240,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                      Change
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} style={{ padding: '32px 40px' }} noValidate>
                    {/* Honeypot */}
                    <input type="text" name="honeypot" value={formData.honeypot} onChange={handleInputChange} style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" />
                    
                    {errors.submit && (
                      <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', color: '#F87171', borderRadius: 8, marginBottom: 24, fontSize: 14, fontWeight: 500 }}>
                        {errors.submit}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div>
                        <label htmlFor="fullName" style={labelStyle}>Full Name *</label>
                        <input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} onBlur={handleBlur}
                          style={{ ...inputStyle, borderColor: errors.fullName ? '#F87171' : 'rgba(255,255,255,0.1)' }}
                          onFocus={e => e.target.style.borderColor = errors.fullName ? '#F87171' : 'rgba(201,168,76,0.4)'}
                          aria-invalid={!!errors.fullName} aria-describedby="fullName-error"
                        />
                        {errors.fullName && <div id="fullName-error" style={{ color: '#F87171', fontSize: 12, marginTop: 6, fontWeight: 500 }}>{errors.fullName}</div>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
                        <div>
                          <label htmlFor="phone" style={labelStyle}>Phone Number *</label>
                          <input id="phone" name="phone" placeholder="+91..." value={formData.phone} onChange={handleInputChange} onBlur={handleBlur}
                            style={{ ...inputStyle, borderColor: errors.phone ? '#F87171' : 'rgba(255,255,255,0.1)' }}
                            onFocus={e => e.target.style.borderColor = errors.phone ? '#F87171' : 'rgba(201,168,76,0.4)'}
                            aria-invalid={!!errors.phone} aria-describedby="phone-error"
                          />
                          {errors.phone ? <div id="phone-error" style={{ color: '#F87171', fontSize: 12, marginTop: 6, fontWeight: 500 }}>{errors.phone}</div> 
                            : <div style={{ color: 'rgba(245,245,240,0.4)', fontSize: 12, marginTop: 6 }}>10-15 digits, with country code</div>}
                        </div>
                        <div>
                          <label htmlFor="email" style={labelStyle}>Email (Optional)</label>
                          <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} onBlur={handleBlur}
                            style={{ ...inputStyle, borderColor: errors.email ? '#F87171' : 'rgba(255,255,255,0.1)' }}
                            onFocus={e => e.target.style.borderColor = errors.email ? '#F87171' : 'rgba(201,168,76,0.4)'}
                            aria-invalid={!!errors.email} aria-describedby="email-error"
                          />
                          {errors.email && <div id="email-error" style={{ color: '#F87171', fontSize: 12, marginTop: 6, fontWeight: 500 }}>{errors.email}</div>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
                        <div>
                          <label htmlFor="dobOrAge" style={labelStyle}>DOB or Age *</label>
                          <input id="dobOrAge" name="dobOrAge" value={formData.dobOrAge} onChange={handleInputChange} onBlur={handleBlur}
                            style={{ ...inputStyle, borderColor: errors.dobOrAge ? '#F87171' : 'rgba(255,255,255,0.1)' }}
                            onFocus={e => e.target.style.borderColor = errors.dobOrAge ? '#F87171' : 'rgba(201,168,76,0.4)'}
                            aria-invalid={!!errors.dobOrAge} aria-describedby="dob-error"
                          />
                          {errors.dobOrAge && <div id="dob-error" style={{ color: '#F87171', fontSize: 12, marginTop: 6, fontWeight: 500 }}>{errors.dobOrAge}</div>}
                        </div>
                        <div>
                          <label htmlFor="educationLevel" style={labelStyle}>Education Level</label>
                          <select id="educationLevel" name="educationLevel" value={formData.educationLevel} onChange={handleInputChange}
                            style={inputStyle} onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                          >
                            <option value="">Select...</option>
                            <option value="School">School</option>
                            <option value="College">College</option>
                            <option value="Postgraduate">Postgraduate</option>
                            <option value="Working Professional">Working Professional</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Preferred Counselling Mode</label>
                        <div style={{ display: 'flex', gap: 16 }}>
                          {['phone', 'video', 'in_person'].map(mode => (
                            <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(245,245,240,0.8)', cursor: 'pointer' }}>
                              <input type="radio" name="mode" value={mode} checked={formData.mode === mode} onChange={handleInputChange}
                                style={{ accentColor: '#C9A84C', width: 16, height: 16 }}
                              />
                              {mode === 'in_person' ? 'In-person' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="additionalNotes" style={labelStyle}>Anything else we should know?</label>
                        <textarea id="additionalNotes" name="additionalNotes" rows="3" value={formData.additionalNotes} onChange={handleInputChange} maxLength={500}
                          style={{ ...inputStyle, resize: 'vertical' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                          <input type="checkbox" name="consent" checked={formData.consent} onChange={handleInputChange} onBlur={handleBlur}
                            style={{ width: 18, height: 18, accentColor: '#C9A84C', marginTop: 2, flexShrink: 0 }}
                            aria-invalid={!!errors.consent}
                          />
                          <span style={{ fontSize: 13, color: 'rgba(245,245,240,0.6)', lineHeight: 1.5 }}>
                            I agree to be contacted by Delta Squad Foundation regarding counselling for the <strong>{selectedProgramObj?.name}</strong> program.
                          </span>
                        </label>
                        {errors.consent && <div style={{ color: '#F87171', fontSize: 12, marginTop: 6, fontWeight: 500, marginLeft: 30 }}>{errors.consent}</div>}
                      </div>

                      <button type="submit" disabled={isSubmitting}
                        style={{
                          background: '#C9A84C', color: '#0B1A13', padding: '16px', borderRadius: 8,
                          fontSize: 15, fontWeight: 700, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                          opacity: isSubmitting ? 0.7 : 1, transition: 'all 200ms ease', marginTop: 16
                        }}
                        onMouseEnter={e => !isSubmitting && (e.currentTarget.style.filter = 'brightness(1.1)')}
                        onMouseLeave={e => !isSubmitting && (e.currentTarget.style.filter = 'brightness(1)')}
                      >
                        {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : 'Submit Application'}
                      </button>

                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {successData && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="shadow-premium"
                style={{ maxWidth: 640, margin: '0 auto', background: '#0F2119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '48px 40px', textAlign: 'center' }}
              >
                <div style={{ width: 64, height: 64, background: 'rgba(52,211,153,0.1)', color: '#34D399', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F0', marginBottom: 12 }}>Application Received</h3>
                <p style={{ fontSize: 16, color: 'rgba(245,245,240,0.7)', lineHeight: 1.6, marginBottom: 24 }}>
                  Thank you, <strong>{formData.fullName}</strong>. Your application for the <strong>{selectedProgramObj?.name}</strong> has been received. Our team will contact you shortly.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px', display: 'inline-block', marginBottom: 32 }}>
                  <span style={{ fontSize: 12, color: 'rgba(245,245,240,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 8 }}>Reference ID</span>
                  <strong style={{ fontSize: 16, color: '#C9A84C', letterSpacing: '0.05em' }}>{successData.reference_id}</strong>
                </div>
                <div>
                  <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'rgba(245,245,240,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                    Register another candidate
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default RegistrationSection;
