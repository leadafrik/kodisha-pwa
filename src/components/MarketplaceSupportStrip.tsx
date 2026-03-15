import React, { useEffect, useState } from "react";
import { Download, Mail, MessageCircle } from "lucide-react";
import InstallPrompt from "./InstallPrompt";
import { isInstalledAsApp } from "../utils/pwaInstall";

const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i";
const SUPPORT_EMAIL = "info@leadafrik.com";

interface MarketplaceSupportStripProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const MarketplaceSupportStrip: React.FC<MarketplaceSupportStripProps> = ({
  title = "Need help?",
  subtitle = "Support is available on WhatsApp, by email, and through the Agrisoko app.",
  className = "",
}) => {
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isInstalledAsApp());

    const handleInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  return (
    <>
      <div
        className={`rounded-2xl border border-stone-200 bg-white/92 px-4 py-3 shadow-sm backdrop-blur ${className}`.trim()}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900">{title}</p>
            <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={WHATSAPP_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
            >
              <MessageCircle className="h-4 w-4 text-[#A0452E]" />
              WhatsApp
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
            >
              <Mail className="h-4 w-4 text-[#A0452E]" />
              Email support
            </a>
            {!installed && (
              <button
                type="button"
                onClick={() => setShowInstall(true)}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
              >
                <Download className="h-4 w-4 text-[#A0452E]" />
                Install app
              </button>
            )}
          </div>
        </div>
      </div>

      <InstallPrompt isOpen={showInstall} onClose={() => setShowInstall(false)} />
    </>
  );
};

export default MarketplaceSupportStrip;
