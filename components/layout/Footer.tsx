import React from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";
import { useUser } from "../../context/UserContext";
import * as m from "../../src/paraglide/messages";

const SocialIcon: React.FC<{ icon: string; label: string }> = ({
  icon,
  label,
}) => (
  <button
    onClick={() => toast("Social links coming soon!", { icon: "🔗" })}
    aria-label={label}
    className="size-11 rounded-xl border border-surface-border bg-surface-border/30 flex items-center justify-center text-text-muted hover:text-primary active:text-primary hover:border-primary/30 transition-all md:hover:-translate-y-1 active:scale-95"
  >
    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
      {icon}
    </span>
  </button>
);

const FooterLink: React.FC<{
  children: React.ReactNode;
  to: string;
}> = ({ children, to }) => (
  <li>
    <Link
      to={to}
      className="hover:text-primary transition-all duration-300 flex items-center gap-2 group"
    >
      <span className="w-0 h-[1px] bg-primary group-hover:w-3 transition-all duration-300"></span>
      {children}
    </Link>
  </li>
);

export const Footer: React.FC = () => {
  const { locale } = useLanguage();
  const { user } = useUser();
  void locale; // 确保语言切换时重渲染

  return (
    <footer className="bg-background border-t border-surface-border pt-20 pb-10 text-text-muted relative z-10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 lg:gap-16 mb-16 md:mb-20">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-4 space-y-8">
            <Link
              to="/"
              className="flex items-center gap-3 text-foreground group"
            >
              <span
                className="material-symbols-outlined text-primary !text-[28px] group-hover:scale-110 transition-transform"
                aria-hidden="true"
              >
                auto_awesome
              </span>
              <span className="font-bold text-2xl font-display tracking-tight group-hover:text-primary transition-colors">
                {m["common.appName"]()}
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm font-light">
              {m["footer.brandDescription"]()}
            </p>
            <div className="flex gap-4">
              <SocialIcon icon="hub" label="GitHub" />
              <SocialIcon icon="auto_fix" label="Instagram" />
              <SocialIcon icon="public" label="Website" />
            </div>
          </div>

          {/* The Spark - 占星/塔罗功能 */}
          <div className="md:col-span-2 space-y-5">
            <p className="text-foreground font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2" role="heading" aria-level={2}>
              <span
                className="material-symbols-outlined text-primary text-[14px]"
                aria-hidden="true"
              >
                auto_awesome
              </span>{" "}
              The Spark
            </p>
            <ul className="flex flex-col gap-3 text-xs font-medium">
              <FooterLink to="/horoscope">Birth Chart</FooterLink>
              <FooterLink to="/horoscope/report">Astrology Report</FooterLink>
              <FooterLink to="/tarot">Daily Tarot</FooterLink>
              <FooterLink to="/tarot/spread">Tarot Spread</FooterLink>
            </ul>
          </div>

          {/* The Silk - 商店/咨询 */}
          <div className="md:col-span-2 space-y-5">
            <p className="text-foreground font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2" role="heading" aria-level={2}>
              <span
                className="material-symbols-outlined text-primary text-[14px]"
                aria-hidden="true"
              >
                diamond
              </span>{" "}
              The Silk
            </p>
            <ul className="flex flex-col gap-3 text-xs font-medium">
              <FooterLink to="/shop">Shop Artifacts</FooterLink>
              <FooterLink to="/experts">Expert Guides</FooterLink>
              <FooterLink to="/booking">Book Session</FooterLink>
            </ul>
          </div>

          {/* My Space - 用户中心 */}
          <div className="md:col-span-2 space-y-5">
            <p className="text-foreground font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2" role="heading" aria-level={2}>
              <span
                className="material-symbols-outlined text-primary text-[14px]"
                aria-hidden="true"
              >
                person
              </span>{" "}
              My Space
            </p>
            <ul className="flex flex-col gap-3 text-xs font-medium">
              <FooterLink to="/dashboard">Dashboard</FooterLink>
              <FooterLink to="/dashboard/archives">Archives</FooterLink>
              <FooterLink to="/dashboard/orders">Order History</FooterLink>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-2 space-y-5">
            <p className="text-foreground font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2" role="heading" aria-level={2}>
              <span
                className="material-symbols-outlined text-primary text-[14px]"
                aria-hidden="true"
              >
                mail
              </span>{" "}
              Newsletter
            </p>
            <p className="text-xs leading-relaxed">
              Lunar updates & exclusive drops.
            </p>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative">
                <input
                  type="email"
                  placeholder="Your email"
                  aria-label="Email address for newsletter"
                  className="w-full bg-surface-border/30 border border-surface-border rounded-xl px-4 py-3 text-foreground placeholder-white/20 focus:border-primary/50 outline-none text-xs transition-all pr-11"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 bg-primary text-background-dark rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-surface-border flex flex-col md:flex-row justify-between items-center gap-6 text-xs md:text-[10px] font-bold uppercase tracking-widest">
          <p className="text-text-muted italic">
            © 2025 Silk & Spark. Transcending the physical.
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <button
              onClick={() =>
                toast("Privacy policy coming soon", { icon: "📋" })
              }
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() =>
                toast("Terms of service coming soon", { icon: "📋" })
              }
              className="hover:text-foreground transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => toast("Cookie policy coming soon", { icon: "🍪" })}
              className="hover:text-foreground transition-colors"
            >
              Cookies
            </button>
{user?.isAdmin && (
              <Link
                to="/admin"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[10px]">
                  shield_person
                </span>{" "}
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
