import { useState } from "react";
import { subscribeToNewsletter } from "../../../services/newsletterService";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Logo } from "../../../components/Logo";

export const DesktopFooter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email) return;
    setStatus("loading");
    setMessage("");

    try {
      await subscribeToNewsletter(email, "footer");
      setStatus("success");
      setMessage("Subscribed successfully!");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("error");
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Failed to subscribe");
      }
    }
  };

  return (
    <footer className="w-full bg-[#0F534A] text-white font-sans border-t-4 border-[#0B3D36] selection:bg-[#9EFC5F] selection:text-[#0F534A] relative">
      {/* Brand Quad-Accent Top Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FE4E1A] via-[#FFDD33] via-[#9EFC5F] to-[#18D7E8]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* 5-Column Grid: Brand + 3 Link Columns + Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/15 text-left">
          {/* Brand Info & Tagline (Cols 1-3) */}
          <div className="lg:col-span-3 space-y-4 pr-0 lg:pr-4">
            <div className="space-y-3">
              <Logo white showText={true} />

              {/* Expressive Handwritten Annotation Tagline */}
              <div>
                <p className="font-brush text-[#9EFC5F] text-xl md:text-2xl tracking-wide select-none inline-block -rotate-1 origin-left drop-shadow-sm">
                  Research. Reimagine. Realise.
                </p>
              </div>
            </div>

            <p className="text-white/80 font-sans font-normal text-sm leading-relaxed max-w-xs">
              India&apos;s first online platform empowering student-led research and turning innovative ideas into real-world impact.
            </p>
          </div>

          {/* Column 1: Platform (Cols 4-5) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-headline font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#9EFC5F] shadow-[1px_1px_0px_#121316] inline-block flex-shrink-0" />
              Platform
            </h4>
            <ul className="space-y-2.5 font-sans font-medium text-sm text-white/75">
              <li>
                <a
                  href="/campaigns"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Campaigns
                </a>
              </li>
              <li>
                <a
                  href="/clubs"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Clubs
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Company (Cols 6-7) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-headline font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FFDD33] shadow-[1px_1px_0px_#121316] inline-block flex-shrink-0" />
              Company
            </h4>
            <ul className="space-y-2.5 font-sans font-medium text-sm text-white/75">
              <li>
                <a
                  href="/about"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Our Mission
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Our Story
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Support (Cols 8-9) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-headline font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#18D7E8] shadow-[1px_1px_0px_#121316] inline-block flex-shrink-0" />
              Support
            </h4>
            <ul className="space-y-2.5 font-sans font-medium text-sm text-white/75">
              <li>
                <a
                  href="/faq"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="/eligibility"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Guidelines
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms-and-conditions"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a
                  href="/donation-policy"
                  className="hover:text-[#9EFC5F] hover:translate-x-1 transition-all duration-150 inline-block py-0.5"
                >
                  Donation Policy (DAF)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Stay in the Loop (Cols 10-12) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-white font-headline font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FE4E1A] shadow-[1px_1px_0px_#121316] inline-block flex-shrink-0" />
              Stay In The Loop
            </h4>
            <p className="text-sm text-white/80 font-sans font-normal leading-relaxed">
              Get updates on new campaigns, opportunities and stories.
            </p>

            {/* Tactile Neobrutalist Newsletter Input */}
            <div className="space-y-2 pt-1">
              <div className="flex items-stretch bg-white border-2 border-[#121316] shadow-[4px_4px_0px_#121316] focus-within:shadow-[4px_4px_0px_#9EFC5F] focus-within:border-white transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === "loading" || status === "success"}
                  className="flex-1 px-3.5 py-2.5 bg-transparent text-[#121316] placeholder:text-gray-400 font-sans font-medium text-sm focus:outline-none disabled:opacity-50 min-w-0"
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                />
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={status === "loading" || status === "success"}
                  aria-label="Subscribe to newsletter"
                  className="px-3.5 bg-[#9EFC5F] hover:bg-[#86E446] active:translate-x-0.5 active:translate-y-0.5 text-[#0F534A] border-l-2 border-[#121316] flex items-center justify-center font-bold transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === "success" ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>

              {status === "error" && (
                <p className="text-red-300 font-sans text-xs mt-1 font-medium">{message}</p>
              )}
              {status === "success" && (
                <p className="text-[#9EFC5F] font-sans text-xs mt-1 font-bold">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Footer: Legal Entity Disclosures, Copyright & Address */}
        <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
          <div className="text-xs text-white/60 leading-relaxed font-sans max-w-4xl space-y-1">
            <p>
              <strong>Platform Technology:</strong> Owned &amp; operated by FICPL Private Limited. 
              {" "}<strong>Research Grants &amp; Public Programmes:</strong> Facilitated by DreamXec Academic Foundation (DAF).
            </p>
            <p className="text-white/50">
              <strong>Registered Office:</strong> AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana 122103, India. 
              Trademark &apos;DreamXec&apos; is owned by the Founder individually and licensed non-exclusively.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-xs sm:text-sm font-sans text-white/70">
            {/* Left: Copyright */}
            <div>
              <p>© {new Date().getFullYear()} DreamXec. All rights reserved.</p>
            </div>

          {/* Center: Tactile Social Icons */}
          <div className="flex items-center gap-3">
            {[
              {
                name: "LinkedIn",
                href: "https://www.linkedin.com/company/dreamxec",
                svg: (
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                ),
              },
              {
                name: "Twitter/X",
                href: "https://twitter.com/dreamxec",
                svg: (
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                ),
              },
              {
                name: "Instagram",
                href: "https://www.instagram.com/dreamxec",
                svg: (
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                ),
              },
              {
                name: "YouTube",
                href: "https://youtube.com/@dreamxecindia",
                svg: (
                  <path d="M23.498 6.186a2.966 2.966 0 0 0-2.087-2.104C19.555 3.5 12 3.5 12 3.5s-7.555 0-9.411.582A2.966 2.966 0 0 0 .502 6.186 31.36 31.36 0 0 0 0 12a31.36 31.36 0 0 0 .502 5.814 2.966 2.966 0 0 0 2.087 2.104C4.445 20.5 12 20.5 12 20.5s7.555 0 9.411-.582a2.966 2.966 0 0 0 2.087-2.104A31.36 31.36 0 0 0 24 12a31.36 31.36 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
                ),
              },
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-[#9EFC5F] text-white hover:text-[#0F534A] border border-white/20 hover:border-[#121316] hover:shadow-[2px_2px_0px_#121316] transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  {social.svg}
                </svg>
              </a>
            ))}
          </div>

          {/* Right: Patriotic Footer Note */}
          <div>
            <p className="font-sans font-medium text-xs sm:text-sm text-white/80">
              Made with <span className="text-[#F4002C]">❤️</span> for India&apos;s future. 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
};
