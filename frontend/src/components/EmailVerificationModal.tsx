'use client';

'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, Clock, RotateCcw, X } from 'lucide-react';
import Button from './Button';
import { cn } from '@/lib/utils';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResendEmail?: () => Promise<void>;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onResendEmail
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<Date | null>(null);

  const handleResend = async () => {
    if (!onResendEmail || resendCount >= 3) return;
    
    setIsResending(true);
    try {
      await onResendEmail();
      setResendCount(prev => prev + 1);
      setLastResendTime(new Date());
    } catch (error) {
      console.error('Failed to resend email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const canResend = resendCount < 3 && (!lastResendTime || 
    (Date.now() - lastResendTime.getTime()) > 60000); // 1 minute cooldown

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Registration Successful!</p>
              <p className="text-sm text-gray-600 mt-1">
                We&apos;ve sent a verification email to:
              </p>
              <p className="text-sm font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded mt-2">
                {email}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Check your email inbox</li>
                  <li>Look for an email from Supabase</li>
                  <li>Click the verification link</li>
                  <li>You'll be automatically taken to the homepage</li>
                  <li>Then, you need to login</li>

                </ol>
              </div>
            </div>
          </div>

          {/* Didn't receive email */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-3">Didn&apos;t receive the email?</p>
            <ul className="text-xs text-gray-500 space-y-1 mb-4">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure the email address is correct</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>

            {onResendEmail && (
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResend}
                  loading={isResending}
                  disabled={!canResend || isResending}
                  className={cn(
                    "w-full",
                    !canResend && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {isResending ? 'Resending...' : 'Resend Email'}
                </Button>
                
                {resendCount > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Email sent {resendCount} time{resendCount > 1 ? 's' : ''}
                    {resendCount >= 3 && ' (maximum reached)'}
                  </p>
                )}
                
                {!canResend && lastResendTime && resendCount < 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    Please wait before requesting another email
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <Button
            onClick={onClose}
            variant="primary"
            className="w-full"
          >
            Got it, thanks!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;