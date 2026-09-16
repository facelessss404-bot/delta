import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import AttendancePanel from '../components/AttendancePanel';
import { Users, UserPlus, Trash2 } from 'lucide-react';
import { getSubjects } from '../services/subjectService';

const AdminDashboard = () => {
  const [cadets, setCadets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCadet, setNewCadet] = useState({ name: '', email: '', password: '', rollNo: '', batch: '', programme: '', subjectIds: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCadets();
  }, []);

  const fetchCadets = async () => {
    try {
      const [cadetResponse, subjectResponse] = await Promise.all([api.get('/cadets'), getSubjects()]);
      setCadets(cadetResponse.data);
      setSubjects(subjectResponse.filter((subject) => subject.active !== false));
    } catch (error) {
      setMessage('Unable to load cadets. Please refresh the page.');
    }
  };

  const handleCreateCadet = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setMessage('Creating Cadet…');
    try {
      const { subjectIds, ...cadetPayload } = newCadet;
      const { data: created } = await api.post('/cadets', cadetPayload);
      if (subjectIds.length) await api.put(`/cadets/${created.id}/subjects`, { subjectIds, batch: newCadet.batch });
      setNewCadet({ name: '', email: '', password: '', rollNo: '', batch: '', programme: '', subjectIds: [] });
      setShowCreate(false);
      setMessage('Cadet created successfully.');
      fetchCadets();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create Cadet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCadet = async (id) => {
    if (window.confirm("Are you sure you want to delete this cadet?")) {
      if (deletingId) return;
      setDeletingId(id);
      setMessage('Removing Cadet…');
      try {
        await api.delete(`/cadets/${id}`);
        fetchCadets();
        setMessage('Cadet removed successfully.');
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to remove Cadet. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6 h-full pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
        
        {/* Left Column: Manage Cadets */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 flex flex-col h-full"
        >
          <div className="glass-panel rounded-3xl p-6 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center">
                Cadet Roster
              </h2>
              <button data-testid="show-create-cadet"
                onClick={() => setShowCreate(!showCreate)}
                className="bg-gold/10 text-gold hover:bg-gold hover:text-darkGreen px-3 py-1.5 rounded-xl transition-all text-sm font-semibold border border-gold/20 flex items-center"
              >
                <UserPlus size={16} className="mr-1.5" /> Add
              </button>
            </div>

            <AnimatePresence>
              {showCreate && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 bg-black/20 p-4 rounded-2xl border border-white/5 relative z-10 overflow-hidden"
                  onSubmit={handleCreateCadet}
                >
                  <div className="space-y-3">
                    <input
                      data-testid="cadet-name" type="text"
                      required
                      placeholder="Full Name"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
                      value={newCadet.name}
                      onChange={e => setNewCadet({...newCadet, name: e.target.value})}
                    />
                    <input
                      data-testid="cadet-email" type="email"
                      required
                      placeholder="Email Address"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
                      value={newCadet.email}
                      onChange={e => setNewCadet({...newCadet, email: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Roll number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors" value={newCadet.rollNo} onChange={e => setNewCadet({...newCadet, rollNo: e.target.value})} />
                      <input type="text" placeholder="Batch" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors" value={newCadet.batch} onChange={e => setNewCadet({...newCadet, batch: e.target.value})} />
                    </div>
                    <input type="text" placeholder="Programme" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors" value={newCadet.programme} onChange={e => setNewCadet({...newCadet, programme: e.target.value})} />
                    <input
                      data-testid="cadet-password" type="password"
                      required
                      placeholder="Password"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
                      value={newCadet.password}
                      onChange={e => setNewCadet({...newCadet, password: e.target.value})}
                    />
                    <fieldset className="rounded-xl border border-white/10 p-3">
                      <legend className="px-1 text-xs text-white/50">Assigned subjects</legend>
                      <div className="mt-1 grid grid-cols-2 gap-2">{subjects.map((subject) => <label key={subject.id} className="flex items-center gap-2 text-xs text-white/70"><input data-testid={`cadet-subject-${subject.id}`} type="checkbox" checked={newCadet.subjectIds.includes(subject.id)} onChange={(event) => setNewCadet({ ...newCadet, subjectIds: event.target.checked ? [...newCadet.subjectIds, subject.id] : newCadet.subjectIds.filter((id) => id !== subject.id) })} />{subject.name}</label>)}</div>
                    </fieldset>
                    <button 
                      data-testid="create-cadet" type="submit" 
                      disabled={isLoading}
                      className="w-full bg-gold hover:bg-white text-darkGreen font-bold py-2 rounded-xl transition-all disabled:opacity-50 mt-2"
                    >
                      {isLoading ? 'Creating...' : 'Provision Account'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-none relative z-10">
              {message && <p data-testid="cadet-message" className="rounded-xl bg-white/5 p-3 text-xs text-white/70">{message}</p>}
              {cadets.map((cadet, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={cadet._id} 
                  className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-xs">
                      {cadet.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm leading-tight">{cadet.name}</p>
                      <p className="text-[11px] text-white/50">{cadet.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteCadet(cadet._id)}
                    disabled={deletingId === cadet._id}
                    className="text-white/30 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-60"
                  >
                    {deletingId === cadet._id ? 'Removing…' : <Trash2 size={16} />}
                  </button>
                </motion.div>
              ))}
              {cadets.length === 0 && (
                <div className="text-center py-10">
                  <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/40">No cadets found.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Attendance Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 h-full"
        >
          <AttendancePanel />
        </motion.div>

      </div>
    </div>
  );
};

export default AdminDashboard;
