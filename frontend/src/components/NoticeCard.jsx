import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Trash, Edit } from 'lucide-react';

const priorityColors = {
  urgent: { border: 'border-l-[#F87171]', icon: 'text-[#F87171]' },
  high: { border: 'border-l-[#FBBF24]', icon: 'text-[#FBBF24]' },
  normal: { border: 'border-l-[#60A5FA]', icon: 'text-[#60A5FA]' },
  low: { border: 'border-l-[#9CA3AF]', icon: 'text-[#9CA3AF]' }
};

const NoticeCard = ({ notice, role, onDelete, onEdit }) => {
  const styles = priorityColors[notice.priority || 'normal'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`glass-panel rounded-xl border-l-4 p-5 relative overflow-hidden ${styles.border}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-[#F5F5F0]">{notice.title}</h3>
        {(role === 'admin' || role === 'commander') && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(notice)} className="text-white/40 hover:text-white transition-colors"><Edit size={16} /></button>
            {role === 'admin' && <button onClick={() => onDelete(notice.id)} className="text-white/40 hover:text-[#F87171] transition-colors"><Trash size={16} /></button>}
          </div>
        )}
      </div>
      <p className="text-sm text-white/70 mb-4 whitespace-pre-wrap">{notice.content}</p>
      <div className="flex items-center gap-4 text-xs text-white/40 border-t border-white/5 pt-3">
        <div className={`flex items-center gap-1.5 ${styles.icon}`}><AlertCircle size={14} /><span className="capitalize">{notice.priority}</span></div>
        <div className="flex items-center gap-1.5"><Clock size={14} />{new Date(notice.created_at).toLocaleDateString()} by {notice.posted_by_name}</div>
      </div>
    </motion.div>
  );
};
export default NoticeCard;
