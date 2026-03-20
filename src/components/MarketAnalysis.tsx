import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, BarChart3, Globe, Layers, X, ExternalLink } from 'lucide-react';
import { isMarketOpen } from '../utils/priceApi';

// All major NSE Nifty sectoral indices with Yahoo Finance symbols
const SECTORAL_INDICES = [
  { name: 'NIFTY 50',        symbol: '^NSEI',       sector: 'broad' },
  { name: 'NIFTY BANK',      symbol: '^NSEBANK',    sector: 'broad' },
  { name: 'NIFTY MIDCAP 100',symbol: 'NIFMDCP100.NS', sector: 'broad' },
  { name: 'NIFTY SMALLCAP', symbol: 'NIFSMCP250.NS', sector: 'broad' },
  { name: 'NIFTY NEXT 50',   symbol: '^NSMIDCP',    sector: 'broad' },
  { name: 'NIFTY AUTO',      symbol: '^CNXAUTO',    sector: 'sectoral' },
  { name: 'NIFTY IT',        symbol: '^CNXIT',      sector: 'sectoral' },
  { name: 'NIFTY FMCG',      symbol: '^CNXFMCG',   sector: 'sectoral' },
  { name: 'NIFTY PHARMA',    symbol: '^CNXPHARMA',  sector: 'sectoral' },
  { name: 'NIFTY METAL',     symbol: '^CNXMETAL',   sector: 'sectoral' },
  { name: 'NIFTY REALTY',    symbol: '^CNXREALTY',  sector: 'sectoral' },
  { name: 'NIFTY MEDIA',     symbol: '^CNXMEDIA',   sector: 'sectoral' },
  { name: 'NIFTY ENERGY',    symbol: '^CNXENERGY',  sector: 'sectoral' },
  { name: 'NIFTY FIN SVC',   symbol: '^CNXFINANCE', sector: 'sectoral' },
  { name: 'NIFTY PSU BANK',  symbol: '^CNXPSUBANK', sector: 'sectoral' },
  { name: 'NIFTY PVT BANK',  symbol: 'NIFTYPVTBNK.NS', sector: 'sectoral' },
  { name: 'NIFTY INFRA',     symbol: '^CNXINFRA',   sector: 'thematic' },
  { name: 'NIFTY CONSUME',   symbol: '^CNXCONSUMP', sector: 'thematic' },
  { name: 'NIFTY MNC',       symbol: '^CNXMNC',     sector: 'thematic' },
  { name: 'NIFTY COMMODITIES', symbol: '^CNXCMDT',  sector: 'thematic' },
  { name: 'NIFTY SERVICES',  symbol: '^CNXSERVICE', sector: 'thematic' },
];

interface IndexData {
  symbol: string;
  name: string;
  sector: string;
  price: number | null;
  change: number | null;
  prevClose: number | null;
  loading: boolean;
  error: boolean;
}

const CACHE_KEY = 'market_analysis_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Race 3 proxies — whichever responds first wins
const PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

// Bulk fetch all 21 indices in ONE request
const fetchAllIndices = async (symbols: string[], signal: AbortSignal): Promise<Map<string, { price: number; change: number; prevClose: number }> | null> => {
  const symbolString = symbols.map(encodeURIComponent).join(',');
  const directUrl = `/api/yahoo?symbols=${symbolString}`;
  
  const parseYahooData = (data: any, resolve: any) => {
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      const result = new Map();
      for (const [sym, info] of Object.entries(data)) {
        const sparkInfo = info as any;
        if (sparkInfo && Array.isArray(sparkInfo.close) && sparkInfo.close.length > 0) {
          const price = sparkInfo.close[sparkInfo.close.length - 1];
          const prevClose = sparkInfo.chartPreviousClose ?? sparkInfo.previousClose ?? price;
          const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
          result.set(sym, { price, change, prevClose });
        }
      }
      resolve(result);
      return true;
    }
    return false;
  };

  return new Promise(async (resolve) => {
    let settled = false;

    // 1. First attempt: Native Vercel Serverless Function (fastest, no CORS, no limits)
    try {
      const direct = await fetch(directUrl, { signal });
      if (direct.ok) {
        const data = await direct.json();
        if (parseYahooData(data, resolve)) {
          settled = true;
          return; // Success! No need for public proxies
        }
      }
    } catch (_) { }

    // 2. Fallback: Public Proxies Race (for local Vite dev primarily)
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbolString}&interval=1d&range=1d`;
    let pending = PROXIES.length;

    PROXIES.forEach(async (buildUrl) => {
      if (settled) return;
      try {
        const r = await fetch(buildUrl(url), { signal });
        if (!r.ok) throw new Error('bad status');
        const raw = await r.json();
        
        let data = raw;
        if (typeof raw?.contents === 'string') {
          try { data = JSON.parse(raw.contents); } catch { throw new Error('parse error'); }
        }
        
        if (!settled && parseYahooData(data, resolve)) {
          settled = true;
        }
      } catch (_) {
      } finally {
        pending--;
        if (pending === 0 && !settled) resolve(null);
      }
    });

    if (pending === 0 && !settled) resolve(null);
  });
};

const getHeatColor = (change: number | null): { bg: string; border: string; text: string } => {
  if (change === null) return { bg: 'rgba(55,65,81,0.5)', border: 'rgba(107,114,128,0.3)', text: '#9CA3AF' };
  if (change <= -4)   return { bg: 'rgba(127,29,29,0.85)',  border: '#7f1d1d', text: '#fecaca' };
  if (change <= -2.5) return { bg: 'rgba(153,27,27,0.8)',   border: '#991b1b', text: '#fca5a5' };
  if (change <= -1)   return { bg: 'rgba(185,28,28,0.75)',  border: '#b91c1c', text: '#fca5a5' };
  if (change < 0)     return { bg: 'rgba(239,68,68,0.6)',   border: '#ef4444', text: '#fee2e2' };
  if (change === 0)   return { bg: 'rgba(55,65,81,0.6)',    border: 'rgba(107,114,128,0.4)', text: '#D1D5DB' };
  if (change < 1)     return { bg: 'rgba(22,101,52,0.6)',   border: '#166534', text: '#bbf7d0' };
  if (change < 2.5)   return { bg: 'rgba(21,128,61,0.75)',  border: '#15803d', text: '#86efac' };
  if (change < 4)     return { bg: 'rgba(22,163,74,0.8)',   border: '#16a34a', text: '#4ade80' };
  return {              bg: 'rgba(20,83,45,0.85)',   border: '#14532d', text: '#4ade80' };
};

const MarketAnalysis: React.FC = () => {
  const [indices, setIndices] = useState<IndexData[]>(
    SECTORAL_INDICES.map(i => ({ ...i, price: null, change: null, prevClose: null, loading: true, error: false }))
  );
  const [filter, setFilter] = useState<'all' | 'broad' | 'sectoral' | 'thematic'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'gainers' | 'losers'>('gainers');
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    setRefreshing(true);

    // 1. Check Cache First (Instant Load)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setIndices(data);
          setLastUpdated(new Date(timestamp));
          setRefreshing(false);
          return;
        }
      }
    } catch (_) {}

    // 2. Not cached or expired: Reset to loading state
    setIndices(prev => prev.map(i => ({ ...i, loading: true, error: false })));

    // 3. Fire ONE single bulk request for all symbols
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000); // 10s generous timeout

    const symbols = SECTORAL_INDICES.map(i => i.symbol);
    const resultsMap = await fetchAllIndices(symbols, controller.signal);
    clearTimeout(timer);

    const newIndices: IndexData[] = SECTORAL_INDICES.map(idx => {
      const data = resultsMap?.get(idx.symbol);
      return {
        ...idx,
        loading: false,
        error: !data,
        price: data?.price ?? null,
        change: data?.change ?? null,
        prevClose: data?.prevClose ?? null,
      };
    });

    setIndices(newIndices);

    // 4. Save to Cache
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: newIndices
      }));
    } catch (_) {}

    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAll();
    // Auto-refresh every 3 minutes
    const interval = setInterval(loadAll, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const filtered = indices
    .filter(i => filter === 'all' || i.sector === filter)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'gainers') return (b.change ?? -999) - (a.change ?? -999);
      if (sortBy === 'losers') return (a.change ?? 999) - (b.change ?? 999);
      return 0;
    });
  const marketOpen = isMarketOpen();

  const totalPositive = filtered.filter(i => (i.change ?? 0) > 0).length;
  const totalNegative = filtered.filter(i => (i.change ?? 0) < 0).length;
  const totalNeutral = filtered.filter(i => i.change !== null && i.change === 0).length;

  return (
    <div style={{ padding: '0', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
        padding: '2rem 2rem 1.5rem',
        borderRadius: '0 0 24px 24px',
        marginBottom: '1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'250px', height:'250px', background:'radial-gradient(circle,rgba(139,92,246,0.2) 0%,transparent 70%)', borderRadius:'50%' }}/>
        <div style={{ position:'absolute', bottom:'-40px', left:'30%', width:'200px', height:'200px', background:'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)', borderRadius:'50%' }}/>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'0.5rem' }}>
              <div style={{ background:'rgba(139,92,246,0.25)', border:'1px solid rgba(139,92,246,0.4)', borderRadius:'10px', padding:'6px' }}>
                <BarChart3 size={22} color="#a78bfa" />
              </div>
              <h2 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:800, margin:0 }}>Market Analysis</h2>
            </div>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'14px', margin:0 }}>
              Live NSE Sectoral Indices — Real-time heatmap
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            {/* Market status */}
            <div style={{
              display:'flex', alignItems:'center', gap:'8px',
              background: marketOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${marketOpen ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius:'999px', padding:'6px 14px',
            }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: marketOpen ? '#22c55e' : '#ef4444', display:'inline-block', animation: marketOpen ? 'pulse 1.5s infinite' : 'none' }} />
              <span style={{ color: marketOpen ? '#86efac' : '#fca5a5', fontSize:'13px', fontWeight:600 }}>
                {marketOpen ? 'Market Open · LIVE' : 'Market Closed'}
              </span>
            </div>

            {/* Refresh */}
            <button
              onClick={loadAll}
              disabled={refreshing}
              style={{
                display:'flex', alignItems:'center', gap:'6px',
                background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
                borderRadius:'10px', padding:'8px 16px', color:'#fff', fontSize:'13px',
                cursor: refreshing ? 'not-allowed' : 'pointer', fontWeight:600,
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div style={{ display:'flex', gap:'12px', marginTop:'1.25rem', flexWrap:'wrap', position:'relative', zIndex:1 }}>
          {[
            { label:'Advancing', value:totalPositive, color:'#4ade80', bg:'rgba(22,163,74,0.2)', border:'rgba(22,163,74,0.3)' },
            { label:'Declining', value:totalNegative, color:'#f87171', bg:'rgba(239,68,68,0.2)', border:'rgba(239,68,68,0.3)' },
            { label:'Unchanged', value:totalNeutral,  color:'#94a3b8', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.2)' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:'10px', padding:'8px 18px' }}>
              <span style={{ color:s.color, fontWeight:800, fontSize:'20px' }}>{s.value}</span>
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', marginLeft:'6px' }}>{s.label}</span>
            </div>
          ))}
          {lastUpdated && (
            <div style={{ display:'flex', alignItems:'center', gap:'5px', color:'rgba(255,255,255,0.35)', fontSize:'12px', marginLeft:'auto' }}>
              <Activity size={12} />
              As of {lastUpdated.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })} IST
            </div>
          )}
        </div>
      </div>

      <div style={{ padding:'0 1.5rem 2rem' }}>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {([
            { key:'all',       label:'All Indices', icon:<Globe size={14}/> },
            { key:'broad',     label:'Broad Market', icon:<Layers size={14}/> },
            { key:'sectoral',  label:'Sectoral', icon:<BarChart3 size={14}/> },
            { key:'thematic',  label:'Thematic', icon:<Activity size={14}/> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                display:'flex', alignItems:'center', gap:'6px',
                padding:'8px 18px', borderRadius:'10px', fontSize:'13px', fontWeight:600, cursor:'pointer',
                transition:'all 0.2s',
                background: filter === tab.key ? '#6366f1' : 'white',
                border: filter === tab.key ? '1px solid #6366f1' : '1px solid #e2e8f0',
                color: filter === tab.key ? 'white' : '#64748b',
                boxShadow: filter === tab.key ? '0 4px 12px rgba(99,102,241,0.35)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', flexWrap:'wrap' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#fff', fontSize: '13px', color: '#334155', fontWeight: 500, outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer'
            }}
          >
            <option value="gainers">Top Gainers</option>
            <option value="losers">Top Losers</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Heatmap grid */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
          gap:'12px',
        }}>
          {filtered.map(idx => {
            const colors = getHeatColor(idx.change);
            return (
              <div
                key={idx.symbol}
                onClick={() => setSelectedIndex(idx)}
                style={{
                  background: colors.bg,
                  border:`1px solid ${colors.border}`,
                  borderRadius:'16px',
                  padding:'18px 16px',
                  cursor:'default',
                  transition:'transform 0.15s, box-shadow 0.15s',
                  boxShadow: idx.change !== null && Math.abs(idx.change) > 2
                    ? `0 4px 20px ${(idx.change ?? 0) > 0 ? 'rgba(22,163,74,0.25)' : 'rgba(239,68,68,0.25)'}`
                    : '0 2px 8px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = idx.change !== null && Math.abs(idx.change) > 2 ? `0 4px 20px ${(idx.change ?? 0) > 0 ? 'rgba(22,163,74,0.25)' : 'rgba(239,68,68,0.25)'}` : '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                  <div style={{ color: colors.text, fontSize:'12px', fontWeight:700, letterSpacing:'0.03em', opacity:0.85 }}>
                    {idx.name}
                  </div>
                  <ExternalLink size={12} color={colors.text} style={{ opacity: 0.5 }} />
                </div>

                {idx.loading ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    <div style={{ height:'24px', background:'rgba(255,255,255,0.1)', borderRadius:'6px', animation:'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height:'16px', width:'60%', background:'rgba(255,255,255,0.07)', borderRadius:'6px', animation:'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                ) : idx.error || idx.price === null ? (
                  <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px' }}>Data unavailable</div>
                ) : (
                  <>
                    <div style={{ color:'#fff', fontSize:'20px', fontWeight:800, letterSpacing:'-0.02em' }}>
                      {idx.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                      {(idx.change ?? 0) >= 0
                        ? <TrendingUp size={13} color={colors.text} />
                        : <TrendingDown size={13} color={colors.text} />}
                      <span style={{ color: colors.text, fontSize:'13px', fontWeight:700 }}>
                        {(idx.change ?? 0) >= 0 ? '+' : ''}{(idx.change ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop:'2rem', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
          <span style={{ color:'#94a3b8', fontSize:'12px', marginRight:'4px' }}>Performance:</span>
          {[
            { label:'≤ −4%', bg:'rgba(127,29,29,0.85)' },
            { label:'−2.5%', bg:'rgba(185,28,28,0.75)' },
            { label:'−1%',   bg:'rgba(239,68,68,0.6)' },
            { label:'0%',    bg:'rgba(55,65,81,0.6)' },
            { label:'+1%',   bg:'rgba(34,197,94,0.5)' },
            { label:'+2.5%', bg:'rgba(22,163,74,0.8)' },
            { label:'≥ +4%', bg:'rgba(20,83,45,0.85)' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'20px', height:'14px', background:l.bg, borderRadius:'3px' }} />
              <span style={{ color:'#94a3b8', fontSize:'11px' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedIndex && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedIndex(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }} 
          />
          
          {/* Modal Content */}
          <div style={{
            position: 'relative', background: '#0B0A10', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', width: '100%', maxWidth: '900px', height: '70vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#12101C' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{selectedIndex.name}</h3>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Live TradingView Chart</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIndex(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, position: 'relative', background: '#0B0A10' }}>
              <iframe
                title={`${selectedIndex.name} Chart`}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(
                  selectedIndex.symbol === '^NSEI' ? 'NSE:NIFTY' :
                  selectedIndex.symbol === '^NSEBANK' ? 'NSE:BANKNIFTY' :
                  selectedIndex.symbol === '^NSMIDCP' ? 'NSE:MIDCPNIFTY' :
                  selectedIndex.symbol === '^CNXIT' ? 'NSE:CNXIT' :
                  selectedIndex.symbol === '^CNXAUTO' ? 'NSE:CNXAUTO' :
                  selectedIndex.symbol === '^CNXFMCG' ? 'NSE:CNXFMCG' :
                  selectedIndex.symbol === '^CNXMETAL' ? 'NSE:CNXMETAL' :
                  selectedIndex.symbol === '^CNXPHARMA' ? 'NSE:CNXPHARMA' :
                  selectedIndex.symbol === '^CNXENERGY' ? 'NSE:CNXENERGY' :
                  selectedIndex.symbol === '^CNXMEDIA' ? 'NSE:CNXMEDIA' :
                  selectedIndex.symbol === '^CNXREALTY' ? 'NSE:CNXREALTY' :
                  selectedIndex.symbol === '^CNXPSUBANK' ? 'NSE:CNXPSUBANK' :
                  (selectedIndex.symbol.includes('.NS') ? `NSE:${selectedIndex.symbol.replace('.NS', '')}` : selectedIndex.symbol.replace('^', ''))
                )}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=0B0A10&studies=%5B%5D&theme=dark&style=1&timezone=Asia%2FKolkata&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scaleUp { from{opacity:0; transform:scale(0.95)} to{opacity:1; transform:scale(1)} }
      `}</style>
    </div>
  );
};

export default MarketAnalysis;
