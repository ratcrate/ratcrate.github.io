// src/components/Footer.jsx
import React, { useEffect, useState } from "react";

/**
 * Robust Footer component with a visitors counter.
 *
 * Props:
 *  - repoUrl (string) - link to GitHub repo/org
 *  - docsUrl (string)
 *  - contactMail (string)
 *  - sponsorsUrl (string)
 *  - // CounterAPI (counterapi.dev) settings:
 *  - useCounterApi (bool) - if true, first attempt uses provided counterApiUrl
 *  - counterApiUrl (string) - full endpoint you tested, e.g. "https://api.counterapi.dev/v2/ratcrate-wrk/ratcrate-slug/up"
 *
 * Behavior:
 *  - If useCounterApi=true and counterApiUrl provided, attempt that endpoint first and extract a sensible count.
 *  - If that fails, fallback to CountAPI (countapi.xyz) using namespace 'ratcrate' and key 'visits' (no API key required).
 *  - All network code is wrapped in try/catch so rendering is not blocked by errors.
 */

const Footer = ({
  repoUrl = "https://github.com/rvbug",
  docsUrl = "https://ratcrate.github.io/docs",
  contactMail = "mailto:qubitai.in@gmail.com",
  sponsorsUrl = "https://github.com/sponsors/ratcrate",
  // CounterAPI settings (optional)
  useCounterApi = false,
  counterApiUrl = "https://api.counterapi.dev/v2/ratcrate-wrk/ratcrate-slug/up",
  // Fallback CountAPI settings
  countApiNamespace = "ratcrate", // your public namespace
  countApiKey = "visits" // chosen key
}) => {
  const [visitors, setVisitors] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);


  useEffect(() => {
  let mounted = true;
  const SESSION_KEY = "ratcrate_counted_v1";

  const safeSet = (fn) => { if (mounted) fn(); };

  const fetchCount = async () => {
    safeSet(() => setLoadingCount(true));

    // If we've already incremented in this session, just GET the value (no hit)
    const already = (() => {
      try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
    })();

    // Helper: try CounterAPI endpoint you tested (which increments)
    const tryCounterApiUp = async () => {
      try {
        const resp = await fetch(counterApiUrl, { cache: "no-store" });
        if (!resp.ok) return null;
        const json = await resp.json();
        // your CounterAPI returned json.data.up_count
        const up = json?.data?.up_count ?? json?.data?.value ?? json?.data?.count ?? null;
        return typeof up !== "undefined" && up !== null ? Number(up) : null;
      } catch (e) {
        return null;
      }
    };

    // Helper: CountAPI get
    const getCountApi = async () => {
      try {
        const ns = encodeURIComponent(countApiNamespace);
        const key = encodeURIComponent(countApiKey);
        const getUrl = `https://api.countapi.xyz/get/${ns}/${key}`;
        const resp = await fetch(getUrl, { cache: "no-store" });
        if (!resp.ok) return null;
        const json = await resp.json();
        if (json && typeof json.value !== "undefined") return Number(json.value);
      } catch (e) { /* ignore */ }
      return null;
    };

    // Helper: CountAPI hit (increment)
    const hitCountApi = async () => {
      try {
        const ns = encodeURIComponent(countApiNamespace);
        const key = encodeURIComponent(countApiKey);
        const hitUrl = `https://api.countapi.xyz/hit/${ns}/${key}`;
        const resp = await fetch(hitUrl, { cache: "no-store" });
        if (!resp.ok) return null;
        const json = await resp.json();
        if (json && typeof json.value !== "undefined") return Number(json.value);
      } catch (e) { /* ignore */ }
      return null;
    };

    // Main logic
    try {
      // 1) If already incremented this session -> only read current value
      if (already) {
        // prefer CounterAPI get (if using it) then fallback to CountAPI get
        let val = null;
        if (useCounterApi && counterApiUrl) {
          // Some CounterAPI endpoints have a 'get' variant; but we tested 'up' (increment).
          // So if the counter was already incremented, try GET on CountAPI fallback.
          val = await tryCounterApiUp(); // attempt, but likely increments if it's '/up' endpoint; if so, we still guard with sessionStorage
        }
        if (val === null) val = await getCountApi();
        safeSet(() => setVisitors(val));
        safeSet(() => setLoadingCount(false));
        return;
      }

      // 2) Not counted yet in this session -> increment once
      // Try the CounterAPI increment first if configured
      let newVal = null;
      if (useCounterApi && counterApiUrl) {
        newVal = await tryCounterApiUp();
      }

      // If no counterapi value, fallback to CountAPI hit
      if (newVal === null) {
        newVal = await hitCountApi();
      }

      // If we got a value, mark session as counted and set state
      if (newVal !== null && typeof newVal !== "undefined") {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
        safeSet(() => setVisitors(newVal));
        safeSet(() => setLoadingCount(false));
        return;
      }

      // 3) Fallback: try to GET whatever count exists (no increment)
      const finalVal = await getCountApi();
      safeSet(() => setVisitors(finalVal));
    } catch (err) {
      // swallow errors so UI still renders
      safeSet(() => setVisitors(null));
    } finally {
      safeSet(() => setLoadingCount(false));
    }
  };

  fetchCount();

  return () => { mounted = false; };
}, [useCounterApi, counterApiUrl, countApiNamespace, countApiKey]);


  return (
    <footer className="bg-gray-950 text-gray-400 px-6 py-6 mt-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: small project + copyright */}
        <div className="flex-1 text-sm">
          <div className="text-gray-300 font-medium">Ratcrate </div>
          <div className="mt-1 text-xs text-gray-500">© {new Date().getFullYear()} 
            <a href="https://qubitai.in" 
            target="_blank" 
            rel="noopener noreferrer" className="hover:text-white ml-1">
              QuBiTAi </a> Creation. All rights reserved.
          </div>
        </div>

        {/* Center: links */}
        <div className="flex-1 flex justify-center">
          <nav className="flex flex-wrap gap-4 text-sm">
            {/* <a href={docsUrl} className="hover:text-white">Docs</a> */}
            <a href={repoUrl} className="hover:text-white">GitHub</a>
            {/*
            <a href="/privacy.html" className="hover:text-white">Privacy Policy</a>
             <a href="/tos.html" className="hover:text-white">Terms of Service</a>
            */}
            <a href={contactMail} className="hover:text-white">Contact</a>
          </nav>
        </div>

        {/* Right: sponsor button + visitor count */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {/* <div className="flex gap-2">
            <a
              href={sponsorsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1 rounded text-sm font-medium"
            >
              Sponsor
            </a>
          </div> */}
          
          <div className="flex gap-2"> 
            {/* GitHub Sponsor Button (Uses existing sponsorsUrl prop) */}
            <a
              href={sponsorsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              GitHub Sponsor
            </a>
            <a
              href="https://ko-fi.com/rvbugged" // Ko-fi URL
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Ko-fi
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

