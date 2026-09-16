import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle, UploadCloud, Video, X } from 'lucide-react';
import api from '../services/api';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const VideoUpload = ({ onUploaded }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [activityType, setActivityType] = useState('Physical training');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected?.type.startsWith('video/')) return setStatus('Please select a valid video file.');
    if (selected.size > MAX_VIDEO_SIZE) return setStatus('Videos must be 50 MB or smaller on the free plan.');
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected); setPreview(URL.createObjectURL(selected)); setStatus(''); setProgress(0);
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setStatus(''); setProgress(0);
  };

  const submit = async () => {
    if (!file || !activityType.trim() || !activityDate) return setStatus('Choose a video, activity name, and date.');
    setUploading(true); setProgress(0); setStatus('Preparing secure upload…');
    try {
      const metadata = { activityType, activityDate, filename: file.name, mimeType: file.type, fileSize: file.size };
      const { data: signed } = await api.post('/physical/presign', metadata);
      await new Promise((resolve, reject) => {
        const upload = new XMLHttpRequest();
        upload.open('PUT', signed.uploadUrl);
        upload.setRequestHeader('Content-Type', file.type);
        upload.setRequestHeader('Authorization', `Bearer ${signed.uploadToken}`);
        upload.setRequestHeader('x-upsert', 'false');
        upload.upload.onprogress = (event) => { if (event.lengthComputable) { const percent = Math.round((event.loaded / event.total) * 100); setProgress(percent); setStatus(`Uploading securely: ${percent}%`); } };
        upload.onload = () => upload.status >= 200 && upload.status < 300 ? resolve() : reject(new Error('Supabase could not store the video. Please retry.'));
        upload.onerror = () => reject(new Error('Video upload failed. Check your connection and retry.'));
        upload.send(file);
      });
      setProgress(100); setStatus('Finalizing your submission…');
      await api.post('/physical/complete', { ...metadata, storageKey: signed.storageKey });
      handleClear(); setStatus('Video uploaded securely and submitted for review.'); onUploaded?.();
    } catch (error) { setStatus(error.response?.data?.message || error.message || 'Video upload failed.'); }
    finally { setUploading(false); }
  };

  return <div className="glass-panel p-6 rounded-3xl border border-white/10">
    <div className="flex items-center gap-3 mb-6"><div className="p-2.5 bg-gold/10 text-gold rounded-xl border border-gold/20"><Video size={20} /></div><div><h2 className="text-xl font-bold text-white tracking-tight">Submit Training Video</h2><p className="text-sm text-white/50">Videos are stored securely in Supabase and sent to the training team for review.</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 mb-4"><input value={activityType} disabled={uploading} maxLength="100" onChange={(event) => setActivityType(event.target.value)} aria-label="Activity type" placeholder="Training activity" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-gold/60 disabled:opacity-60" /><input value={activityDate} disabled={uploading} onChange={(event) => setActivityDate(event.target.value)} type="date" aria-label="Activity date" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-gold/60 disabled:opacity-60" /></div>
    {!preview ? <div className="relative"><input type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center bg-black/20 hover:bg-black/40 hover:border-gold/50 transition-all flex flex-col items-center justify-center"><UploadCloud size={40} className="text-white/30 mb-4" /><p className="text-white font-medium mb-1">Click or drag video to upload</p><p className="text-xs text-white/50">MP4, WebM or OGG — maximum 50 MB</p></div></div> : <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black/30 rounded-2xl overflow-hidden border border-white/10"><div className="relative bg-black aspect-video flex items-center justify-center"><video src={preview} controls className="max-h-full max-w-full" /><button onClick={handleClear} disabled={uploading} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full"><X size={16} /></button></div><div className="p-4 flex items-center justify-between gap-4"><span className="truncate text-sm text-white/70 font-medium">{file.name}</span><button onClick={submit} disabled={uploading} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-darkGreen disabled:opacity-60">{uploading ? <LoaderCircle size={16} className="animate-spin" /> : <UploadCloud size={16} />}{uploading ? 'Uploading' : 'Submit video'}</button></div></motion.div>}
    {uploading && <div className="mt-4" aria-live="polite"><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-gold">{progress}% uploaded</p></div>}
    {status && <p className={`mt-4 flex items-center gap-2 text-sm ${status.startsWith('Video uploaded') ? 'text-emerald-300' : uploading ? 'text-gold' : 'text-red-300'}`}>{status.startsWith('Video uploaded') && <CheckCircle2 size={16} />}{status}</p>}
  </div>;
};

export default VideoUpload;
