import { useEffect, useRef } from "react";

type TurnstileProps = {
  onVerify: (token: string) => void;
  siteKey?: string;
};

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback: () => void;
  }
}

export default function Turnstile({ onVerify, siteKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const finalSiteKey = siteKey || (import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY as string);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!document.getElementById("cloudflare-turnstile-script")) {
      const script = document.createElement("script");
      script.id = "cloudflare-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: finalSiteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            theme: "dark",
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
        }
      }
    };

    // If script is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
    } else {
      // Otherwise wait for it to load
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, finalSiteKey]);

  return <div ref={containerRef} className="cf-turnstile" />;
}
