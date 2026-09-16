import React from 'react';

const LeaveStatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20',
    approved: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
    rejected: 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20'
  };
  return <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${styles[status]}`}>{status}</span>;
};
export default LeaveStatusBadge;
