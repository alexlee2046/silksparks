import React from "react";
import { Link } from "react-router-dom";
import { PATHS } from "../../lib/paths";

export const Cookies: React.FC = () => {
  const lastUpdated = "January 29, 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface-card/30 border-b border-surface-border">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <Link
            to={PATHS.HOME}
            className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-text-muted mt-4">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="prose prose-invert prose-purple max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              1. What Are Cookies?
            </h2>
            <p className="text-text-muted leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a
              website. They are widely used to make websites work more efficiently, provide
              a better user experience, and give website owners information about how their
              site is being used.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              2. How We Use Cookies
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              Silk & Spark uses cookies and similar technologies for the following purposes:
            </p>

            <div className="space-y-6">
              <div className="p-6 bg-surface-card/30 rounded-xl border border-surface-border">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  Essential Cookies
                </h3>
                <p className="text-text-muted leading-relaxed">
                  These cookies are necessary for the website to function properly. They enable
                  core functionality such as security, account authentication, and session
                  management. You cannot opt out of these cookies as they are required for the
                  site to work.
                </p>
                <p className="text-text-muted mt-3 text-sm">
                  <strong className="text-foreground">Examples:</strong> Authentication tokens,
                  shopping cart contents, security cookies
                </p>
              </div>

              <div className="p-6 bg-surface-card/30 rounded-xl border border-surface-border">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">settings</span>
                  Functional Cookies
                </h3>
                <p className="text-text-muted leading-relaxed">
                  These cookies remember your preferences and choices to provide enhanced
                  features and personalization. They may be set by us or by third-party
                  providers whose services we have added to our pages.
                </p>
                <p className="text-text-muted mt-3 text-sm">
                  <strong className="text-foreground">Examples:</strong> Language preferences,
                  theme settings, saved birth chart data
                </p>
              </div>

              <div className="p-6 bg-surface-card/30 rounded-xl border border-surface-border">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Analytics Cookies
                </h3>
                <p className="text-text-muted leading-relaxed">
                  These cookies help us understand how visitors interact with our website by
                  collecting and reporting information anonymously. This helps us improve our
                  site and services.
                </p>
                <p className="text-text-muted mt-3 text-sm">
                  <strong className="text-foreground">Examples:</strong> Pages visited, time
                  spent on site, error reports
                </p>
              </div>

              <div className="p-6 bg-surface-card/30 rounded-xl border border-surface-border">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">campaign</span>
                  Marketing Cookies
                </h3>
                <p className="text-text-muted leading-relaxed">
                  These cookies may be set through our site by our advertising partners. They
                  may be used to build a profile of your interests and show you relevant
                  advertisements on other sites. They do not store personal information directly.
                </p>
                <p className="text-text-muted mt-3 text-sm">
                  <strong className="text-foreground">Examples:</strong> Social media pixels,
                  remarketing tags
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              3. Third-Party Cookies
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We use services from the following third parties that may set cookies:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>
                <strong className="text-foreground">Supabase:</strong> Authentication and
                database services
              </li>
              <li>
                <strong className="text-foreground">Stripe:</strong> Payment processing
              </li>
              <li>
                <strong className="text-foreground">Vercel:</strong> Website hosting and
                analytics
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              4. Managing Cookies
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              You can control and manage cookies in several ways:
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">Browser Settings</h3>
            <p className="text-text-muted leading-relaxed mb-4">
              Most browsers allow you to view, delete, and block cookies. The process varies
              by browser:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 mb-6">
              <li>Chrome: Settings &gt; Privacy and Security &gt; Cookies</li>
              <li>Firefox: Options &gt; Privacy & Security &gt; Cookies</li>
              <li>Safari: Preferences &gt; Privacy &gt; Cookies</li>
              <li>Edge: Settings &gt; Privacy &gt; Cookies</li>
            </ul>

            <p className="text-text-muted leading-relaxed">
              <strong className="text-foreground">Note:</strong> Blocking all cookies may
              impact your experience on our site. Some features may not work properly if
              essential cookies are disabled.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              5. Local Storage
            </h2>
            <p className="text-text-muted leading-relaxed">
              In addition to cookies, we use local storage to store certain information on
              your device. This includes your shopping cart contents, theme preferences, and
              cached data to improve performance. You can clear local storage through your
              browser's developer tools.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              6. Changes to This Policy
            </h2>
            <p className="text-text-muted leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our
              practices or for other operational, legal, or regulatory reasons. We will post
              the updated policy on this page with a new "Last updated" date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              7. Contact Us
            </h2>
            <p className="text-text-muted leading-relaxed">
              If you have questions about our use of cookies, please contact us at:
            </p>
            <p className="text-text-muted mt-4">
              <strong className="text-foreground">Email:</strong> privacy@silkandspark.com
            </p>
          </section>
        </div>

        {/* Related Links */}
        <div className="mt-16 pt-8 border-t border-surface-border">
          <p className="text-text-muted mb-4">Related policies:</p>
          <div className="flex flex-wrap gap-4">
            <Link
              to={PATHS.LEGAL_PRIVACY}
              className="text-primary hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to={PATHS.LEGAL_TERMS}
              className="text-primary hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
