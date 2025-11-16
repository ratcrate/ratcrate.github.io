// src/components/Footer.jsx
import React, { useEffect, useState } from "react";

/**
 * Minimal footer component with:
 * - links: Docs, Repo, Privacy, Terms, Contact
 * - optional sponsor (github sponsorship link)
 * - small visitor counter (uses CountAPI - public)
 *
 * You must create two static pages under public/: /privacy.html and /terms.html
 * or route to suitable pages in your site.
 */

const Footer = ({
  repoUrl = "https://github.com/ratcrate/ratcrate.github.io",
  docsUrl = "https://ratcrate.github.io/docs", // adjust if different
  contactMail = "mailto:qbitai@gmail.com",
  sponsorsUrl = "https://github.com/sponsors/ratcrate", // change to your sponsor url
  countApiNamespace = "ratcrate.github.io", // change if you want separate counter
  countApiKey = "site-visitors" // key within namespace
}) => {
  const [visitors, setVisitors] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    // CountAPI (https://countapi.xyz/) - easiest no-backend counter
    // We'll use "get" to fetch the current value (does not increment).
    // If you want to increment on each page load, call:
    // https://api.countapi.xyz/hit/{namespace}/{key}
    // But often you want "count" (increment) only on real visits — be careful.
    // Here we GET the 'value' so you can do either, depending on your privacy choice.

    const namespace = encodeURIComponent(countApiNamespace);
    const key = encodeURIComponent(countApiKey);

    const url = `https://api.countapi.xyz/get/${namespace}/${key}`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (json && typeof json.value !== "undefined") {
          setVisitors(json.value);
        } else {
          // If the namespace/key doesn't exist, create it with value=0
          // (CountAPI supports create with default)
          const createUrl = `https://api.countapi.xyz/create?namespace=${namespace}&key=${key}&value=0`;
          return fetch(createUrl)
            .then(() => setVisitors(0))
            .catch(() => setVisitors(null));
        }
      })
      .catch((err) => {
        console.warn("Visitor count fetch failed:", err);
        setVisitors(null);
      })
      .finally(() => setLoadingCount(false));
  }, [countApiNamespace, countApiKey]);

  return (
    <footer className="bg-gray-950 text-gray-400 px-6 py-6 mt-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: small project + copyright */}
        <div className="flex-1 text-sm">
          <div className="text-gray-300 font-medium">Ratatui Ecosystem</div>
          <div className="mt-1 text-xs text-gray-500">
            © {new Date().getFullYear()} QuBitAi. All rights reserved.
          </div>
        </div>

        {/* Center: links */}
        <div className="flex-1 flex justify-center">
          <nav className="flex flex-wrap gap-4 text-sm">
            <a href={docsUrl} className="hover:text-white">Docs</a>
            <a href={repoUrl} className="hover:text-white">GitHub</a>
            <a href="/privacy.html" className="hover:text-white">Privacy Policy</a>
            <a href="/tos.html" className="hover:text-white">Terms of Service</a>
            <a href={contactMail} className="hover:text-white">Contact</a>
          </nav>
        </div>

        {/* Right: sponsor button + visitor count */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <div>
            <a
              href={sponsorsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1 rounded text-sm font-medium"
            >
              Sponsor
            </a>
          </div>

          <div className="text-xs text-gray-500">
            {loadingCount ? (
              <span>Visitors: —</span>
            ) : visitors === null ? (
              <span>Visitors: N/A</span>
            ) : (
              <span>Visitors: <span className="text-gray-300">{visitors.toLocaleString()}</span></span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

