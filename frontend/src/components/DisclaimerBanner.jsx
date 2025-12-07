import React from 'react';

const DisclaimerBanner = ({ className = '' }) => {
  return (
    <div
      className={`flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm ${className}`}
      role="note"
      aria-label="AI disclaimer"
    >
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
        !
      </div>
      <div className="space-y-1 text-sm leading-relaxed">
        <p className="font-semibold text-amber-800">Important</p>
        <p>
          This AI-generated report is not a medical diagnosis. Always consult a qualified healthcare professional.
        </p>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
