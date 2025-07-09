import Head from 'next/head'

export default function IOSStandaloneMeta() {
  return (
    <Head>
      {/* iOS Standalone App Meta Tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Contact Manager" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="Contact Manager" />
      <meta name="theme-color" content="#22c55e" />
      <meta name="msapplication-TileColor" content="#22c55e" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* iOS Startup Images */}
      <link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/logo.png" />
      <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/logo.png" />
      <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" href="/logo.png" />
      <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/logo.png" />
      <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/logo.png" />
      <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" href="/logo.png" />
      
      {/* Web App Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* iOS Icons */}
      <link rel="apple-touch-icon" href="/logo.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/logo.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/logo.png" />
    </Head>
  )
} 