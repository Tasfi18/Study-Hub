'use client';

import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      iconColor: 'text-amber-600',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className="absolute top-20 right-16 left-4 md:left-auto z-50 animate-in slide-in-from-top-5 duration-300">
      <div className={`flex items-start gap-3 w-full md:max-w-md p-4 rounded-xl border-2 ${bgColor} ${borderColor} shadow-lg backdrop-blur-sm`}>
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className={`flex-1 text-sm font-medium ${textColor} leading-relaxed`}>{message}</p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
