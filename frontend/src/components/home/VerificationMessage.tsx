'use client';

import { CheckCircle, X } from 'lucide-react';

interface VerificationMessageProps {
  message: string;
  onClose: () => void;
}

export default function VerificationMessage({ message, onClose }: VerificationMessageProps) {
  return (
    <div className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-slide-up">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
          <CheckCircle className="w-6 h-6 text-teal-600" />
        </div>
        <p className="text-teal-800 font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-teal-600 hover:text-teal-800 transition-colors p-1"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
