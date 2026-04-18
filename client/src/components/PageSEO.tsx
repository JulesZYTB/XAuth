import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface PageSEOProps {
  title?: string;
  description?: string;
  language?: string;
}

export default function PageSEO({ title, description, language }: PageSEOProps) {
  const { t, i18n } = useTranslation();
  
  const siteTitle = "XAuth Omega";
  const finalTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} | Enterprise Software Protection`;
  const finalDesc = description || t("seo.default_desc", "XAuth Omega is the ultimate cross-platform enterprise licensing infrastructure.");

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <html lang={language || i18n.language} />
      
      {/* Dynamic Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
    </Helmet>
  );
}
