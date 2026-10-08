import React, { useMemo } from 'react';
import { FlaskConical, Download, Eye, CheckCircle2, Clock } from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';
import { useBookingVerification } from '../../context/BookingVerification';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/**
 * SharedLabReportsPanel
 * ---------------------------------------------------------------------------
 * The doctor-facing end of the lab hand-off. A report shared by the laboratory
 * via "Share to Doctor" appears here immediately, scoped to the signed-in
 * doctor (a radiologist sees every shared report).
 *
 * Only report metadata is listed - patient, test, date, findings, and the
 * attached PDF when one was uploaded. Marking a report reviewed is what flips
 * it from "New" to "Reviewed".
 */
export function SharedLabReportsPanel() {
  const { currentUser } = useHealthcare();
  const { sharedReports, reportsForDoctor, markReportSeen } = useBookingVerification();

  const role = String(currentUser?.role || '').toUpperCase();
  const isRadiologist = role.includes('RADIOLOGIST');

  const mine = useMemo(
    () => (isRadiologist ? sharedReports : reportsForDoctor(currentUser?.name)),
    [isRadiologist, sharedReports, reportsForDoctor, currentUser]
  );

  const unseen = mine.filter((r) => !r.seen).length;

  const downloadAttachment = (r) => {
    if (!r.attachment) return;
    const a = document.createElement('a');
    const slug = (s) => String(s || 'report').replace(/[^a-z0-9\-_]+/gi, '-');
    a.href = r.attachment;
    a.download = `${slug(r.testName)}-${slug(r.patientName)}.pdf`;
    a.click();
  };

  return (
    <Card
      title="Reports Shared From Laboratory"
      subtitle={
        unseen > 0
          ? `${unseen} new report${unseen === 1 ? '' : 's'} awaiting your review`
          : `${mine.length} report${mine.length === 1 ? '' : 's'} on file`
      }
      headerAction={
        unseen > 0 ? (
          <Badge variant="warning">
            <Clock className="w-3 h-3" /> {unseen} new
          </Badge>
        ) : null
      }
    >
      {mine.length === 0 ? (
        <div className="py-8 text-center">
          <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No reports shared yet</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Reports appear here as soon as the laboratory shares them with you.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {mine.map((r) => (
            <li
              key={r.id}
              className={`p-3 rounded-2xl border transition-colors ${
                r.seen
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  : 'border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.testName}</span>
                    {r.seen ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3" /> Reviewed
                      </Badge>
                    ) : (
                      <Badge variant="info">
                        <Eye className="w-3 h-3" /> New
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {r.patientName} · <span className="font-mono">{r.patientId}</span>
                    {r.category ? ` · ${r.category}` : ''}
                  </p>
                  {r.findings && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 max-w-xl">
                      <span className="font-semibold">Findings:</span> {r.findings}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Shared by {r.sharedBy || 'Laboratory'} · {new Date(r.sharedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!r.seen && (
                    <Button size="sm" variant="primary" onClick={() => markReportSeen(r.id)}>
                      <Eye className="w-3.5 h-3.5" /> Mark Reviewed
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAttachment(r)}
                    disabled={!r.attachment}
                    title={r.attachment ? 'Download attached PDF' : 'No file was attached'}
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default SharedLabReportsPanel;