import React from "react";
import { Link } from "react-router-dom";
import { PATHS } from "../../lib/paths";

export const Privacy: React.FC = () => {
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
            Privacy Policy
          </h1>
          <p className="text-text-muted mt-4">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="prose prose-invert prose-purple max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              1. Introduction
            </h2>
            <p className="text-text-muted leading-relaxed">
              Welcome to Silk & Spark ("we," "our," or "us"). We are committed to protecting
              your personal information and your right to privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you visit our
              website and use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Personal Information
            </h3>
            <ul className="list-disc list-inside text-text-muted space-y-2 mb-6">
              <li>Name and email address when you create an account</li>
              <li>Birth date, time, and location for astrology services</li>
              <li>Payment information when you make purchases</li>
              <li>Shipping address for physical product orders</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mb-3">
              Automatically Collected Information
            </h3>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
              <li>Pages visited and time spent on our site</li>
              <li>Referring website or source</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>Provide personalized astrology and tarot readings</li>
              <li>Process transactions and send related information</li>
              <li>Send you newsletters and promotional communications (with your consent)</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Improve our website and services</li>
              <li>Detect, prevent, and address technical issues or fraud</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              4. Information Sharing
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>Service providers who assist in our operations (payment processing, hosting)</li>
              <li>Expert consultants you choose to book sessions with</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              5. Data Security
            </h2>
            <p className="text-text-muted leading-relaxed">
              We implement appropriate technical and organizational security measures to protect
              your personal information. However, no electronic transmission over the Internet
              can be guaranteed to be 100% secure. We encourage you to use strong passwords
              and to be cautious about what information you share online.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              6. Your Rights
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Withdraw consent for marketing communications</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              7. Children's Privacy
            </h2>
            <p className="text-text-muted leading-relaxed">
              Our services are not directed to individuals under the age of 16. We do not
              knowingly collect personal information from children. If you believe we have
              collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              8. Changes to This Policy
            </h2>
            <p className="text-text-muted leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the "Last updated"
              date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              9. Contact Us
            </h2>
            <p className="text-text-muted leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices,
              please contact us at:
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
              to={PATHS.LEGAL_TERMS}
              className="text-primary hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to={PATHS.LEGAL_COOKIES}
              className="text-primary hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
