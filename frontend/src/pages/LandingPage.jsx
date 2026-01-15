import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════
   SkinScope Landing Page

   Story: The journey from skin concern to confident care

   This isn't a template. It's a story about a person who notices something
   on their skin, feels that flutter of worry, and finds clarity through
   technology and human expertise working together.
   ═══════════════════════════════════════════════════════════════════════════ */

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="-mt-8">
      {/* ═══════════════════════════════════════════════════════════════════
          Hero Section: The moment of discovery
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Subtle organic pattern - inspired by skin cells, not gradient blobs */}
        <div className="absolute inset-0 pattern-cells opacity-40" aria-hidden="true" />

        <div className="relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: The Story */}
            <div className="animate-enter">
              <p className="text-warm-600 font-medium mb-4 tracking-wide">
                For moments of uncertainty
              </p>

              <h1 className="heading-display text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
                Your skin tells a story.{' '}
                <span className="text-warm-600">
                  We help you understand it.
                </span>
              </h1>

              <p className="text-lg text-charcoal-600 leading-relaxed mb-8 max-w-xl">
                That new spot. That persistent rash. The questions that keep you up at night.
                SkinScope brings AI-powered insights and board-certified dermatologists
                together, so you can move from worry to clarity.
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => navigate('/login?mode=signup')}
                  className="btn-warm text-base px-8 py-4"
                >
                  Start Your Skin Journey
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/try-anonymous')}
                  className="btn-soft text-base px-8 py-4"
                >
                  Try It First
                </button>
              </div>

              {/* Human proof, not trust badges */}
              <div className="flex items-center gap-4 text-sm text-charcoal-500">
                <div className="flex -space-x-2">
                  {/* Abstract human figures - warm, not clinical */}
                  <div className="w-8 h-8 rounded-full bg-warm-200 border-2 border-cream-50 flex items-center justify-center">
                    <span className="text-warm-700 text-xs font-medium">S</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-deep-200 border-2 border-cream-50 flex items-center justify-center">
                    <span className="text-deep-700 text-xs font-medium">M</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sage-200 border-2 border-cream-50 flex items-center justify-center">
                    <span className="text-sage-700 text-xs font-medium">K</span>
                  </div>
                </div>
                <span>Thousands have found clarity. You can too.</span>
              </div>
            </div>

            {/* Right: The Experience (Product Preview) */}
            <div className="relative animate-enter" style={{ animationDelay: '150ms' }}>
              {/* Phone/App Mockup showing the actual product */}
              <div className="relative mx-auto max-w-sm">
                {/* Phone frame */}
                <div className="rounded-[2.5rem] bg-charcoal-900 p-3 shadow-2xl">
                  <div className="rounded-[2rem] bg-cream-50 overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-charcoal-900 text-white px-6 py-2 flex justify-between items-center text-xs">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2 bg-white/80 rounded-sm" />
                      </div>
                    </div>

                    {/* App content preview */}
                    <div className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-warm-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-charcoal-900">SkinScope</span>
                        </div>
                      </div>

                      {/* Analysis Result Preview */}
                      <div className="rounded-2xl bg-white border border-cream-300 p-4 shadow-sm">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-xl bg-cream-200 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="badge-sage text-[10px] mb-1">Analysis Complete</div>
                            <p className="text-sm font-medium text-charcoal-900">Low Risk Detected</p>
                            <p className="text-xs text-charcoal-500 mt-1">Common condition identified</p>
                          </div>
                        </div>
                      </div>

                      {/* Chat Preview */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-warm-600 text-xs">AI</span>
                          </div>
                          <div className="rounded-2xl rounded-tl-sm bg-cream-100 px-3 py-2 max-w-[80%]">
                            <p className="text-xs text-charcoal-700">Based on the image, this appears to be a common condition. Would you like more details?</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="rounded-2xl rounded-tr-sm bg-warm-500 text-white px-3 py-2 max-w-[80%]">
                            <p className="text-xs">Yes, tell me more</p>
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <button className="w-full rounded-xl bg-deep-600 text-white text-sm py-3 font-medium">
                        Request Doctor Review
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -right-4 top-20 badge-sage shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-sage-500 status-dot" />
                  AI Analyzed
                </div>

                {/* Floating doctor badge */}
                <div className="absolute -left-4 bottom-32 badge-deep shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-deep-500" />
                  Doctor Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          Story Section: The Journey
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-warm-600 font-medium mb-3">The journey</p>
          <h2 className="heading-display text-3xl sm:text-4xl mb-4">
            From concern to confidence
          </h2>
          <p className="text-charcoal-600 text-lg">
            We designed SkinScope around real human experiences, not workflows.
          </p>
        </div>

        {/* Journey Steps - Storytelling, not feature lists */}
        <div className="space-y-8 max-w-3xl mx-auto">
          {/* Step 1 */}
          <div className="card-warm p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center">
              <span className="text-warm-600 font-semibold text-xl">1</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                "What is this?"
              </h3>
              <p className="text-charcoal-600 leading-relaxed">
                You notice something on your skin. A spot that wasn't there before.
                A rash that won't go away. Instead of endless scrolling through scary
                search results, you take a photo. Clear, focused, just like the tips suggest.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-warm p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center">
              <span className="text-sage-600 font-semibold text-xl">2</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                "Okay, this helps."
              </h3>
              <p className="text-charcoal-600 leading-relaxed">
                Our AI—trained on millions of dermatology cases—analyzes your image in seconds.
                Not to diagnose, but to inform. You see possible conditions, understand risk levels,
                and finally have context instead of chaos.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-warm p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-deep-100 flex items-center justify-center">
              <span className="text-deep-600 font-semibold text-xl">3</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                "I need a real doctor."
              </h3>
              <p className="text-charcoal-600 leading-relaxed">
                Sometimes AI isn't enough. With one tap, your case goes to a board-certified
                dermatologist. Not a random one—your doctor. They review your images,
                chat with you directly, and give you the professional guidance you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          Human Element: The Doctors
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-cream-100/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-deep-600 font-medium mb-3">Real expertise</p>
              <h2 className="heading-display text-3xl sm:text-4xl mb-6">
                AI opens the door.{' '}
                <span className="text-deep-600">Doctors guide you through.</span>
              </h2>
              <p className="text-charcoal-600 text-lg leading-relaxed mb-6">
                We believe technology should enhance human connection, not replace it.
                Every dermatologist on SkinScope is board-certified, practicing, and
                genuinely invested in your skin health.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Board-certified dermatologists
                </li>
                <li className="flex items-center gap-3 text-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Direct, private conversations
                </li>
                <li className="flex items-center gap-3 text-charcoal-700">
                  <span className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Your history, always accessible
                </li>
              </ul>
            </div>

            {/* Doctor illustration - abstract, warm */}
            <div className="relative">
              <div className="rounded-3xl bg-white border border-cream-300 p-8 shadow-lg">
                <div className="flex items-start gap-5">
                  {/* Doctor avatar - stylized, warm */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-deep-400 to-deep-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <span className="badge-deep mb-2">Available Now</span>
                    <h4 className="text-lg font-semibold text-charcoal-900">Dr. Sarah Chen</h4>
                    <p className="text-charcoal-500 text-sm">Board-Certified Dermatologist</p>
                    <p className="text-charcoal-600 text-sm mt-3 leading-relaxed">
                      "Every skin concern deserves attention. I'm here to provide clarity and care."
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-cream-200 flex gap-3">
                  <button className="btn-deep flex-1 py-3">
                    Connect
                  </button>
                  <button className="btn-soft flex-1 py-3">
                    View Profile
                  </button>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full rounded-3xl bg-cream-200" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          Privacy Section: Because it matters
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="heading-display text-3xl sm:text-4xl mb-4">
            Your skin, your data, your privacy.
          </h2>
          <p className="text-charcoal-600 text-lg leading-relaxed mb-8">
            We handle sensitive information with the respect it deserves. Your images are encrypted,
            your conversations are private, and your data is never sold. Period.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="card-cream px-5 py-3 text-sm font-medium text-charcoal-700">
              HIPAA Compliant
            </div>
            <div className="card-cream px-5 py-3 text-sm font-medium text-charcoal-700">
              End-to-End Encrypted
            </div>
            <div className="card-cream px-5 py-3 text-sm font-medium text-charcoal-700">
              No Data Sales
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          Final CTA: The Invitation
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl bg-charcoal-900 p-10 sm:p-14 text-center relative overflow-hidden">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-5 pattern-dots" aria-hidden="true" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
                Ready to understand your skin better?
              </h2>
              <p className="text-charcoal-300 text-lg mb-8 max-w-xl mx-auto">
                No more uncertainty. No more late-night searches.
                Just clarity, care, and confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/login?mode=signup')}
                  className="btn-warm text-base px-8 py-4"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 text-base font-semibold text-white border border-charcoal-700 rounded-xl hover:bg-charcoal-800 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
