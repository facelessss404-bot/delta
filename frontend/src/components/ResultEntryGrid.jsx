import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Save, Trash2 } from 'lucide-react';
import examService from '../services/examService';

const ResultEntryGrid = ({ exam, cadets, canDelete = false }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchExistingResults = useCallback(async () => {
    setLoading(true);
    try {
      const existing = await examService.getResults(exam.id);
      setResults(cadets.map((cadet) => {
        const cadetId = cadet.id || cadet._id;
        const found = existing.find((result) => String(result.cadet_id) === String(cadetId));
        return { cadet_id: cadetId, cadet_name: cadet.name, result_id: found?.id || null, marks_obtained: found?.marks_obtained ?? '', remarks: found?.remarks || '', saved: Boolean(found) };
      }));
    } catch (error) {
      // A short retry avoids rendering a permanently empty grid after a transient pooled-DB response.
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        const existing = await examService.getResults(exam.id);
        setResults(cadets.map((cadet) => {
          const cadetId = cadet.id || cadet._id;
          const found = existing.find((result) => String(result.cadet_id) === String(cadetId));
          return { cadet_id: cadetId, cadet_name: cadet.name, result_id: found?.id || null, marks_obtained: found?.marks_obtained ?? '', remarks: found?.remarks || '', saved: Boolean(found) };
        }));
      } catch (retryError) { console.error(retryError); }
    }
    setLoading(false);
  }, [cadets, exam.id]);

  useEffect(() => { fetchExistingResults(); }, [fetchExistingResults]);

  const updateRecord = (cadetId, changes) => setResults((current) => current.map((record) => record.cadet_id === cadetId ? { ...record, ...changes, saved: false } : record));
  const handleSave = async (record) => {
    if (record.marks_obtained === '') return;
    setSavingId(record.cadet_id);
    try {
      const saved = await examService.upsertResult({ exam_id: exam.id, cadet_id: record.cadet_id, marks_obtained: parseFloat(record.marks_obtained), remarks: record.remarks });
      setResults((current) => current.map((result) => result.cadet_id === record.cadet_id ? { ...result, result_id: saved.id, saved: true } : result));
    } catch (error) { console.error('Save failed', error); }
    setSavingId(null);
  };
  const handleDelete = async (record) => {
    if (!record.result_id || !window.confirm(`Delete ${record.cadet_name}'s result?`)) return;
    setDeletingId(record.result_id);
    try {
      await examService.deleteResult(record.result_id);
      setResults((current) => current.map((result) => result.result_id === record.result_id ? { ...result, result_id: null, marks_obtained: '', remarks: '', saved: false } : result));
    } catch (error) { console.error('Delete failed', error); }
    setDeletingId(null);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#C9A84C]" /></div>;
  return <div className="glass-panel mt-6 overflow-hidden rounded-xl"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 bg-[#0B1A13] text-xs uppercase text-white/50"><tr><th className="px-6 py-4">Cadet Name</th><th className="px-6 py-4">Marks (Max {exam.max_marks})</th><th className="px-6 py-4">Remarks</th><th className="px-6 py-4">Action</th></tr></thead><tbody className="divide-y divide-white/5 text-[#F5F5F0]">{results.map((record) => <tr key={record.cadet_id} className="transition-colors hover:bg-white/[0.02]"><td className="px-6 py-4 font-medium">{record.cadet_name}</td><td className="px-6 py-4"><input data-testid={`result-marks-${record.cadet_id}`} type="number" max={exam.max_marks} min="0" step="0.5" value={record.marks_obtained} onChange={(event) => updateRecord(record.cadet_id, { marks_obtained: event.target.value })} className="w-24 rounded border border-white/10 bg-[#0B1A13] px-3 py-1.5 outline-none focus:border-[#C9A84C]" /></td><td className="px-6 py-4"><input data-testid={`result-remarks-${record.cadet_id}`} type="text" placeholder="Optional" value={record.remarks || ''} onChange={(event) => updateRecord(record.cadet_id, { remarks: event.target.value })} className="w-full rounded border border-white/10 bg-[#0B1A13] px-3 py-1.5 outline-none focus:border-[#C9A84C]" /></td><td className="px-6 py-4"><div className="flex gap-2"><button data-testid={`save-result-${record.cadet_id}`} onClick={() => handleSave(record)} disabled={record.marks_obtained === '' || savingId === record.cadet_id} className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold transition-all ${record.saved ? 'bg-[#34D399]/10 text-[#34D399]' : record.marks_obtained === '' ? 'cursor-not-allowed bg-white/5 text-white/30' : 'border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20'}`}>{savingId === record.cadet_id ? <Loader2 size={14} className="animate-spin" /> : record.saved ? <Check size={14} /> : <Save size={14} />}{record.saved ? 'Saved' : 'Save'}</button>{canDelete && record.result_id && <button data-testid={`delete-result-${record.result_id}`} onClick={() => handleDelete(record)} disabled={deletingId === record.result_id} aria-label={`Delete ${record.cadet_name} result`} className="rounded border border-red-400/20 px-2 text-red-300 disabled:opacity-50">{deletingId === record.result_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>}</div></td></tr>)}</tbody></table></div></div>;
};

export default ResultEntryGrid;
