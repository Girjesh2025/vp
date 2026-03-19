import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, BarChart3, Globe, Layers } from 'lucide-react';
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

// Single fastest proxy with AbortSignal support for timeout control
const fetchIndexData = async (symbol: string, signal: AbortSignal): Promise<{ price: number; change: number; prevClose: number } | null> => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal });
    if (!r.ok) return null;
    const raw = await r.json();
    const data = JSON.parse(raw.contents ?? '{}');
    const meta = data?.chart?.result?.[0]?.meta;
    if (meta && typeof meta.regularMarketPrice === 'number') {
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
      const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
      return { price, change, prevClose };
    }
  } catch (_) {}
  return null;
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    // Reset all to loading
    setIndices(SECTORAL_INDICES.map(i => ({ ...i, price: null, change: null, prevClose: null, loading: true, error: false })));

    // Fire ALL requests in parallel — each with a 3.5-second timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    await Promise.allSettled(
      SECTORAL_INDICES.map(async (idx) => {
        const data = await fetchIndexData(idx.symbol, controller.signal);
        // Update this single tile immediately when it arrives
        setIndices(prev => prev.map(item =>
          item.symbol !== idx.symbol ? item : {
            ...item,
            loading: false,
            error: !data,
            price: data?.price ?? null,
            change: data?.change ?? null,
            prevClose: data?.prevClose ?? null,
          }
        ));
      })
    );

    clearTimeout(timer);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAll();
    // Auto-refresh every 3 minutes
    const interval = setInterval(loadAll, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const filtered = indices.filter(i => filter === 'all' || i.sector === filter);
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
                <div style={{ color: colors.text, fontSize:'12px', fontWeight:700, letterSpacing:'0.03em', marginBottom:'8px', opacity:0.85 }}>
                  {idx.name}
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

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default MarketAnalysis;
