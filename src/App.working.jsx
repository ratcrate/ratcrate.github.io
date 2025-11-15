import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

/* Utility to parse date from package */
const parsePkgDate = (pkg) => {
  const d = pkg.updated_at || pkg.created_at;
  const parsed = d ? new Date(d) : null;
  return (parsed && !isNaN(parsed)) ? parsed : null;
};

/* Custom tooltip for bar charts to show downloads + date */
// const DownloadsTooltip = ({ active, payload }) => {
//   if (!active || !payload || !payload.length) return null;
//   const p = payload[0].payload;
//   const downloads = p.Downloads ?? 0;
//   const updated = p.updated ?? null;
//   return (
//     <div className="bg-gray-800 text-gray-100 p-3 rounded shadow-lg" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
//       <div className="font-semibold mb-1">{p.name}</div>
//       <div className="text-sm">Downloads: <span className="font-mono">{Number(downloads).toLocaleString()}</span></div>
//       <div className="text-xs text-gray-400 mt-1">Last update: {updated ?? 'N/A'}</div>
//     </div>
//   );
// };
//

// Custom tooltip for bar charts to show downloads + date (no border)
const DownloadsTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const downloads = p.Downloads ?? 0;
  const updated = p.updated ?? null;
  return (
    <div
      className="bg-gray-800 text-gray-100 p-3 rounded shadow-lg"
      style={{ border: 'none', boxShadow: '0 6px 18px rgba(2,6,23,0.6)' }} // keep a subtle dark shadow if you want
    >
      <div className="font-semibold mb-1">{p.name}</div>
      <div className="text-sm">Downloads: <span className="font-mono">{Number(downloads).toLocaleString()}</span></div>
      <div className="text-xs text-gray-400 mt-1">Last update: {updated ?? 'N/A'}</div>
    </div>
  );
};


/* CoreLibraries: centered, non-overlapping cards */
const CoreLibraries = ({ corePackages }) => {
  if (!corePackages || corePackages.length === 0) return null;

  return (
    <section id="core-libraries" className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Core Libraries</h2>

      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl w-full">
          {corePackages.map(pkg => (
            <div key={pkg.id} className="bg-gray-800 p-5 rounded-lg shadow-md border border-gray-700 flex flex-col justify-between w-full sm:w-80 md:w-96">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-3">{pkg.description || '—'}</p>
                <div className="text-sm text-gray-500 mb-3">
                  <p>Version: <span className="text-purple-400 font-medium">{pkg.version || pkg.newest_version || pkg.max_stable_version || 'N/A'}</span></p>
                  <p>Downloads: <span className="text-green-400 font-medium">{(pkg.downloads || 0).toLocaleString()}</span></p>
                </div>
                <div className="bg-gray-700 p-2 rounded-md text-sm font-mono text-gray-200 overflow-x-auto whitespace-nowrap">
                  <code className="select-all">cargo add {pkg.name}@{pkg.version || ''}</code>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
                {pkg.documentation && <a href={pkg.documentation} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Docs</a>}
                {pkg.repository && <a href={pkg.repository} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Repo</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* Home page: three charts (left = uploaded over time, mid = top5 last 1 month non-core, right = next5 last 6 months non-core) */
const HomePage = ({ allPackages, newsletterEmail, setNewsletterEmail, handleNewsletterSignup }) => {
  const getPackagesUploadedOverTime = (packages) => {
    const data = {};
    const startYear = 2023;
    const currentYear = new Date().getFullYear();

    packages.forEach(pkg => {
      if (!pkg.created_at) return;
      const createdDate = new Date(pkg.created_at);
      if (isNaN(createdDate)) return;
      const y = createdDate.getFullYear();
      const m = createdDate.getMonth();
      if (y >= startYear) {
        const label = (m < 6) ? `${y}-H1` : `${y}-H2`;
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

  const getTopNonCoreRecent = (packages) => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const withDates = packages
      .filter(p => p.is_core_library !== true) // exclude cores
      .map(pkg => {
        const when = parsePkgDate(pkg);
        return {
          ...pkg,
          _when: when,
          _score: (pkg.recent_downloads ?? pkg.downloads ?? 0)
        };
      });

    const lastMonth = withDates
      .filter(p => p._when && p._when >= oneMonthAgo)
      .sort((a,b) => b._score - a._score)
      .slice(0,5);

    const lastMonthIds = new Set(lastMonth.map(p => p.id));

    const nextSix = withDates
      .filter(p => p._when && p._when >= sixMonthsAgo && !lastMonthIds.has(p.id))
      .sort((a,b) => b._score - a._score)
      .slice(0,5);

    // include an 'updated' ISO date string for tooltip
    const monthData = lastMonth.map(p => ({ name: p.name, Downloads: p._score, updated: p._when ? p._when.toISOString().slice(0,10) : null }));
    const sixData = nextSix.map(p => ({ name: p.name, Downloads: p._score, updated: p._when ? p._when.toISOString().slice(0,10) : null }));

    return { monthData, sixData };
  };

  const packagesOverTimeData = getPackagesUploadedOverTime(allPackages);
  const { monthData, sixData } = getTopNonCoreRecent(allPackages);

  return (
    <>
      <header className="py-20 text-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-b-3xl shadow-xl">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 animate-fade-in-down">Explore the Ratatui Ecosystem</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up">Discover a vibrant collection of libraries and tools built with Ratatui for powerful terminal user interfaces.</p>
        <div className="mt-10">
          <button onClick={() => window.location.hash = '#package-list-page'} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg text-lg">View All Packages</button>
        </div>
      </header>

      <section id="stats" className="container mx-auto px-4 py-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-inner mt-16">
        <h2 className="text-4xl font-bold text-white mb-12 text-center animate-fade-in">Key Statistics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Packages Over Time */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Packages Uploaded Over Time (6-Month Intervals)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={packagesOverTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8 }} itemStyle={{ color: '#E5E7EB' }} labelStyle={{ color: '#9CA3AF' }} />
                <Line type="monotone" dataKey="Count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Middle: Top 5 last 1 month non-core */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Top 5 (Last 1 Month) — non-core</h3>
            {monthData && monthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthData} margin={{ top: 20, right: 10, left: 10, bottom: 70 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    label={{ value: 'Downloads', position: 'bottom', offset: 20, style: { textAnchor: 'middle' } }}
                  />
                  <YAxis stroke="#9CA3AF" allowDecimals={false} />
                  <Tooltip content={<DownloadsTooltip />} 
                    wrapperStyle={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="Downloads" fill="#10B981" barSize={30} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400">No non-core packages updated in the last month.</p>
            )}
          </div>

          {/* Right: Next 5 since last 6 months non-core */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Next 5 Top (Since Last 6 Months) — non-core</h3>
            {sixData && sixData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sixData} margin={{ top: 20, right: 10, left: 10, bottom: 70 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    label={{ value: 'Downloads', position: 'bottom', offset: 20, style: { textAnchor: 'middle' } }}
                  />
                  <YAxis stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip 
                    content={<DownloadsTooltip />} 
                    wrapperStyle={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="Downloads" fill="#60A5FA" barSize={30} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400">No additional non-core packages found in the last 6 months.</p>
            )}
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section id="documentation-section" className="container mx-auto px-4 py-16 text-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-inner mt-16">
        <h2 className="text-4xl font-bold text-white mb-8 animate-fade-in">Comprehensive Documentation</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">Dive deep into the Ratatui framework and its ecosystem with our extensive documentation.</p>
        <a href="https://quarto.org/" target="_blank" rel="noopener noreferrer" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg text-lg">Explore Docs</a>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="container mx-auto px-4 py-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-inner mt-16">
        <h2 className="text-4xl font-bold text-white mb-8 text-center animate-fade-in">Stay Updated</h2>
        <div className="max-w-xl mx-auto bg-gray-900 p-8 rounded-lg shadow-md border border-gray-700">
          <p className="text-gray-300 text-lg text-center mb-6">Sign up for our newsletter to get the latest news, updates, and new package releases in the Ratatui ecosystem.</p>
          <form onSubmit={handleNewsletterSignup} className="flex flex-col md:flex-row gap-4">
            <input type="email" placeholder="Your email address" className="flex-grow p-4 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition duration-300" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
};

/* Package list page (core libs separated and centered) */
const PackageListPage = ({ allPackages }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent_downloads');
  const [displayCount, setDisplayCount] = useState(9);
  const packagesPerPage = 9;

  const corePackages = allPackages.filter(p => p.is_core_library === true);

  const filteredPackages = allPackages
    .filter(p => p.is_core_library !== true)
    .filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(p.categories) && p.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())))
    );

  const sortedPackages = [...filteredPackages].sort((a,b) => {
    switch (sortBy) {
      case 'downloads': return (b.downloads || 0) - (a.downloads || 0);
      case 'recent_downloads': return (b.recent_downloads || 0) - (a.recent_downloads || 0);
      case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'alphabetical': return (a.name || '').localeCompare(b.name || '');
      default: return 0;
    }
  });

  const packagesToDisplay = sortedPackages.slice(0, displayCount);
  const hasMore = displayCount < sortedPackages.length;
  const loadMore = () => setDisplayCount(prev => prev + packagesPerPage);

  useEffect(() => setDisplayCount(packagesPerPage), [searchTerm, sortBy]);

  return (
    <section id="package-list-page" className="container mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-white mb-8 text-center">All Ratatui Packages</h2>

      <CoreLibraries corePackages={corePackages} />

      <div className="flex flex-col md:flex-row justify-between items-center mb-12 max-w-4xl mx-auto gap-4">
        <input type="text" placeholder="Search packages by name, description, or category..." className="flex-grow p-4 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition duration-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="relative w-full md:w-auto">
          <select className="block appearance-none w-full bg-gray-800 border border-gray-700 text-white py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-gray-700 focus:border-blue-500 transition duration-300" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent_downloads">Sort by: Weekly Downloads</option>
            <option value="downloads">Sort by: Most Popular (Total Downloads)</option>
            <option value="newest">Sort by: Newest</option>
            <option value="alphabetical">Sort by: Alphabetical (A-Z)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packagesToDisplay.length > 0 ? packagesToDisplay.map(pkg => (
          <div key={pkg.id} className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">{pkg.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-4">{pkg.description}</p>

              {pkg.categories && pkg.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {pkg.categories.map(cat => <span key={cat} className="bg-blue-800 text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">{cat}</span>)}
                </div>
              )}

              <div className="text-sm text-gray-500 mb-4">
                <p>Weekly Downloads: <span className="text-green-400 font-medium">{(pkg.recent_downloads || 0).toLocaleString()}</span></p>
                <p>Version: <span className="text-purple-400 font-medium">{pkg.version || pkg.newest_version || pkg.max_stable_version || 'N/A'}</span></p>
              </div>

              <div className="mb-4">
                <p className="text-gray-300 font-semibold mb-2">Install:</p>
                <div className="bg-gray-700 p-3 rounded-md text-sm font-mono text-gray-200 overflow-x-auto whitespace-nowrap">
                  <code className="select-all">cargo add {pkg.name}@{pkg.version || ''}</code>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-gray-700">
              {pkg.documentation && <a href={pkg.documentation} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Docs</a>}
              {pkg.repository && <a href={pkg.repository} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Repo</a>}
              {pkg.homepage && <a href={pkg.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Homepage</a>}
            </div>
          </div>
        )) : (
          <p className="col-span-full text-center text-gray-400 text-lg">No packages found matching your criteria.</p>
        )}
      </div>

      {hasMore && (
        <div className="text-center mt-10">
          <button onClick={loadMore} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg">Load More</button>
        </div>
      )}
    </section>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeNavLink, setActiveNavLink] = useState('home');
  const [navbarTransparent, setNavbarTransparent] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showMessageBox, setShowMessageBox] = useState(false);

  const [allPackages, setAllPackages] = useState([]);

  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => { setShowMessageBox(false); setMessage(''); }, 3000);
  };

  const handleNewsletterSignup = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      showMessage(`Thank you for signing up, ${newsletterEmail}!`);
      setNewsletterEmail('');
    } else {
      showMessage('Please enter a valid email address.');
    }
  };

  useEffect(() => {
    const onScroll = () => setNavbarTransparent(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#','');
      if (hash === 'package-list-page') { setCurrentPage('package-list'); setActiveNavLink('package-list'); }
      else if (hash === 'stats') { setCurrentPage('home'); setActiveNavLink('stats'); }
      else if (hash === 'documentation-section') { setCurrentPage('home'); setActiveNavLink('documentation'); }
      else if (hash === 'newsletter') { setCurrentPage('home'); setActiveNavLink('newsletter'); }
      else if (hash === 'contact') { setCurrentPage('home'); setActiveNavLink('contact'); }
      else { setCurrentPage('home'); setActiveNavLink('home'); }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data/ratcrate.json', { cache: 'no-store' });
        if (!res.ok) { console.warn('Failed to fetch data', res.status); setAllPackages([]); return; }
        const json = await res.json();
        const crates = Array.isArray(json.crates) ? json.crates : [];
        setAllPackages(crates);
      } catch (err) {
        console.error('Error loading ratcrate.json', err);
        setAllPackages([]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-100 font-inter">
      {showMessageBox && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">{message}</div>}

      <nav className={`flex justify-between items-center p-4 bg-gray-950 shadow-lg sticky top-0 z-40 ${navbarTransparent ? 'bg-opacity-90' : 'bg-opacity-100'}`}>
        <div className="text-2xl font-bold text-white rounded-md p-2 hover:bg-gray-800 cursor-pointer" onClick={() => { setCurrentPage('home'); setActiveNavLink('home'); window.location.hash = ''; }}>Ratatui Ecosystem</div>
        <div className="flex space-x-6">
          <a href="#package-list-page" className={`text-gray-300 hover:text-white rounded-md p-2 ${activeNavLink === 'package-list' ? 'text-blue-400 font-semibold' : ''}`} onClick={() => setCurrentPage('package-list')}>Package List</a>
          <a href="#stats" className={`text-gray-300 hover:text-white rounded-md p-2 ${activeNavLink === 'stats' ? 'text-blue-400 font-semibold' : ''}`} onClick={() => { setCurrentPage('home'); setActiveNavLink('stats'); }}>Stats</a>
          <a href="https://quarto.org/" target="_blank" rel="noopener noreferrer" className={`text-gray-300 hover:text-white rounded-md p-2 ${activeNavLink === 'documentation' ? 'text-blue-400 font-semibold' : ''}`} onClick={() => { setCurrentPage('home'); setActiveNavLink('documentation'); }}>Documentation</a>
          <a href="#newsletter" className={`text-gray-300 hover:text-white rounded-md p-2 ${activeNavLink === 'newsletter' ? 'text-blue-400 font-semibold' : ''}`} onClick={() => { setCurrentPage('home'); setActiveNavLink('newsletter'); }}>Newsletter</a>
        </div>
      </nav>

      {currentPage === 'home' ? (
        <HomePage allPackages={allPackages} newsletterEmail={newsletterEmail} setNewsletterEmail={setNewsletterEmail} handleNewsletterSignup={handleNewsletterSignup} />
      ) : (
        <PackageListPage allPackages={allPackages} />
      )}

      <footer className="bg-gray-950 text-gray-500 text-center p-6 mt-16 rounded-t-lg shadow-lg">
        <p>&copy; {new Date().getFullYear()} Ratatui Ecosystem. All rights reserved.</p>
        <p className="text-sm mt-2">Built with passion for terminal UI development.</p>
      </footer>

      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform: translateY(-20px);} to { opacity:1; transform: translateY(0);} }
        @keyframes fadeInUp { from { opacity:0; transform: translateY(20px);} to { opacity:1; transform: translateY(0);} }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .animate-fade-in-down { animation: fadeInDown 1s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; animation-delay: 0.3s; }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .line-clamp-4 { display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
    </div>
  );
};

export default App;

