import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X } from 'lucide-react';

const NoteUploadModal = ({ isOpen, onClose, onUpload, subjects }) => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', subject_id: '' });
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    if (formData.subject_id) data.append('subject_id', formData.subject_id);
    onUpload(data);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel w-full max-w-md rounded-2xl p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
          <h2 className="text-xl font-bold text-[#F5F5F0] mb-6">Upload Training Material</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="Document Title" required className="bg-[#0B1A13] border border-white/10 rounded-lg px-4 py-3 text-[#F5F5F0] focus:border-[#C9A84C]/50 outline-none" onChange={e => setFormData({...formData, title: e.target.value})} />
            <select className="bg-[#0B1A13] border border-white/10 rounded-lg px-4 py-3 text-[#F5F5F0] focus:border-[#C9A84C]/50 outline-none" onChange={e => setFormData({...formData, subject_id: e.target.value})}>
              <option value="">Select Subject (Optional)</option>
              {subjects.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name || s.subject_name}</option>)}
            </select>
            <textarea placeholder="Description (Optional)" className="bg-[#0B1A13] border border-white/10 rounded-lg px-4 py-3 text-[#F5F5F0] focus:border-[#C9A84C]/50 outline-none h-24" onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/20 hover:border-white/40'}`} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={e => { e.preventDefault(); setDragActive(false); setFile(e.dataTransfer.files[0]); }}>
              <input type="file" id="file-upload" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <UploadCloud size={32} className={file ? 'text-[#C9A84C]' : 'text-white/40'} />
                <span className="text-sm font-medium text-white/70">{file ? file.name : "Drag & drop or click to browse"}</span>
              </label>
            </div>
            <button type="submit" disabled={!file || !formData.title} className="mt-2 w-full py-3 bg-[#C9A84C] text-[#0B1A13] font-bold rounded-lg hover:bg-[#D4B661] disabled:opacity-50 transition-colors">Upload Material</button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default NoteUploadModal;
