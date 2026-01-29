import React from "react";
import { Link } from "react-router-dom";
import { PATHS } from "../../lib/paths";

export const Terms: React.FC = () => {
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
            Terms of Service
          </h1>
          <p className="text-text-muted mt-4">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="prose prose-invert prose-purple max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-text-muted leading-relaxed">
              By accessing or using Silk & Spark ("the Service"), you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please do not use
              our services. We reserve the right to modify these terms at any time, and your
              continued use of the Service constitutes acceptance of any changes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              2. Description of Services
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              Silk & Spark provides:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>Personalized astrology birth chart analysis and reports</li>
              <li>AI-powered tarot card readings and interpretations</li>
              <li>Connection with expert spiritual consultants</li>
              <li>Purchase of spiritual and wellness products</li>
              <li>Educational content about astrology and spirituality</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              3. Entertainment Purposes Disclaimer
            </h2>
            <p className="text-text-muted leading-relaxed">
              <strong className="text-foreground">Important:</strong> All astrology, tarot,
              and spiritual readings provided through our Service are for entertainment and
              informational purposes only. They should not be considered as professional advice
              for medical, legal, financial, or other important life decisions. We encourage
              you to consult qualified professionals for such matters.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              4. User Accounts
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
              <li>Be at least 16 years old to create an account</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              5. Purchases and Payments
            </h2>
            <h3 className="text-lg font-semibold text-foreground mb-3">Products</h3>
            <p className="text-text-muted leading-relaxed mb-4">
              All product purchases are subject to availability. Prices are displayed in USD
              and may be converted to your local currency at checkout. Shipping costs and
              delivery times vary by location.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">Consultations</h3>
            <p className="text-text-muted leading-relaxed mb-4">
              Expert consultation bookings are non-refundable once confirmed. Rescheduling
              is available up to 24 hours before your appointment. No-shows will not be
              refunded.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">Subscriptions</h3>
            <p className="text-text-muted leading-relaxed">
              Subscription services automatically renew unless cancelled. You may cancel
              your subscription at any time through your account settings. Cancellations
              take effect at the end of the current billing period.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              6. Refund Policy
            </h2>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>
                <strong className="text-foreground">Physical products:</strong> Refunds available
                within 30 days of receipt for unused items in original packaging
              </li>
              <li>
                <strong className="text-foreground">Digital services:</strong> Non-refundable
                once the service has been rendered
              </li>
              <li>
                <strong className="text-foreground">Subscriptions:</strong> Prorated refunds
                available within 7 days of renewal
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-text-muted leading-relaxed">
              All content on Silk & Spark, including text, graphics, logos, images, and
              software, is the property of Silk & Spark or its licensors and is protected
              by intellectual property laws. You may not reproduce, distribute, or create
              derivative works without our express written permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              8. Prohibited Conduct
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-text-muted space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or harmful content</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Harvest user data without consent</li>
              <li>Use automated systems to access the Service</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-text-muted leading-relaxed">
              To the maximum extent permitted by law, Silk & Spark shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising
              from your use of the Service. Our total liability shall not exceed the amount
              you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              10. Indemnification
            </h2>
            <p className="text-text-muted leading-relaxed">
              You agree to indemnify and hold harmless Silk & Spark, its officers, directors,
              employees, and agents from any claims, damages, losses, or expenses arising
              from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              11. Governing Law
            </h2>
            <p className="text-text-muted leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of
              the State of California, United States, without regard to its conflict of law
              provisions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              12. Contact Information
            </h2>
            <p className="text-text-muted leading-relaxed">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-text-muted mt-4">
              <strong className="text-foreground">Email:</strong> legal@silkandspark.com
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

export default Terms;
