import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';
import { ROLE_DETAILS } from '../../utils/roleDetector';
import { Button } from '../ui/Button';

export function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser } = useHealthcare();
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // If roles specified, check permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    const userRoleDetails = ROLE_DETAILS[currentUser.role];
    const defaultRoute = userRoleDetails?.defaultRoute || '/overview';

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Your current access role (<span className="font-semibold text-rose-600 dark:text-rose-400">{currentUser.role}</span>) does not have authorization to view this healthcare operating module.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
            Go Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(defaultRoute)}>
            Return to Authorized Portal
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
