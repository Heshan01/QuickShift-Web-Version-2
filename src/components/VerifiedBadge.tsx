import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { VerificationStatus } from '../types';

interface VerifiedBadgeProps {
  status?: VerificationStatus;
  className?: string;
  showText?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  status, 
  className = '',
  showText = false
}) => {
  if (status === 'verified') {
    return (
      <span className={`inline-flex items-center text-emerald-500 ${className}`} title="Verified Account">
        <CheckCircle2 className="h-4 w-4" />
        {showText && <span className="ml-1 text-xs font-medium">Verified</span>}
      </span>
    );
  }
  
  if (status === 'pending') {
    return (
      <span className={`inline-flex items-center text-amber-500 ${className}`} title="Pending Verification">
        <AlertCircle className="h-4 w-4" />
        {showText && <span className="ml-1 text-xs font-medium">Pending Verification</span>}
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className={`inline-flex items-center text-red-500 ${className}`} title="Verification Rejected">
        <AlertCircle className="h-4 w-4" />
        {showText && <span className="ml-1 text-xs font-medium">Unverified</span>}
      </span>
    );
  }
  
  return null;
};
