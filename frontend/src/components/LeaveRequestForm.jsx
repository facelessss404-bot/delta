import React, { useState } from 'react';
import { motion } from 'framer-motion';

const LeaveRequestForm = ({ onSubmit, onCancel, submitting }) => {
  const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });
  const handleSubmit = (e) => { e.preventDefault(); if (!submitting) onSubmit(formData); };
  return (
    <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="glass-panel p-6 rounded-xl mb-8 border border-[#C9A84C]/30">
      <h3 className="text-lg font-bold text-[#F5F5F0] mb-4">Request Absence/Leave</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase mb-2">From Date</label>
          <input type="date" required className="w-full bg-[#0B1A13] border border-white/10 rounded-lg px-4 py-2.5 text-[#F5F5F0] focus:border-[#C9A84C] outline-none [color-scheme:dark]" onChange={e => setFormData({...formData, start_date: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase mb-2">To Date</label>
          <input type="date" required className="w-full bg-[#0B1A13] border border-white/10 rounded-lg px-4 py-2.5 text-[#F5F5F0] focus:border-[#C9A84C] outline-none [color-scheme:dark]" onChange={e => setFormData({...formData, end_date: e.target.value})} />
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Reason</label>
        <textarea required placeholder="Detailed reason for leave request..." className="w-full h-24 bg-[#0B1A13] border border-white/10 rounded-lg px-4 py-3 text-[#F5F5F0] focus:border-[#C9A84C] outline-none" onChange={e => setFormData({...formData, reason: e.target.value})} />
      </div>
      <div className="flex justify-end gap-3">
        <button disabled={submitting} type="button" onClick={onCancel} className="px-5 py-2 rounded-lg text-white/50 hover:bg-white/5 font-medium transition-colors disabled:opacity-60">Cancel</button>
        <button disabled={submitting} type="submit" className="px-5 py-2 bg-[#C9A84C] text-[#0B1A13] font-bold rounded-lg hover:bg-[#D4B661] transition-colors disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit Request'}</button>
      </div>
    </motion.form>
  );
};
export default LeaveRequestForm;
