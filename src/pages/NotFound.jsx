import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 shadow-sm">
        <Stethoscope className="w-10 h-10" />
      </div>

      <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
        404 Error
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1 mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
        The healthcare page you're looking for doesn't exist or has been relocated within the Arogya Queue operating network.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="md" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Go Back
        </Button>
        <Button variant="primary" size="md" onClick={() => navigate('/overview')} icon={Home}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
