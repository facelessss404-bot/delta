import React, { useCallback, useContext, useEffect, useState } from 'react';
import { CalendarOff, Check, Download, LoaderCircle, Plus, Trash2, X, ShieldCheck, UserCheck } from 'lucide-react';
import { AuthContext } from '../context/authStateContext';
import leaveService from '../services/leaveService';
import api from '../services/api';
import LeaveRequestForm from '../components/LeaveRequestForm';
import LeaveStatusBadge from '../components/LeaveStatusBadge';
import { downloadApiExport } from '../utils/exportUtils';

const Leaves = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [cadetsList, setCadetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const staff = ['admin', 'commander'].includes(user?.role);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await leaveService.getLeaves();
      setLeaves(data);

      if (staff) {
        // Load active cadets for direct leave assignment
        api.get('/cadets').then(({ data: cData }) => setCadetsList(cData)).catch(() => {});
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load leave requests.');
    } finally {
      setLoading(false);
    }
  }, [staff]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const requestLeave = async (data) => {
    if (pendingAction) return;
    setPendingAction('create');
    setError('');
    setSuccessMessage('');
    try {
      await leaveService.createLeave(data);
      setShowForm(false);
      setSuccessMessage(
        staff
          ? 'Official leave granted! The cadet will be marked On Leave for all scheduled sessions during this period.'
          : 'Leave request submitted successfully for commander review.'
      );
      await loadLeaves();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit leave request.');
    } finally {
      setPendingAction(null);
    }
  };

  const review = async (id, status) => {
    if (pendingAction) return;
    const reviewer_remarks = window.prompt(`Optional remarks for this ${status} decision:`);
    if (reviewer_remarks === null) return;
    setPendingAction(id);
    setError('');
    setSuccessMessage('');
    try {
      await leaveService.reviewLeave(id, { status, reviewer_remarks });
      if (status === 'approved') {
        setSuccessMessage('Leave approved! The cadet is now officially marked On Leave for all daily sessions during these dates.');
      }
      await loadLeaves();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to review the request.');
    } finally {
      setPendingAction(null);
    }
  };

  const remove = async (id) => {
    if (pendingAction || !window.confirm('Delete this leave request?')) return;
    setPendingAction(id);
    setError('');
    setSuccessMessage('');
    try {
      await leaveService.deleteLeave(id);
      await loadLeaves();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete the request.');
    } finally {
      setPendingAction(null);
    }
  };

  const isPending = Boolean(pendingAction);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10 text-white">
      {/* Header Banner */}
      <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3 text-gold shadow-lg shadow-gold/5">
            <CalendarOff size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Leave & Absence Management</h1>
            <p className="text-sm text-white/50">
              {staff
                ? 'Review cadet leave requests and grant full-day excused leaves with automatic attendance synchronization.'
                : 'Submit and follow your official academy leave requests.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {staff && (
            <button
              type="button"
              onClick={() => downloadApiExport('/reports/export/leaves', 'delta_squad_leaves.csv')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/80 hover:bg-gold/20 hover:text-gold hover:border-gold/30 transition cursor-pointer"
            >
              <Download size={16} />
              Export Leaves CSV
            </button>
          )}
          <button
            disabled={isPending}
            onClick={() => setShowForm(!showForm)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-darkGreen shadow-md shadow-gold/20 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            <Plus size={17} />
            {staff ? 'Grant Cadet Leave' : 'Request Leave'}
          </button>
        </div>
      </div>

      {/* Info notice about full day leave reflection */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-gold/20 bg-gold/[0.05] p-4 text-xs text-gold/90">
        <ShieldCheck className="shrink-0 text-gold" size={17} />
        <span>
          <strong>Academy Leave Policy:</strong> Approved leave counts as a full-day excused absence. When granted or approved by Command, all attendance sessions scheduled on those dates automatically reflect <strong>On Leave</strong>.
        </span>
      </div>

      {showForm && (
        <LeaveRequestForm
          submitting={pendingAction === 'create'}
          onSubmit={requestLeave}
          onCancel={() => setShowForm(false)}
          isStaff={staff}
          cadets={cadetsList}
        />
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-3xl p-10 text-center text-sm text-white/50">
          Loading leave requests…
        </div>
      ) : leaves.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <CalendarOff className="mx-auto mb-3 text-white/20" size={36} />
          <h2 className="text-lg font-bold text-white">No leave requests recorded</h2>
          <p className="mt-1 text-sm text-white/50">
            {staff ? 'Submitted cadet requests and direct grants will appear here.' : 'Your submitted leave requests will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => {
            const isApproved = leave.status === 'approved';
            return (
              <article
                key={leave.id}
                className={`glass-panel rounded-2xl p-5 border transition ${
                  isApproved ? 'border-cyan-400/20 bg-cyan-950/[0.07]' : 'border-white/10'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-bold text-white text-base">
                        {staff ? leave.cadet_name : 'Leave Request'}
                      </h2>
                      {leave.roll_no && (
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono text-white/70">
                          {leave.roll_no}
                        </span>
                      )}
                      <LeaveStatusBadge status={leave.status} />
                      {isApproved && (
                        <span className="rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                          Full-Day Active
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-white/60">
                      Span: {new Date(leave.start_date).toLocaleDateString()} — {new Date(leave.end_date).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/80">{leave.reason}</p>
                    {leave.reviewer_remarks && (
                      <p className="mt-3 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2 text-xs text-white/70">
                        <span className="text-gold font-semibold">Command Remarks:</span> {leave.reviewer_remarks}
                        {leave.reviewer_name ? ` (by ${leave.reviewer_name})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {staff && leave.status === 'pending' && (
                      <>
                        <button
                          disabled={isPending}
                          onClick={() => review(leave.id, 'approved')}
                          className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-emerald-400/15 border border-emerald-400/30 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/25 transition disabled:opacity-60"
                        >
                          <Check size={15} />
                          {pendingAction === leave.id ? (
                            <>
                              <LoaderCircle size={14} className="animate-spin" />
                              Saving…
                            </>
                          ) : (
                            'Approve & Excuse Attendance'
                          )}
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => review(leave.id, 'rejected')}
                          className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-red-400/15 border border-red-400/30 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-400/25 transition disabled:opacity-60"
                        >
                          <X size={15} />
                          Reject
                        </button>
                      </>
                    )}
                    {(staff || leave.status === 'pending') && (
                      <button
                        disabled={isPending}
                        onClick={() => remove(leave.id)}
                        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-white/10 p-2 text-white/40 hover:border-red-400/30 hover:text-red-400 transition disabled:opacity-60"
                        title="Delete leave record"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaves;
