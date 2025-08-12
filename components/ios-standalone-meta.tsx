"use client";
import { useEffect } from "react";
import Head from "next/head";

export default function IOSStandaloneMeta() {
  // useEffect(() => {
  //   if ("serviceWorker" in navigator) {
  //     window.addEventListener("load", () => {
  //       navigator.serviceWorker.register("/sw.js").catch(() => {});
  //     });
  //   }
  // }, []);
  return (
    <Head>
      {/*
      <link rel="manifest" href="/manifest.json" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Contact Manager" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="Contact Manager" />
      <meta name="theme-color" content="#22c55e" />
      <link rel="apple-touch-icon" href="/logo.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/logo.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/logo.png" />
      */}
    </Head>
  );
} 