import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">DermaAI</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                AI-Powered
              </span>
            </div>
            <p className="text-sm text-slate-600">
              AI-powered teledermatology connecting patients with board-certified dermatologists.
            </p>
            <p className="text-xs text-slate-400">
              This is a Proof of Concept for educational purposes only.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Platform
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Our Doctors
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/try-anonymous" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Try Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@dermaai.clinic" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  support@dermaai.clinic
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>123 Medical Plaza<br />Melbourne, VIC 3000</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(03) 9XXX XXXX</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-slate-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              © {currentYear} DermaAI. For educational and demonstration purposes only.
            </p>
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="cursor-default">Privacy Policy</span>
              <span className="cursor-default">Terms of Service</span>
              <span className="cursor-default">Medical Disclaimer</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-amber-600">
            ⚠️ This is NOT a real medical service. Do not use for actual medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
