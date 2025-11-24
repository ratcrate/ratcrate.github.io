// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import Footer from './components/Footer';
import CliTuiPage from './components/CliTuiPage';

/* -------------------------
   Helpers
   ------------------------- */

const safeNum = (v) => (typeof v === "number" ? v : 0);

const formatNumber = (n) => (n || 0).toLocaleString();

const formatDateDDMMYYYY = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  const two = (n) => n.toString().padStart(2, "0");
  return `${two(dt.getDate())}/${two(dt.getMonth() + 1)}/${dt.getFullYear()}, ${two(
    dt.getHours()
  )}:${two(dt.getMinutes())}:${two(dt.getSeconds())}`;
};

const parsePkgDate = (pkg) => {
  const d = pkg.updated_at || pkg.created_at;
  const parsed = d ? new Date(d) : null;
  return parsed && !isNaN(parsed) ? parsed : null;
};

/* Custom tooltip used for bars */
const DownloadsTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const downloads = p.Downloads ?? p.downloads ?? 0;
  const updated = p.updated ?? p.updated_at ?? p.created_at ?? null;
  return (
    <div
      className="bg-gray-800 text-gray-100 p-3 rounded shadow-lg"
      style={{ border: "none", boxShadow: "0 6px 18px rgba(2,6,23,0.6)" }}
    >
      <div className="font-semibold mb-1">{p.name}</div>
      <div className="text-sm">
        Downloads: <span className="font-mono">{Number(downloads).toLocaleString()}</span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Last update: {updated ? new Date(updated).toLocaleString() : "N/A"}
      </div>
    </div>
  );
};

/* -------------------------
   CoreLibraries component
   - fixed min/max widths so cards are same size
   ------------------------- */
const CoreLibraries = ({ corePackages }) => {
  if (!corePackages || corePackages.length === 0) return null;

  return (
    <section id="core-libraries" className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-white mb-4 text-center">Core Libraries</h2>

      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-6">
          {corePackages.map((pkg) => (
            <div
              key={pkg.id}
              className="group relative bg-gray-800 p-5 rounded-lg shadow-md border border-gray-700 flex flex-col justify-between w-full sm:w-80 md:w-96"
            >
              {/* small hover tooltip above card */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 px-3 py-1 rounded">
                Downloads: <span className="text-green-400 font-medium">{formatNumber(pkg.downloads)}</span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 text-center">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-4">{pkg.description || "—"}</p>

                <div className="text-sm text-gray-500 mb-3 text-center">
                  <div>Weekly: <span className="text-green-400 font-medium">{formatNumber(pkg.recent_downloads)}</span></div>
                  <div>Version: <span className="text-purple-400 font-medium">{pkg.newest_version || pkg.version || "N/A"}</span></div>
                </div>

                <div className="bg-gray-700 p-2 rounded-md text-sm font-mono text-gray-200 overflow-x-auto whitespace-nowrap text-center">
                  <code className="select-all">cargo add {pkg.name}{pkg.newest_version ? `@${pkg.newest_version}` : ""}</code>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-3 border-t border-gray-700 justify-center">
                {pkg.repository && <a href={pkg.repository} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Repo</a>}
                {pkg.documentation && <a href={pkg.documentation} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Docs</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------
   HomePage component (hero + stats)
   ------------------------- */
const HomePage = ({ allPackages, setCurrentPage}) => {
  // total packages
  const totalPackages = allPackages.length;

  // find last updated across all packages
  const lastUpdatedDate = allPackages.reduce((acc, p) => {
    const d = parsePkgDate(p);
    if (!d) return acc;
    return acc > d ? acc : d;
  }, new Date(0));

  // Packages uploaded over time (6-month intervals)
  const getPackagesUploadedOverTime = (packages) => {
    const data = {};
    const startYear = 2023;
    const currentYear = new Date().getFullYear();

    packages.forEach((pkg) => {
      const createdDate = new Date(pkg.created_at || pkg.updated_at);
      if (isNaN(createdDate)) return;
      const y = createdDate.getFullYear();
      const m = createdDate.getMonth();
      if (y >= startYear) {
        const label = m < 6 ? `${y}-H1` : `${y}-H2`;
        data[label] = (data[label] || 0) + 1;
      }
    });

    const chartData = [];
    for (let y = startYear; y <= currentYear; y++) {
      chartData.push({ name: `${y}-H1`, Count: data[`${y}-H1`] || 0 });
      const includeH2 = (y < currentYear) || (y === currentYear && new Date().getMonth() >= 6);
      if (includeH2) chartData.push({ name: `${y}-H2`, Count: data[`${y}-H2`] || 0 });
    }
    return chartData;
  };

  // Top recent crates (non-core) - last 1 month and next 5 in last 6 months
  const getTopRecent = (packages) => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const nonCore = packages.filter((p) => p.is_core_library !== true);

    const mapped = nonCore.map((p) => ({
      ...p,
      when: parsePkgDate(p),
      score: safeNum(p.recent_downloads || p.downloads || 0)
    }));

    const lastMonth = mapped.filter((m) => m.when && m.when >= oneMonthAgo).sort((a, b) => b.score - a.score).slice(0, 5);
    const lastMonthIds = new Set(lastMonth.map((m) => m.id));
    const lastSix = mapped.filter((m) => m.when && m.when >= sixMonthsAgo && !lastMonthIds.has(m.id)).sort((a, b) => b.score - a.score).slice(0, 5);

    const monthData = lastMonth.map((p) => ({ name: p.name, Downloads: p.score, updated: p.when ? p.when.toISOString().slice(0, 10) : null }));
    const sixData = lastSix.map((p) => ({ name: p.name, Downloads: p.score, updated: p.when ? p.when.toISOString().slice(0, 10) : null }));

    return { monthData, sixData };
  };

  // Top categories as text list (to replace the cluttered chart)
  const getTopCategories = (packages, topN = 10) => {
    const counts = {};
    packages.forEach((p) => {
      if (!Array.isArray(p.categories)) return;
      p.categories.forEach((c) => (counts[c] = (counts[c] || 0) + 1));
    });
    return Object.entries(counts)
      .map(([name, Count]) => ({ name, Count }))
      .sort((a, b) => b.Count - a.Count)
      .slice(0, topN);
  };

  const packagesOverTimeData = getPackagesUploadedOverTime(allPackages);
  const { monthData, sixData } = getTopRecent(allPackages);
  const topCategories = getTopCategories(allPackages, 8);

  return (
    <>
      {/* HERO */}
      <header className="py-12 text-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-b-2xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Explore the Ratatui Ecosystem</h1>
        <p className="text-sm text-gray-300 max-w-2xl mx-auto mb-4">Discover libraries and tools built with Ratatui for powerful terminal user interfaces.</p>

        {/* Centered smaller button */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => { window.history.pushState({}, '', '/packages'); 
            setCurrentPage("packages"); 
          }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow"
          >
            View All Packages
          </button>

          {/* small info lines below the button */}
          <div className="text-xs text-gray-400 mt-2 text-center space-y-1">
            <div>Total packages: <span className="text-white font-medium">{formatNumber(totalPackages)}</span></div>
            <div>Data last updated: <span className="text-white font-medium">{formatDateDDMMYYYY(lastUpdatedDate)}</span></div>
            <div className="text-gray-500">This data is refreshed every 24 hours.</div>
          </div>
        </div>
      </header>

      {/* Key Statistics */}
      <section id="stats" className="container mx-auto px-4 py-10 mt-8">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Key Statistics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Packages Over Time */}
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm text-gray-200 mb-3 text-center font-medium">Packages Uploaded (6-Month Intervals)</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={packagesOverTimeData} margin={{ top: 10, left: 4, right: 4, bottom: 10 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0B1220", border: "none", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="Count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Middle: Top 5 last 1 month (non-core) */}
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm text-gray-200 mb-3 text-center font-medium">Top 5 (Last 1 Month) — non-core</h3>
            {monthData && monthData.length > 0 ? (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthData} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                    <XAxis dataKey="name" stroke="#9CA3AF" angle={-35} textAnchor="end" height={60} label={{ value: "Downloads", position: "bottom", offset: 8, style: { textAnchor: "middle" } }} />
                    <YAxis stroke="#9CA3AF" allowDecimals={false} />
                    <Tooltip content={<DownloadsTooltip />} wrapperStyle={{ border: "none", background: "transparent" }} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="Downloads" fill="#10B981" barSize={26} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm">No recent non-core updates</p>
            )}
          </div>

          {/* Right: Next 5 since 6 months (non-core) */}
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm text-gray-200 mb-3 text-center font-medium">Next 5 (Since Last 6 Months) — non-core</h3>
            {sixData && sixData.length > 0 ? (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sixData} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                    <XAxis dataKey="name" stroke="#9CA3AF" angle={-35} textAnchor="end" height={60} label={{ value: "Downloads", position: "bottom", offset: 8, style: { textAnchor: "middle" } }} />
                    <YAxis stroke="#9CA3AF" allowDecimals={false} />
                    <Tooltip content={<DownloadsTooltip />} wrapperStyle={{ border: "none", background: "transparent" }} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="Downloads" fill="#60A5FA" barSize={26} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm">No additional non-core updates</p>
            )}
          </div>
        </div>

        {/* Replace categories chart with compact text list */}
        <div className="mt-6 bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-200 mb-3 font-medium">Top Categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-gray-400 text-sm">No category data available</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
              {topCategories.map((c) => (
                <li key={c.name} className="flex justify-between px-2 py-1 bg-gray-800 rounded">
                  <span className="truncate">{c.name}</span>
                  <span className="text-green-400 font-medium">{c.Count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* New sections: Trending & New releases */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrendingBlock allPackages={allPackages} />
          <NewReleasesBlock allPackages={allPackages} />
        </div>
      </section>

      {/* Documentation + newsletter simplified */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-center">
          <h4 className="text-white font-semibold mb-2">Documentation</h4>
          <p className="text-gray-300 text-sm mb-3">Coming Soon.</p>
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-white text-sm bg-green-600 px-3 py-1 rounded">Coming Soon</a>
        </div>
      </section>
    </>
  );
};

/* -------------------------
   TrendingBlock - approximate growth calculation
   ------------------------- */
const TrendingBlock = ({ allPackages }) => {
  // approximate growth using recent_downloads vs previous estimate
  // prevEstimate = downloads - recent_downloads (if > 0)
  // growthRatio = recent / prevEstimate
  // provide note that this is an estimate
  const candidates = allPackages
    .map((p) => {
      const recent = safeNum(p.recent_downloads);
      const total = safeNum(p.downloads);
      const prev = Math.max(0, total - recent);
      const ratio = prev > 0 ? recent / prev : recent > 0 ? Infinity : 0;
      const pct = prev > 0 ? ((recent - prev) / prev) * 100 : null;
      return {
        id: p.id,
        name: p.name,
        recent,
        prev,
        ratio,
        pct
      };
    })
    .filter((p) => p.recent > 0)
    .sort((a, b) => {
      // sort by ratio desc, Infinity last? we treat Infinity as large
      const ra = a.ratio === Infinity ? Number.POSITIVE_INFINITY : a.ratio;
      const rb = b.ratio === Infinity ? Number.POSITIVE_INFINITY : b.ratio;
      return rb - ra;
    })
    .slice(0, 8);

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <h3 className="text-sm text-gray-200 mb-2 font-medium">Trending (approx.)</h3>
      <p className="text-xs text-gray-400 mb-2">
        Growth estimated by comparing recent downloads to earlier downloads (approximation).
      </p>
      <ul className="space-y-2 text-sm">
        {candidates.length === 0 && <li className="text-gray-400">No trending data</li>}
        {candidates.map((c) => (
          <li key={c.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
            <div className="truncate">
              <div className="text-white text-sm font-medium">{c.name}</div>
              <div className="text-xs text-gray-400">recent: {formatNumber(c.recent)} | prev est: {formatNumber(c.prev)}</div>
            </div>
            <div className="text-right ml-3">
              {c.pct !== null ? (
                <div className="text-green-400 font-medium text-sm">{c.pct >= 0 ? "+" : ""}{Math.round(c.pct)}%</div>
              ) : (
                <div className="text-green-400 font-medium text-sm">↑ {c.ratio === Infinity ? "∞" : c.ratio.toFixed(1) + "x"}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* -------------------------
   NewReleasesBlock - created within last 7/30 days
   ------------------------- */
const NewReleasesBlock = ({ allPackages }) => {
  const now = new Date();
  const d7 = new Date(now);
  d7.setDate(now.getDate() - 7);
  const d30 = new Date(now);
  d30.setDate(now.getDate() - 30);

  const mapped = allPackages.map((p) => ({ ...p, createdDate: p.created_at ? new Date(p.created_at) : null }));
  const last7 = mapped.filter((p) => p.createdDate && p.createdDate >= d7).sort((a, b) => b.createdDate - a.createdDate).slice(0, 6);
  const last30 = mapped.filter((p) => p.createdDate && p.createdDate >= d30 && p.createdDate < d7).sort((a, b) => b.createdDate - a.createdDate).slice(0, 6);

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <h3 className="text-sm text-gray-200 mb-2 font-medium">New Releases</h3>

      <div className="text-xs text-gray-400 mb-2">Last 7 days</div>
      <ul className="space-y-1 text-sm mb-3">
        {last7.length === 0 && <li className="text-gray-400">No new crates in the last 7 days</li>}
        {last7.map((p) => (
          <li key={p.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
            <span className="truncate">{p.name}</span>
            <span className="text-gray-400 text-xs">{p.createdDate ? new Date(p.createdDate).toLocaleDateString() : "N/A"}</span>
          </li>
        ))}
      </ul>

      <div className="text-xs text-gray-400 mb-2">Last 8–30 days</div>
      <ul className="space-y-1 text-sm">
        {last30.length === 0 && <li className="text-gray-400">No new crates in the last 30 days</li>}
        {last30.map((p) => (
          <li key={p.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
            <span className="truncate">{p.name}</span>
            <span className="text-gray-400 text-xs">{p.createdDate ? new Date(p.createdDate).toLocaleDateString() : "N/A"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* -------------------------
   PackageListPage component (core libs centered, uniform sizes)
   ------------------------- */
const PackageListPage = ({ allPackages }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent_downloads");
  const [displayCount, setDisplayCount] = useState(9);
  const packagesPerPage = 9;

  const corePackages = allPackages.filter((p) => p.is_core_library === true);

  const filtered = allPackages
    .filter((p) => p.is_core_library !== true)
    .filter((p) => {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || (p.categories || []).some((c) => c.toLowerCase().includes(q));
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "downloads":
        return (b.downloads || 0) - (a.downloads || 0);
      case "recent_downloads":
        return (b.recent_downloads || 0) - (a.recent_downloads || 0);
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "alphabetical":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const packagesToDisplay = sorted.slice(0, displayCount);
  const hasMore = displayCount < sorted.length;

  useEffect(() => setDisplayCount(packagesPerPage), [searchTerm, sortBy]);

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">All Ratatui Packages</h2>

      {/* Core Libraries centered */}
      <div className="mb-8">
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-6">
            {corePackages.map((p) => (
              <div key={p.id} className="group relative bg-gray-800 p-5 rounded-lg border border-gray-700 w-full sm:w-80 md:w-96">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 px-3 py-1 rounded">
                  Downloads: <span className="text-green-400 font-medium">{formatNumber(p.downloads)}</span>
                </div>
                <h4 className="text-lg text-white font-semibold mb-2 text-center">{p.name}</h4>
                <p className="text-gray-400 text-sm mb-3 line-clamp-4">{p.description}</p>
                <div className="text-sm text-gray-500 text-center">
                  <div>Weekly: <span className="text-green-400">{formatNumber(p.recent_downloads)}</span></div>
                </div>
                <div className="mt-3 text-center">
                  {p.repository && <a href={p.repository} className="text-blue-400 hover:underline text-sm mr-3">Repo</a>}
                  {p.documentation && <a href={p.documentation} className="text-blue-400 hover:underline text-sm">Docs</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and sort */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 max-w-4xl mx-auto">
        <input type="text" placeholder="Search packages..." className="flex-grow p-3 rounded bg-gray-800 text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="bg-gray-800 p-2 rounded text-white" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent_downloads">Weekly Downloads</option>
          <option value="downloads">Total Downloads</option>
          <option value="newest">Newest</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {/* Package cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packagesToDisplay.length === 0 && <div className="text-center text-gray-400">No packages found.</div>}
        {packagesToDisplay.map((pkg) => (
          <div key={pkg.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-2">{pkg.name}</h4>
            <p className="text-gray-400 text-sm mb-3 line-clamp-4">{pkg.description}</p>
            <div className="text-sm text-gray-500 mb-3">
              <div>Weekly: <span className="text-green-400">{formatNumber(pkg.recent_downloads)}</span></div>
              <div>Version: <span className="text-purple-400">{pkg.newest_version || pkg.version || "N/A"}</span></div>
            </div>
            <div className="bg-gray-700 p-2 rounded text-sm font-mono text-gray-200">{`cargo add ${pkg.name}${pkg.newest_version ? `@${pkg.newest_version}` : ""}`}</div>
            <div className="mt-3 flex gap-3">
              {pkg.repository && <a href={pkg.repository} className="text-blue-400 hover:underline text-sm">Repo</a>}
              {pkg.documentation && <a href={pkg.documentation} className="text-blue-400 hover:underline text-sm">Docs</a>}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button onClick={() => setDisplayCount((c) => c + packagesPerPage)} className="bg-blue-600 px-4 py-2 rounded text-white">Load more</button>
        </div>
      )}
    </section>
  );
};

/* -------------------------
   App - main (patched navbar with hamburger)
   ------------------------- */
const App = () => {
  const [allPackages,setAllPackages] = useState([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [navbarTransparent, setNavbarTransparent] = useState(false);

  // NEW: mobile menu state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // fetch ratcrate.json placed under public/data/ratcrate.json
    const load = async () => {
      try {
        const res = await fetch("/data/ratcrate.json", { cache: "no-store" });
        // const res = await fetch("https://ratcrate.github.io/data/ratcrate.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load /data/ratcrate.json");
        const json = await res.json();
        const crates = Array.isArray(json) ? json : json.crates || [];
        setAllPackages(crates);
      } catch (e) {
        console.error("Failed to fetch ratcrate.json", e);
        setAllPackages([]);
      }
    };
    load();
  }, []); // The empty dependency array ensures this runs only once on mount

// useEffect(() => {
//     const onHash = () => {
//       const h = window.location.hash.replace("#", "");
//       if (h === "package-list-page") setCurrentPage("packages");
//       // 2. Update routing logic
//       else if (h === "#tools-page") setCurrentPage("tools"); // <--- ADDED
//       else if (h === "stats") setCurrentPage("home");
//       else setCurrentPage("home");
//       // close mobile menu when navigating via hash
//       setMobileOpen(false);
//     };
//     onHash();
//     window.addEventListener("hashchange", onHash);
//     return () => window.removeEventListener("hashchange", onHash);
//   }, []);

// ADD this new block to handle path-based routing (popstate)
useEffect(() => {
    const handlePopState = () => {
        // Get the current path (e.g., /packages or /tools)
        const path = window.location.pathname.toLowerCase().replace(/\/+$/, ''); 
        
        if (path.endsWith('/packages')) {
            setCurrentPage('packages');
        } else if (path.endsWith('/tools')) {
            setCurrentPage('tools');
        } else {
            // Treat everything else, including '/' and '/stats', as home
            setCurrentPage('home');
        }
        setMobileOpen(false); // Close menu on navigation
    };

    // Handle initial load based on path
    handlePopState(); 

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
}, []);


  useEffect(() => {
    const onScroll = () => setNavbarTransparent(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  // close mobile menu when window resizes up to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileOpen]);

  const handleNewsletterSignup = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      // dummy behavior
      alert(`Thanks — ${newsletterEmail}`);
      setNewsletterEmail("");
    } else {
      alert("Enter a valid email");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-100 font-inter">
      {/* Top nav - REPLACED with responsive hamburger */}
      <nav className={`sticky top-0 z-50 transition-all ${navbarTransparent ? "bg-gray-950 bg-opacity-90" : "bg-gray-950 bg-opacity-100"} shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div
            className="text-xl font-bold cursor-pointer"
            // onClick={() => { setCurrentPage("home"); window.location.hash = ""; setMobileOpen(false); }}
            onClick={() => { setCurrentPage("home"); window.history.pushState({}, '', '/'); setMobileOpen(false); }}
            aria-label="Ratatui Ecosystem"
          >
            Ratatui Ecosystem
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            {/* <a href="#package-list-page" onClick={() => setCurrentPage("packages")} className="text-gray-300 hover:text-white">Packages</a> */}
            <a href="/packages" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/packages'); setCurrentPage("packages"); } } className="text-gray-300 hover:text-white">Packages</a>
            {/* <a href="#tools-page" onClick={() => setCurrentPage("tools")} className="text-gray-300 hover:text-white">Tools</a>  */}
            <a href="/tools" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/tools'); setCurrentPage("tools"); }} className="text-gray-300 hover:text-white">Tools</a>
            {/* <a href="#stats" onClick={() => { setCurrentPage("home"); window.location.hash = "#stats"; }} className="text-gray-300 hover:text-white">Stats</a> */}
            <a href="/#stats" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); setCurrentPage("home"); setTimeout(() => { window.location.hash = "#stats"; }, 0); }} className="text-gray-300 hover:text-white">Stats</a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">Docs</a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden flex flex-col items-center justify-center p-2 rounded ${mobileOpen ? "bg-gray-800" : "bg-transparent"}`}
            onClick={() => setMobileOpen((s) => !s)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            type="button"
          >
            <span className={`block h-0.5 w-6 bg-white transition-transform ${mobileOpen ? "translate-y-1.5 rotate-45" : ""}`}></span>
            <span className={`block h-0.5 w-6 bg-white my-1 transition-opacity ${mobileOpen ? "opacity-0" : "opacity-100"}`}></span>
            <span className={`block h-0.5 w-6 bg-white transition-transform ${mobileOpen ? "-translate-y-1.5 -rotate-45" : ""}`}></span>
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <div className={`md:hidden bg-gray-900 transition-all duration-300 overflow-hidden ${mobileOpen ? "max-h-64" : "max-h-0"}`}>
          <div className="px-4 pb-4 flex flex-col">
            {/* <a href="#package-list-page" onClick={() => { setCurrentPage("packages"); setMobileOpen(false); }} className="py-3 border-b border-gray-800 text-center text-lg">Packages</a> */}
            <a href="/packages" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/packages'); setCurrentPage("packages"); setMobileOpen(false); }} className="py-3 border-b border-gray-800 text-center text-lg">Packages</a>
            {/* <a href="#tools-page" onClick={() => { setCurrentPage("tools"); setMobileOpen(false); }} className="py-3 border-b border-gray-800 text-center text-lg">Tools</a> */}
            <a href="/tools" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/tools'); setCurrentPage("tools"); setMobileOpen(false); }} className="py-3 border-b border-gray-800 text-center text-lg">Tools</a>
            {/* <a href="#stats" onClick={() => { setCurrentPage("home"); window.location.hash = "#stats"; setMobileOpen(false); }} className="py-3 border-b border-gray-800 text-center text-lg">Stats</a> */}
            <a href="/#stats" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); setCurrentPage("home"); setMobileOpen(false); setTimeout(() => { window.location.hash = "#stats"; }, 0); }} className="py-3 border-b border-gray-800 text-center text-lg">Stats</a>
            <a href="#" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="py-3 border-b border-gray-800 text-center text-lg">Docs</a>
          </div>
        </div>
      </nav>

      {/* Page content */}
      {/* {currentPage === "packages" ? (
        <PackageListPage allPackages={allPackages} />
      )  
      : (
        <HomePage allPackages={allPackages} newsletterEmail={newsletterEmail} setNewsletterEmail={setNewsletterEmail} handleNewsletterSignup={handleNewsletterSignup} />
      )} */}

        {/* Page content */}
      {currentPage === "packages" ? (
        <PackageListPage allPackages={allPackages} />
      ) : currentPage === "tools" ? ( // <--- ADD THIS
          <CliTuiPage />
      ) : (
        <HomePage 
          allPackages={allPackages} 
          newsletterEmail={newsletterEmail} 
          setNewsletterEmail={setNewsletterEmail} 
          handleNewsletterSignup={handleNewsletterSignup} 
          setCurrentPage={setCurrentPage}
          />
      )}

      {/* Footer */}
      <Footer
        useCounterApi={true}
        counterApiUrl="https://api.counterapi.dev/v2/ratcrate-wrk/ratcrate-slug/up"
        repoUrl="https://github.com/rvbug"
        sponsorsUrl="https://github.com/sponsors/ratcrate"
      />

      {/* small animation css kept inline */}
      <style>{`
        .font-inter { font-family: 'Inter', sans-serif; }
        .line-clamp-4 { display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
    </div>
  );
};

export default App;

