import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  structuredData?: object;
};

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  structuredData,
}: SEOProps) {

  const isOrg =
    typeof window !== "undefined" &&
    (window.location.hostname.endsWith("dreamxec.org") ||
     new URLSearchParams(window.location.search).get("domain") === "dreamxec.org" ||
     localStorage.getItem("dx_client_domain") === "dreamxec.org");

  const siteName = isOrg ? "DreamXec Academic Foundation (DAF)" : "DreamXec";

  const finalTitle = `${title} | ${siteName}`;

  const finalDescription =
    description ||
    "We're India's first online platform that helps raise funds exclusively for student led innovation projects. Our mission is to lead the unlocking of immense potential of India’s youth and transforming their innovative ideas into real-world impact. We are looking to energise research and innovation during college by creating a dynamic platform where students, mentors, and donors come together to shape the future. We are here to inspire the spirit of “Research Karega India, Toh Badega India”—believing that sincere efforts today will forge a prosperous, self-reliant, and vibrant India in the decades to come.";

  const finalImage =
    image || (isOrg ? "https://dreamxec.org/og-image.png" : "https://dreamxec.com/og-image.png");

  const baseDomain = isOrg ? "https://dreamxec.org" : "https://dreamxec.com";
  const canonicalUrl =
    url ||
    (typeof window !== "undefined"
      ? `${baseDomain}${window.location.pathname}`
      : baseDomain);

  return (
    <Helmet>

      {/* Basic SEO */}
      <title>{finalTitle}</title>

      <meta name="description" content={finalDescription} />

      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph (LinkedIn / WhatsApp / Facebook) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* Structured Data (optional) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

    </Helmet>
  );
}