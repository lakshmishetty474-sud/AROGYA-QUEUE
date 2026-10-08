import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';
import { formatTime } from '../../utils/formatters';

export function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, setNotifications } = useHealthcare();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleItemClick = (notif) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-50 slide-in-from-right">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Hospital Alerts</h3>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-teal-600 text-white">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <button
            onClick={markAllRead}
            className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
          <button
            onClick={clearAll}
            className="text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No notifications</p>
              <p className="text-[11px] text-slate-400">You are all caught up with live hospital operations.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isEmergency = notif.type === 'emergency';
              const isWarning = notif.type === 'warning';
              const isSuccess = notif.type === 'success';

              const Icon = isEmergency
                ? AlertCircle
                : isWarning
                ? AlertTriangle
                : isSuccess
                ? CheckCircle2
                : Info;

              const iconColor = isEmergency
                ? 'text-rose-600 dark:text-rose-400'
                : isWarning
                ? 'text-amber-600 dark:text-amber-400'
                : isSuccess
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-sky-600 dark:text-sky-400';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer flex gap-3 ${
                    notif.read
                      ? 'opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      : 'bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 border border-teal-100/50 dark:border-teal-900/40 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isEmergency ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
