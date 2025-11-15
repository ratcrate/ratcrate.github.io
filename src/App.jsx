// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

// ---- Helper utilities ----
const formatNumber = (n) => (n || 0).toLocaleString();

const getIsoDateString = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleString(); // localized human readable
};

// ---- HomePage component ----
const HomePage = ({ allPackages, newsletterEmail, setNewsletterEmail, handleNewsletterSignup }) => {
  // Total packages & last updated
  const totalPackages = allPackages.length;
  // compute latest updated_at across all packages
  const lastUpdated = allPackages.reduce((acc, pkg) => {
    const d = new Date(pkg.updated_at || pkg.created_at);
    return acc > d ? acc : d;
  }, new Date(0));

  // Packages Uploaded Over Time (6-month intervals)
  const getPackagesUploadedOverTime = (packages) => {
    const data = {};
    const startYear = 2023;
    const currentYear = new Date().getFullYear();

    packages.forEach(pkg => {
      const createdDate = new Date(pkg.created_at || pkg.updated_at);
      const year = createdDate.getFullYear();
      const month = createdDate.getMonth(); // 0-11
      if (year >= startYear) {
        let periodLabel = month < 6 ? `${year}-H1` : `${year}-H2`;
        data[periodLabel] = (data[periodLabel] || 0) + 1;
      }
    });

    const chartData = [];
    for (let y = startYear; y <= currentYear; y++) {
      chartData.push({ name: `${y}-H1`, Count: data[`${y}-H1`] || 0 });
      // add H2 only if present or if we've passed H2 in current year
      chartData.push({ name: `${y}-H2`, Count: data[`${y}-H2`] || 0 });
    }
    return chartData;
  };

  // Category distribution
  const getCategoriesDistribution = (packages) => {
    const categoryCounts = {};
    packages.forEach(pkg => {
      if (pkg.categories && Array.isArray(pkg.categories)) {
        pkg.categories.forEach(category => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });

    return Object.keys(categoryCounts).map(category => ({
      name: category,
      Count: categoryCounts[category],
    })).sort((a, b) => b.Count - a.Count);
  };

  // Top 5 in last 1 month, and next 5 in last 6 months (exclude core libs)
  const getTopRecent = (packages) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const nonCore = packages.filter(p => !p.is_core_library);

    const lastMonthCandidates = nonCore.filter(p => {
      const d = new Date(p.updated_at || p.created_at);
      return d >= oneMonthAgo;
    });

    const lastMonthTop5 = lastMonthCandidates
      .sort((a, b) => (b.recent_downloads || 0) - (a.recent_downloads || 0))
      .slice(0, 5)
      .map(p => ({ name: p.name, downloads: p.recent_downloads || p.downloads || 0 }));

    // For 6 months: include those updated in last 6 months but exclude ones already in lastMonthTop5
    const last6Candidates = nonCore.filter(p => {
      const d = new Date(p.updated_at || p.created_at);
      return d >= sixMonthsAgo;
    }).filter(p => !lastMonthTop5.find(x => x.name === p.name));

    const next5 = last6Candidates
      .sort((a, b) => (b.recent_downloads || 0) - (a.recent_downloads || 0))
      .slice(0, 5)
      .map(p => ({ name: p.name, downloads: p.recent_downloads || p.downloads || 0 }));

    return { lastMonthTop5, next5 };
  };

  const packagesOverTimeData = getPackagesUploadedOverTime(allPackages);
  const categoriesDistributionData = getCategoriesDistribution(allPackages);
  const { lastMonthTop5, next5 } = getTopRecent(allPackages);

  return (
    <>
      {/* Hero Section */}
      <header className="py-20 text-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-b-3xl shadow-xl">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 animate-fade-in-down">
          Explore the Ratatui Ecosystem
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up">
          Discover libraries and tools built with Ratatui for powerful terminal user interfaces.
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-sm text-gray-400">
            <div>Total packages: <span className="text-white font-semibold">{formatNumber(totalPackages)}</span></div>
            <div className="mt-1">Data last updated: <span className="text-white font-medium">{getIsoDateString(lastUpdated)}</span></div>
            <div className="text-xs text-gray-500 mt-1">This data is refreshed every 24 hours.</div>
          </div>

          <button
            onClick={() => window.location.hash = '#package-list-page'}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg text-sm"
          >
            View All Packages
          </button>
        </div>
      </header>

      {/* Key Statistics Section */}
      <section id="stats" className="container mx-auto px-4 py-16 mt-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">Key Statistics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Packages Over Time */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Packages Uploaded Over Time</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={packagesOverTimeData} margin={{ top: 10, right: 10, left: -10, bottom: 50 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#9CA3AF" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 8 }} itemStyle={{ color: '#E5E7EB' }} labelStyle={{ color: '#9CA3AF' }} />
                  <Line type="monotone" dataKey="Count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Distribution */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Package Categories Distribution</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoriesDistributionData} margin={{ top: 10, right: 10, left: -10, bottom: 80 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={60} interval={0} />
                  <YAxis stroke="#9CA3AF" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 8 }} itemStyle={{ color: '#E5E7EB' }} labelStyle={{ color: '#9CA3AF' }} />
                  <Bar dataKey="Count" fill="#10B981" barSize={24} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top recent downloads (1 month & next 6 months) */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Top recent crates</h3>

            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-2">Top 5 updated in last 1 month (excluding core libraries)</p>
              <ul className="space-y-2">
                {lastMonthTop5.length === 0 && <li className="text-gray-400">No packages updated in the last month</li>}
                {lastMonthTop5.map((p, idx) => (
                  <li key={`m1-${idx}`} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="text-green-400 text-sm">{formatNumber(p.downloads)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-gray-300 mb-2">Next 5 (updated in last 6 months)</p>
              <ul className="space-y-2">
                {next5.length === 0 && <li className="text-gray-400">No packages updated in the last 6 months</li>}
                {next5.map((p, idx) => (
                  <li key={`m6-${idx}`} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="text-green-400 text-sm">{formatNumber(p.downloads)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation / Newsletter / Contact same as before but trimmed for brevity */}
      <section id="documentation-section" className="container mx-auto px-4 py-12">
        <div className="bg-gray-900 p-8 rounded-lg shadow-inner border border-gray-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Comprehensive Documentation</h2>
          <p className="text-gray-300 mb-4">Dive deep into the Ratatui framework and its ecosystem.</p>
          <a href="https://quarto.org/" target="_blank" rel="noopener noreferrer" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Explore Docs
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="container mx-auto px-4 py-12">
        <div className="bg-gray-900 p-6 rounded-lg shadow-inner border border-gray-700 max-w-xl mx-auto">
          <h3 className="text-xl text-white font-semibold mb-2">Stay updated</h3>
          <form onSubmit={handleNewsletterSignup} className="flex gap-3">
            <input type="email" required placeholder="Your email" className="flex-grow p-3 rounded bg-gray-800 text-white" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} />
            <button className="bg-blue-600 px-4 py-2 rounded">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
};

// ---- Package List Page ----
const PackageListPage = ({ allPackages }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent_downloads');
  const [displayCount, setDisplayCount] = useState(9);
  const packagesPerPage = 9;

  // Search filter
  const filteredPackages = allPackages.filter(pkg => {
    const q = searchTerm.toLowerCase();
    return pkg.name.toLowerCase().includes(q)
      || (pkg.description || '').toLowerCase().includes(q)
      || (pkg.categories || []).some(c => c.toLowerCase().includes(q));
  });

  // Sort
  const sortedPackages = [...filteredPackages].sort((a, b) => {
    switch (sortBy) {
      case 'downloads': return (b.downloads || 0) - (a.downloads || 0);
      case 'recent_downloads': return (b.recent_downloads || 0) - (a.recent_downloads || 0);
      case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'alphabetical': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const packagesToDisplay = sortedPackages.slice(0, displayCount);
  const hasMorePackages = displayCount < sortedPackages.length;

  useEffect(() => {
    setDisplayCount(packagesPerPage);
  }, [searchTerm, sortBy]);

  // Core libraries (centered)
  const coreLibs = allPackages.filter(p => p.is_core_library);
  // Ensure at least center layout even for 1 or 2 items
  return (
    <section id="package-list-page" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">All Ratatui Packages</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 max-w-4xl mx-auto gap-4">
        <input type="text" placeholder="Search..." className="flex-grow p-3 rounded bg-gray-800 text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-800 p-3 rounded text-white">
          <option value="recent_downloads">Weekly Downloads</option>
          <option value="downloads">Total Downloads</option>
          <option value="newest">Newest</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {/* Core Libraries Section */}
      {coreLibs.length > 0 && (
        <div className="mb-10">
          <h3 className="text-2xl text-white font-semibold mb-4 text-center">Core Libraries</h3>

          {/* centered container */}
          <div className="flex flex-wrap justify-center gap-8">
            {coreLibs.map(pkg => (
              <div key={pkg.id} className="group relative bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 min-w-[260px] max-w-xs">
                {/* hover tooltip showing downloads */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 px-3 py-1 rounded">
                  Downloads: <span className="text-green-400 font-medium">{formatNumber(pkg.downloads)}</span>
                </div>

                <h4 className="text-xl text-white font-semibold mb-2 text-center">{pkg.name}</h4>
                <p className="text-gray-400 text-sm mb-4 line-clamp-4">{pkg.description}</p>

                <div className="text-sm text-gray-500 mb-4 text-center">
                  <div>Weekly: <span className="text-green-400 font-medium">{formatNumber(pkg.recent_downloads)}</span></div>
                  <div>Version: <span className="text-purple-400">{pkg.newest_version || pkg.version || pkg.max_stable_version || 'N/A'}</span></div>
                </div>

                <div className="text-center mt-4">
                  <a href={pkg.repository} className="text-blue-400 hover:underline mr-4">Repo</a>
                  {pkg.documentation && <a href={pkg.documentation} className="text-blue-400 hover:underline">Docs</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packagesToDisplay.length > 0 ? packagesToDisplay.map(pkg => (
          <div key={pkg.id} className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">{pkg.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-4">{pkg.description}</p>

              {pkg.categories && pkg.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {pkg.categories.map(cat => <span key={cat} className="bg-blue-800 text-blue-200 text-xs px-2 py-0.5 rounded-full">{cat}</span>)}
                </div>
              )}

              <div className="text-sm text-gray-500 mb-4">
                <p>Weekly Downloads: <span className="text-green-400 font-medium">{formatNumber(pkg.recent_downloads)}</span></p>
                <p>Version: <span className="text-purple-400 font-medium">{pkg.newest_version || pkg.version || pkg.max_stable_version || 'N/A'}</span></p>
              </div>

              <div className="mb-4">
                <p className="text-gray-300 font-semibold mb-2">Install:</p>
                <div className="bg-gray-700 p-3 rounded-md text-sm font-mono text-gray-200 overflow-x-auto whitespace-nowrap">
                  <code className="select-all">cargo add {pkg.name}{pkg.newest_version ? `@${pkg.newest_version}` : ''}</code>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-gray-700">
              {pkg.documentation && <a href={pkg.documentation} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm">Docs</a>}
              {pkg.repository && <a href={pkg.repository} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm">Repo</a>}
              {pkg.homepage && <a href={pkg.homepage} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm">Homepage</a>}
            </div>
          </div>
        )) : (
          <p className="col-span-full text-center text-gray-400">No packages found.</p>
        )}
      </div>

      {hasMorePackages && (
        <div className="text-center mt-10">
          <button onClick={() => setDisplayCount(c => c + packagesPerPage)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

// ---- Main App ----
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeNavLink, setActiveNavLink] = useState('home');
  const [navbarTransparent, setNavbarTransparent] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showMessageBox, setShowMessageBox] = useState(false);

  // load data from /data/ratcrate.json (served from repo's /data folder)
  const [allPackages, setAllPackages] = useState([]);

  useEffect(() => {
    fetch('/data/ratcrate.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch ratcrate.json');
        return res.json();
      })
      .then(json => {
        // if the JSON is an object with 'crates' field keep that, otherwise assume it's an array
        const crates = Array.isArray(json) ? json : (json.crates || []);
        setAllPackages(crates);
      })
      .catch(err => {
        console.error('Error loading ratcrate.json:', err);
        // fallback: empty list
        setAllPackages([]);
      });
  }, []);

  // Message box helper
  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => {
      setShowMessageBox(false);
      setMessage('');
    }, 3000);
  };

  const handleNewsletterSignup = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      console.log('Newsletter signup:', newsletterEmail);
      showMessage(`Thank you for signing up, ${newsletterEmail}!`);
      setNewsletterEmail('');
    } else {
      showMessage('Please enter a valid email address.');
    }
  };

  // navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setNavbarTransparent(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // hash change navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'package-list-page') {
        setCurrentPage('package-list'); setActiveNavLink('package-list');
      } else if (hash === 'stats') { setCurrentPage('home'); setActiveNavLink('stats'); }
      else { setCurrentPage('home'); setActiveNavLink('home'); }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-inter">
      {/* Tailwind via CDN for now */}
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {showMessageBox && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}

      <nav className={`flex justify-between items-center p-4 bg-gray-950 sticky top-0 z-40 ${navbarTransparent ? 'bg-opacity-90' : 'bg-opacity-100'}`}>
        <div className="text-2xl font-bold text-white cursor-pointer" onClick={() => { setCurrentPage('home'); setActiveNavLink('home'); window.location.hash = ''; }}>
          Ratatui Ecosystem
        </div>
        <div className="flex space-x-6">
          <a href="#package-list-page" className={`text-gray-300 hover:text-white p-2 ${activeNavLink === 'package-list' ? 'text-blue-400 font-semibold' : ''}`} onClick={() => setCurrentPage('package-list')}>Package List</a>
          <a href="#stats" className={`text-gray-300 hover:text-white p-2 ${activeNavLink === 'stats' ? 'text-blue-400 font-semibold' : ''}`} onClick={() => { setCurrentPage('home'); setActiveNavLink('stats'); }}>Stats</a>
          <a href="#newsletter" className="text-gray-300 hover:text-white p-2">Newsletter</a>
        </div>
      </nav>

      {currentPage === 'home' ? (
        <HomePage allPackages={allPackages} newsletterEmail={newsletterEmail} setNewsletterEmail={setNewsletterEmail} handleNewsletterSignup={handleNewsletterSignup} />
      ) : (
        <PackageListPage allPackages={allPackages} />
      )}

      <footer className="bg-gray-950 text-gray-500 text-center p-6 mt-16 rounded-t-lg shadow-lg">
        <p>&copy; {new Date().getFullYear()} Ratatui Ecosystem. All rights reserved.</p>
      </footer>

      {/* local animation CSS */}
      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0);} }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0);} }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-down { animation: fadeInDown 0.9s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.9s ease-out forwards; animation-delay: 0.2s; }
        .animate-fade-in { animation: fadeIn 0.9s ease-out forwards; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default App;

