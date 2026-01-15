import React from 'react';

const DisclaimerBanner = ({ className = '' }) => {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5 ${className}`}
      role="note"
      aria-label="AI disclaimer"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 flex-shrink-0">
        <svg
          className="h-5 w-5 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-amber-800">Important Notice</p>
        <p className="mt-1 text-sm text-amber-700 leading-relaxed">
          This AI-generated report is for informational purposes only and is not a medical diagnosis.
          Always consult a qualified healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
