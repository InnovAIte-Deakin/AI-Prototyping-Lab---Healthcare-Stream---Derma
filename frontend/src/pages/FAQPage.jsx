import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { uiTokens } from '../components/Layout';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is DermaAI?',
          a: 'DermaAI is an AI-powered teledermatology platform that connects patients with board-certified dermatologists. Patients can upload photos of skin concerns, receive instant AI-generated preliminary analysis, and then get professional medical guidance from qualified specialists.',
        },
        {
          q: 'Is DermaAI a real medical service?',
          a: 'No, DermaAI is currently a Proof of Concept (POC) for educational and demonstration purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. The platform showcases how AI technology could assist in dermatology, but should not be used for actual medical decisions.',
        },
        {
          q: 'Who operates DermaAI?',
          a: 'DermaAI is a project developed for educational purposes. The "doctors" and "clinics" shown in the platform are fictional entities created for demonstration. In a production environment, this would be operated by a licensed healthcare provider.',
        },
      ],
    },
    {
      category: 'AI Analysis',
      questions: [
        {
          q: 'How does the AI analysis work?',
          a: "Our AI analysis is powered by Google's Gemini AI. When you upload a photo, the AI examines the image and provides preliminary educational information about potential skin conditions it identifies. This analysis happens in seconds and is meant to provide initial insights, which should then be reviewed by a qualified healthcare professional.",
        },
        {
          q: 'Can I trust the AI results?',
          a: 'The AI provides educational insights only and should never be used as the sole basis for medical decisions. AI technology, while advanced, can make mistakes and cannot replace the clinical judgment of a trained dermatologist. Always consult with a healthcare professional for any medical concerns.',
        },
        {
          q: 'What happens after I upload an image?',
          a: 'After uploading, the AI immediately analyzes your image and provides preliminary insights. You can then review these insights and request a doctor review if needed. Once a doctor is assigned to your case, they will review both your image and the AI analysis before providing professional medical guidance.',
        },
      ],
    },
    {
      category: 'Doctor Consultations',
      questions: [
        {
          q: 'How do I connect with a doctor?',
          a: 'When you create an account, you can browse our directory of dermatologists and select one to be your primary doctor. When you submit a case for review, it will be assigned to your selected doctor who will then review it and provide medical guidance through our secure messaging system.',
        },
        {
          q: 'Are the doctors real?',
          a: 'In this POC version, the doctors are fictional personas created for demonstration purposes. In a production version, all doctors would be real, licensed, and board-certified dermatologists with verified credentials.',
        },
        {
          q: 'Can I change my assigned doctor?',
          a: 'Yes, you can change your doctor at any time from your patient dashboard, as long as you do not have any active cases pending review. Your case history will be preserved and accessible to you regardless of which doctor you are currently assigned to.',
        },
      ],
    },
    {
      category: 'Privacy & Security',
      questions: [
        {
          q: 'Is my data secure?',
          a: 'Yes, we take data security seriously. All communications are encrypted, and we follow healthcare data protection best practices. In a production environment, the platform would be HIPAA-compliant. Your images and medical information are only accessible to you and your assigned healthcare providers.',
        },
        {
          q: 'What happens to my uploaded images?',
          a: 'Your images are stored securely and are only used for the purpose of your dermatology consultation. They are accessible only to you and your assigned doctor. In a production environment, data retention policies would be clearly defined and compliant with healthcare regulations.',
        },
        {
          q: 'Can I delete my account and data?',
          a: 'Yes, you have control over your data. You can request deletion of your account and associated data. In a production version, this would be handled in accordance with data protection regulations and healthcare data retention requirements.',
        },
      ],
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'What photo formats are accepted?',
          a: 'We accept common image formats including JPEG, PNG, and WebP. For best results, take a clear, well-lit photo of the affected area. Avoid blurry images or photos with poor lighting as they may affect the quality of the AI analysis.',
        },
        {
          q: 'Is the platform available on mobile?',
          a: 'Yes, DermaAI is fully responsive and works on both desktop and mobile devices. You can access all features through your mobile browser - no app download required.',
        },
      ],
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Everything you need to know about DermaAI, our AI analysis, and how the platform works.
        </p>
      </section>

      {/* FAQ Notice */}
      <section className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> This is a Proof of Concept. Questions and answers reflect the demo
          nature of this platform.
        </p>
      </section>

      {/* FAQ Accordion by Category */}
      <section className="space-y-8">
        {faqs.map((category, catIndex) => (
          <div key={category.category}>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{category.category}</h2>
            <div className="space-y-3">
              {category.questions.map((faq, qIndex) => {
                const itemKey = `${catIndex}-${qIndex}`;
                const isOpen = openItems[itemKey];

                return (
                  <div key={itemKey} className={`${uiTokens.card} overflow-hidden`}>
                    <button
                      onClick={() => toggleItem(itemKey)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <span className="font-medium text-slate-900 pr-4">{faq.q}</span>
                      <svg
                        className={`h-5 w-5 flex-shrink-0 text-slate-500 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-sm text-slate-600">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Still Have Questions */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold text-slate-900">Still Have Questions?</h2>
        <p className="mt-2 text-slate-600">
          Can't find the answer you're looking for? Reach out to our support team.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link to="/contact" className={`${uiTokens.primaryButton} h-12 rounded-full px-8`}>
            Contact Support
          </Link>
          <Link
            to="/about"
            className="flex h-12 items-center rounded-full border border-slate-200 bg-white px-8 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Learn More About Us
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Ready to Get Started?</h2>
        <p className="mt-2 text-slate-600">
          Experience AI-powered dermatology care today.
        </p>
        <div className="mt-6">
          <Link to="/login?mode=signup" className={`${uiTokens.primaryButton} h-12 rounded-full px-8`}>
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
