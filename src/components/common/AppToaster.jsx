/**
 * Mounts the Sonner toaster once, at the app root.
 *
 * The app already has its own toast provider (AppContext.showToast). Sonner is
 * additive: it only serves components that import { toast } directly, such as
 * the Receptionist Approval Center, so existing notifications are untouched.
 *
 * Styling follows the dark desk theme used on the approval screens.
 */
import React from 'react';
import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={4200}
      toastOptions={{
        style: {
          background: '#111827',
          border: '1px solid #1F2937',
          color: '#E5E7EB',
        },
      }}
    />
  );
}

export default AppToaster;