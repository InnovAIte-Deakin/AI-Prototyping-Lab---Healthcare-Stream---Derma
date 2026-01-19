import React from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   DisclaimerBanner — Important but not alarming

   Medical disclaimers are necessary, but they shouldn't feel scary.
   This design is warm yet clear about the limitations.
   ═══════════════════════════════════════════════════════════════════════════ */

const DisclaimerBanner = ({ className = '' }) => (
  <div
    className={`flex items-start gap-4 rounded-xl bg-cream-100 border border-cream-300 p-4 ${className}`}
    role="note"
    aria-label="AI disclaimer"
  >
    <div className="flex-shrink-0 mt-0.5">
      <svg className="h-5 w-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-medium text-charcoal-700">
        For informational purposes only
      </p>
      <p className="mt-1 text-sm text-charcoal-600 leading-relaxed">
        AI analysis provides insights, not diagnoses. Always consult a healthcare professional
        for medical advice. If you have an emergency, please contact your local emergency services.
      </p>
    </div>
  </div>
);

export default DisclaimerBanner;
