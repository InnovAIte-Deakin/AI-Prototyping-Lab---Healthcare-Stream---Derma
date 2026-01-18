import React, { useState } from 'react';
import { uiTokens } from '../components/Layout';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission (no actual backend call)
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Have questions about DermaAI? We're here to help. Reach out to our team and we'll get
          back to you as soon as possible.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Form */}
        <section className={`${uiTokens.card} p-6 sm:p-8`}>
          <h2 className="text-xl font-bold text-slate-900">Send Us a Message</h2>

          {submitted ? (
            <div className="mt-6 rounded-lg bg-emerald-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-emerald-800">Thank You!</h3>
              <p className="mt-2 text-sm text-emerald-700">
                Your message has been received (simulated). In a production environment, our team
                would respond within 24-48 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                className="mt-4 text-sm font-medium text-emerald-600 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className={`${uiTokens.primaryButton} w-full justify-center rounded-lg py-3`}
              >
                Send Message
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-slate-500">
            This is a demo form. No data is actually transmitted.
          </p>
        </section>

        {/* Contact Information */}
        <section className="space-y-6">
          {/* Contact Details Card */}
          <div className={`${uiTokens.card} p-6`}>
            <h2 className="text-xl font-bold text-slate-900">Contact Information</h2>
            <p className="mt-2 text-sm text-amber-600">
              ⚠️ This is fictional contact information for demonstration purposes.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-600">support@dermaai.clinic</p>
                  <p className="text-sm text-slate-600">info@dermaai.clinic</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Phone</p>
                  <p className="text-sm text-slate-600">(03) 9XXX XXXX</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Address</p>
                  <p className="text-sm text-slate-600">123 Medical Plaza</p>
                  <p className="text-sm text-slate-600">Melbourne, VIC 3000</p>
                  <p className="text-sm text-slate-600">Australia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Hours */}
          <div className={`${uiTokens.card} p-6`}>
            <h2 className="text-lg font-bold text-slate-900">Support Hours</h2>
            <p className="mt-1 text-xs text-slate-500">(Simulated)</p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Monday - Friday</span>
                <span className="font-medium text-slate-900">9:00 AM - 5:00 PM AEST</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Saturday</span>
                <span className="font-medium text-slate-900">10:00 AM - 2:00 PM AEST</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sunday</span>
                <span className="font-medium text-slate-500">Closed</span>
              </div>
            </div>
          </div>

          {/* Emergency Notice */}
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-red-800">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Medical Emergency
            </h2>
            <p className="mt-2 text-sm text-red-700">
              If you are experiencing a medical emergency, DO NOT use this platform. Call emergency
              services immediately:
            </p>
            <p className="mt-2 text-lg font-bold text-red-800">Triple Zero (000)</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;
