import Script from "next/script";

export function ConsentScripts() {
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID;
  const adsId = process.env.NEXT_PUBLIC_ADS_ID;

  if (!gtagId && !adsId) return null;

  return (
    <>
      <Script id="consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent','default',{
            'ad_storage':'denied',
            'ad_user_data':'denied',
            'ad_personalization':'denied',
            'analytics_storage':'denied'
          });
        `}
      </Script>
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
      />
      <Script id="gtag-config" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          ${gtagId ? `gtag('config', '${gtagId}');` : ""}
          ${adsId ? `gtag('config', '${adsId}');` : ""}
        `}
      </Script>
    </>
  );
}