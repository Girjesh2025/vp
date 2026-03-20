import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, BarChart3, Globe, Layers, X, ExternalLink } from 'lucide-react';
import { isMarketOpen } from '../utils/priceApi';

const SECTORAL_INDICES = [
  { name: 'NIFTY 50',        symbol: '^NSEI',       sector: 'broad' },
  { name: 'NIFTY BANK',      symbol: '^NSEBANK',    sector: 'broad' },
  { name: 'NIFTY MIDCAP 100',symbol: 'NIFTY_MIDCAP_100.NS', sector: 'broad' },
  { name: 'NIFTY SMALLCAP', symbol: 'NIFTY_SMLCAP_250.NS', sector: 'broad' },
  { name: 'NIFTY NEXT 50',   symbol: '^NSMIDCP',    sector: 'broad' },
  { name: 'NIFTY AUTO',      symbol: '^CNXAUTO',    sector: 'sectoral' },
  { name: 'NIFTY IT',        symbol: '^CNXIT',      sector: 'sectoral' },
  { name: 'NIFTY FMCG',      symbol: '^CNXFMCG',   sector: 'sectoral' },
  { name: 'NIFTY PHARMA',    symbol: '^CNXPHARMA',  sector: 'sectoral' },
  { name: 'NIFTY METAL',     symbol: '^CNXMETAL',   sector: 'sectoral' },
  { name: 'NIFTY REALTY',    symbol: '^CNXREALTY',  sector: 'sectoral' },
  { name: 'NIFTY MEDIA',     symbol: '^CNXMEDIA',   sector: 'sectoral' },
  { name: 'NIFTY ENERGY',    symbol: '^CNXENERGY',  sector: 'sectoral' },
  { name: 'NIFTY FIN SVC',   symbol: '^CNXFIN',     sector: 'sectoral' },
  { name: 'NIFTY PSU BANK',  symbol: '^CNXPSUBANK', sector: 'sectoral' },
  { name: 'NIFTY PVT BANK',  symbol: 'NIFTY_PVT_BANK.NS', sector: 'sectoral' },
  { name: 'NIFTY INFRA',     symbol: '^CNXINFRA',   sector: 'thematic' },
  { name: 'NIFTY CONSUME',   symbol: '^CNXCONSUM',  sector: 'thematic' },
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
};// Map of top 5 heavyweights for each index
const INDEX_CONSTITUENTS: Record<string, string[]> = {
  '^NSEI': ['RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 'ITC.NS'],
  '^NSEBANK': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
  'NIFTY_MIDCAP_100.NS': ['INDHOTEL.NS', 'CUMMINSIND.NS', 'YESBANK.NS', 'SUZLON.NS', 'OFSS.NS'],
  'NIFSMCP250.NS': ['BSE.NS', 'CDSL.NS', 'SUZLON.NS', 'RVNL.NS', 'IREDA.NS'],
  '^NSMIDCP': ['TRENT.NS', 'BEL.NS', 'HAL.NS', 'ZOMATO.NS', 'JIOFIN.NS'],
  '^CNXAUTO': ['M&M.NS', 'TATAMOTORS.NS', 'MARUTI.NS', 'BAJAJ-AUTO.NS', 'HEROMOTOCO.NS'],
  '^CNXIT': ['TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS'],
  '^CNXFMCG': ['ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'TATACONSUM.NS'],
  '^CNXPHARMA': ['SUNPHARMA.NS', 'DIVISLAB.NS', 'DRREDDY.NS', 'CIPLA.NS', 'LUPIN.NS'],
  '^CNXMETAL': ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'VEDL.NS', 'COALINDIA.NS'],
  '^CNXREALTY': ['DLF.NS', 'MACROTECH.NS', 'GODREJPROP.NS', 'PRESTIGE.NS', 'OBEROIRLTY.NS'],
  '^CNXMEDIA': ['ZEEL.NS', 'SUNTV.NS', 'PVRINOX.NS', 'NETWORK18.NS', 'TV18BRDCST.NS'],
  '^CNXENERGY': ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'TATAPOWER.NS'],
  '^CNXFIN': ['HDFCBANK.NS', 'ICICIBANK.NS', 'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'KOTAKBANK.NS'],
  '^CNXPSUBANK': ['SBIN.NS', 'PNB.NS', 'BANKBARODA.NS', 'CANBK.NS', 'UNIONBANK.NS'],
  'NIFTY_PVT_BANK.NS': ['HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'INDUSINDBK.NS'],
  '^CNXINFRA': ['LT.NS', 'RELIANCE.NS', 'BHARTIARTL.NS', 'NTPC.NS', 'ULTRACEMCO.NS'],
  '^CNXCONSUM': ['ITC.NS', 'HINDUNILVR.NS', 'M&M.NS', 'TITAN.NS', 'MARUTI.NS'],
  '^CNXMNC': ['MARUTI.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'ASHOKLEY.NS', 'CUMMINSIND.NS'],
  '^CNXCMDT': ['RELIANCE.NS', 'TATASTEEL.NS', 'HINDALCO.NS', 'ULTRACEMCO.NS', 'JSWSTEEL.NS'],
  '^CNXSERVICE': ['TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS'],
};

const MarketAnalysis: React.FC = () => {
  const [indices, setIndices] = useState<IndexData[]>(
    SECTORAL_INDICES.map(i => ({ ...i, price: null, change: null, prevClose: null, loading: true, error: false }))
  );
  const [filter, setFilter] = useState<'all' | 'broad' | 'sectoral' | 'thematic'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'gainers' | 'losers'>('gainers');
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null);
  const [constituents, setConstituents] = useState<IndexData[]>([]);
  const [loadingConstituents, setLoadingConstituents] = useState(false);
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    setRefreshing(true);

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

    setIndices(prev => prev.map(i => ({ ...i, loading: true, error: false })));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

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
    const interval = setInterval(loadAll, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // Load constituents whenever a tile is selected
  useEffect(() => {
    if (!selectedIndex) {
      setConstituents([]);
      return;
    }
    
    const fetchConstituents = async () => {
      setLoadingConstituents(true);
      const symbols = INDEX_CONSTITUENTS[selectedIndex.symbol] || [];
      if (symbols.length === 0) {
        setLoadingConstituents(false);
        return;
      }
      
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resultsMap = await fetchAllIndices(symbols, controller.signal);
      clearTimeout(timer);
      
      const mapped: IndexData[] = symbols.map(sym => {
        const data = resultsMap?.get(sym);
        return {
          name: sym.replace('.NS', ''),
          symbol: sym,
          sector: '',
          price: data?.price ?? null,
          change: data?.change ?? null,
          prevClose: data?.prevClose ?? null,
          loading: false,
          error: !data
        };
      });
      
      setConstituents(mapped);
      setLoadingConstituents(false);
    };
    
    fetchConstituents();
  }, [selectedIndex]);

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
      <div>
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
        padding: '2rem 2rem 1.5rem',
        borderRadius: '0 0 24px 24px',
        marginBottom: '1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
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
        <div style={{ display:'flex', gap:'8px', marginBottom:'1.25rem', flexWrap:'wrap' }}>
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
                padding:'8px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, cursor:'pointer',
                transition:'all 0.2s',
                background: filter === tab.key ? '#6366f1' : '#fff',
                border: filter === tab.key ? '1px solid #6366f1' : '1px solid #e2e8f0',
                color: filter === tab.key ? 'white' : '#475569',
                boxShadow: filter === tab.key ? '0 4px 12px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', flexWrap:'wrap' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '7px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: '#fff', fontSize: '13px', color: '#334155', fontWeight: 500, outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer'
            }}
          >
            <option value="gainers">🟢 Top Gainers</option>
            <option value="losers">🔴 Top Losers</option>
            <option value="name">🔤 Alphabetical (A-Z)</option>
          </select>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
          gap:'12px',
        }}>
          {filtered.map(idx => {
            const c = idx.change;
            const isPos = (c ?? 0) >= 0;
            const isNull = c === null;
            const absChange = Math.abs(c ?? 0);

            // Simple flat solid color — no gradient
            const bg = isNull
              ? '#1e293b'
              : isPos
                ? absChange >= 2 ? '#166534' : '#14532d'
                : absChange >= 2 ? '#991b1b' : '#7f1d1d';

            const border = isNull
              ? '1px solid rgba(255,255,255,0.07)'
              : isPos
                ? '1px solid rgba(34,197,94,0.25)'
                : '1px solid rgba(239,68,68,0.25)';

            return (
              <div
                key={idx.symbol}
                onClick={() => setSelectedIndex(idx)}
                style={{
                  background: bg,
                  border,
                  borderRadius: '16px',
                  padding: '18px 16px',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  boxShadow: isNull ? 'none' : isPos ? '0 2px 12px rgba(22,101,52,0.35)' : '0 2px 12px rgba(153,27,27,0.35)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = isPos ? '0 8px 24px rgba(22,101,52,0.5)' : '0 8px 24px rgba(153,27,27,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = isNull ? 'none' : isPos ? '0 2px 12px rgba(22,101,52,0.35)' : '0 2px 12px rgba(153,27,27,0.35)';
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                  <div style={{ color:'rgba(255,255,255,0.75)', fontSize:'11px', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                    {idx.name}
                  </div>
                  <ExternalLink size={11} color="rgba(255,255,255,0.3)" />
                </div>

                {idx.loading ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    <div style={{ height:'26px', background:'rgba(255,255,255,0.1)', borderRadius:'6px', animation:'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height:'14px', width:'55%', background:'rgba(255,255,255,0.06)', borderRadius:'6px', animation:'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                ) : idx.error || idx.price === null ? (
                  <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px' }}>No data</div>
                ) : (
                  <>
                    <div style={{ color:'#ffffff', fontSize:'21px', fontWeight:800, letterSpacing:'-0.02em' }}>
                      {idx.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'6px' }}>
                      {isPos ? <TrendingUp size={13} color="#86efac" /> : <TrendingDown size={13} color="#fca5a5" />}
                      <span style={{ color: isPos ? '#86efac' : '#fca5a5', fontSize:'13px', fontWeight:700 }}>
                        {isPos ? '+' : ''}{(c ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:'2rem', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', padding:'12px 16px', background:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <span style={{ color:'#94a3b8', fontSize:'12px', marginRight:'4px' }}>Performance Scale:</span>
          {[
            { label:'≤ −4%', bg:'rgba(127,29,29,0.8)' },
            { label:'−2.5%', bg:'rgba(185,28,28,0.7)' },
            { label:'−1%',   bg:'rgba(239,68,68,0.5)' },
            { label:'0%',    bg:'rgba(100,116,139,0.4)' },
            { label:'+1%',   bg:'rgba(34,197,94,0.35)' },
            { label:'+2.5%', bg:'rgba(22,163,74,0.6)' },
            { label:'≥ +4%', bg:'rgba(20,83,45,0.8)' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <div style={{ width:'22px', height:'12px', background:l.bg, borderRadius:'4px', border:'1px solid rgba(255,255,255,0.1)' }} />
              <span style={{ color:'#94a3b8', fontSize:'11px' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
      </div>

      {selectedIndex && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div 
            onClick={() => setSelectedIndex(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }} 
          />
          
          <div style={{
            position: 'relative', background: '#0B0A10', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', width: '100%', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#12101C' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>{selectedIndex.name} Deep-Dive</h3>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Sector Constituents & Live Advanced Chart</div>
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
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#0B0A10', overflowY: 'auto' }}>
              
              {/* Constituents Banner */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 600 }}>Top Movers Driving The Index</h4>
                {loadingConstituents ? (
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ minWidth: '160px', height: '68px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {constituents.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontStyle: 'italic' }}>Constituent data not available for this index.</div>
                    ) : (constituents.map(stock => {
                      const isPos = (stock.change ?? 0) >= 0;
                      const noData = stock.change === null;
                      return (
                        <div
                          key={stock.symbol}
                          style={{
                            minWidth: '155px',
                            padding: '14px 16px',
                            borderRadius: '14px',
                            background: noData
                              ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                              : isPos
                                ? 'linear-gradient(135deg, #166534 0%, #052e16 100%)'
                                : 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)',
                            border: `1px solid ${noData ? 'rgba(255,255,255,0.06)' : isPos ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            boxShadow: noData ? 'none' : isPos ? '0 2px 12px rgba(22,101,52,0.4)' : '0 2px 12px rgba(153,27,27,0.4)',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            cursor: 'default',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {stock.name}
                          </div>
                          <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 800 }}>
                            {stock.price ? stock.price.toLocaleString('en-IN') : '--'}
                          </div>
                          {stock.change !== null && (
                            <div style={{ color: isPos ? '#86efac' : '#fca5a5', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                              {isPos ? '+' : ''}{stock.change.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      );
                    }))}
                  </div>
                )}
              </div>

              {/* TradingView Advanced Chart Widget embedding */}
              <div style={{ flex: 1, minHeight: '400px', width: '100%', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>
                  *Chart shows BSE equivalent or top heavyweight proxy to bypass NSE embed restrictions
                </div>
                <iframe
                  title={`${selectedIndex.name} Chart`}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(
                    selectedIndex.symbol === '^NSEI' ? 'BSE:SENSEX' :
                    selectedIndex.symbol === '^NSEBANK' ? 'BSE:BANKEX' :
                    selectedIndex.symbol === '^NSMIDCP' ? 'BSE:MIDCAP' :
                    selectedIndex.symbol === '^CNXIT' ? 'BSE:BSE-IT' :
                    selectedIndex.symbol === '^CNXAUTO' ? 'BSE:BSE-AUTO' :
                    selectedIndex.symbol === '^CNXFMCG' ? 'BSE:BSE-FMCG' :
                    selectedIndex.symbol === '^CNXMETAL' ? 'BSE:BSE-METAL' :
                    selectedIndex.symbol === '^CNXPHARMA' ? 'BSE:BSE-HC' :
                    selectedIndex.symbol === '^CNXENERGY' ? 'BSE:ENERGY' :
                    selectedIndex.symbol === '^CNXMEDIA' ? 'BSE:ZEEL' :
                    selectedIndex.symbol === '^CNXREALTY' ? 'BSE:BSE-REALTY' :
                    selectedIndex.symbol === '^CNXPSUBANK' ? 'NSE:SBIN' :
                    `NSE:${(INDEX_CONSTITUENTS[selectedIndex.symbol]?.[0] || selectedIndex.symbol).replace('.NS', '').replace('^', '')}`
                  )}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=0B0A10&studies=%5B%5D&theme=dark&style=1&timezone=Asia%2FKolkata&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>

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
