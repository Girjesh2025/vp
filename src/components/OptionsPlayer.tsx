import { useState, useEffect, useMemo, useRef } from 'react';
import { Info } from 'lucide-react';
import { ResponsiveContainer, Treemap, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { createChart, CandlestickSeries, ColorType, CrosshairMode, type CandlestickData, type UTCTimestamp } from 'lightweight-charts';
import { fetchStockPrice, fetchHistoricalPrices, fetchHistoricalOHLCV } from '../utils/priceApi';

// Nifty 50 subset for the Money Flux Treemap
const NIFTY_50_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBI', 'L&T',
  'BAJFINANCE', 'BHARTIARTL', 'KOTAKBANK', 'HINDUNILVR', 'AXISBANK',
  'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO',
  'TATASTEEL', 'WIPRO', 'BAJAJFINSV', 'NESTLEIND', 'POWERGRID', 'M&M',
  'NTPC', 'JSWSTEEL'
];

// Custom Treemap Content
const CustomizedContent = (props: any) => {
  const { depth, x, y, width, height, name, fill } = props;
  if (depth < 1) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#111827"
        strokeWidth={1}
      />
      {width > 60 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2} fill="#ffffff" fontSize={10} textAnchor="middle" dominantBaseline="middle" fontWeight="600" className="tracking-wide">
          {name.length > 8 && width < 90 ? name.substring(0, 6) + '..' : name}
        </text>
      )}
    </g>
  );
};

// Custom Gauge component — premium redesign
const Gauge = ({ value, title, displayValue, id }: { value: number, title: string, displayValue?: string | number, id: string }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const rotation = (clampedValue / 100) * 180 - 90;

  // Dynamic zone based on value
  const getZone = (v: number) => {
    if (v < 20) return { label: 'Extreme Fear', color: '#dc2626', glow: 'rgba(220,38,38,0.35)' };
    if (v < 40) return { label: 'Fearish',      color: '#f97316', glow: 'rgba(249,115,22,0.35)' };
    if (v < 60) return { label: 'Neutral',       color: '#eab308', glow: 'rgba(234,179,8,0.3)' };
    if (v < 80) return { label: 'Bullish',       color: '#22c55e', glow: 'rgba(34,197,94,0.35)' };
    return       { label: 'Extreme Bull',        color: '#10b981', glow: 'rgba(16,185,129,0.4)' };
  };
  const zone = getZone(clampedValue);

  // Unique SVG IDs
  const arcGradId   = `arcGrad_${id}`;
  const bowlGradId  = `bowlGrad_${id}`;
  const needleGradId= `ndlGrad_${id}`;
  const pivotGradId = `pvtGrad_${id}`;
  const glowId      = `glow_${id}`;
  const glowStrongId= `glowS_${id}`;

  return (
    <div className="flex flex-col items-center relative w-full p-2 group">

      {/* Ambient zone glow — pulsing based on current zone */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 80%, ${zone.glow}, transparent 70%)` }}
      />
      {/* Static ambient glow always on */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 blur-2xl opacity-20 pointer-events-none rounded-full"
        style={{ background: zone.color }}
      />

      {/* SVG Gauge */}
      <div className="relative w-full" style={{ maxWidth: 420 }}>
        <svg viewBox="0 0 260 168" className="w-full overflow-visible" style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))' }}>
          <defs>
            {/* Full-spectrum arc gradient: red → orange → yellow → lime → emerald */}
            <linearGradient id={arcGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#dc2626" />
              <stop offset="22%"  stopColor="#ef4444" />
              <stop offset="40%"  stopColor="#f97316" />
              <stop offset="50%"  stopColor="#eab308" />
              <stop offset="65%"  stopColor="#84cc16" />
              <stop offset="85%"  stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Bowl background fill */}
            <radialGradient id={bowlGradId} cx="50%" cy="100%" r="70%">
              <stop offset="0%"   stopColor="#1e293b" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0a0e17" stopOpacity="0" />
            </radialGradient>

            {/* Metallic needle gradient */}
            <linearGradient id={needleGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#334155" />
              <stop offset="45%"  stopColor="#e2e8f0" />
              <stop offset="55%"  stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Pivot radial gradient for 3D look */}
            <radialGradient id={pivotGradId} cx="38%" cy="32%">
              <stop offset="0%"   stopColor="#94a3b8" />
              <stop offset="60%"  stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* Soft glow filter */}
            <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Strong glow for needle tip */}
            <filter id={glowStrongId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="9" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Bowl fill */}
          <path d="M 25 125 A 105 105 0 0 1 235 125 Z" fill={`url(#${bowlGradId})`} />

          {/* Outer glow track */}
          <path d="M 25 125 A 105 105 0 0 1 235 125" fill="none" stroke="#0f172a"    strokeWidth="22" strokeLinecap="round" opacity="0.9" />

          {/* Dark base track */}
          <path d="M 25 125 A 105 105 0 0 1 235 125" fill="none" stroke="#1e293b"    strokeWidth="18" strokeLinecap="round" opacity="0.8" />

          {/* Full-spectrum colored arc */}
          <path d="M 25 125 A 105 105 0 0 1 235 125" fill="none" stroke={`url(#${arcGradId})`} strokeWidth="13" strokeLinecap="round" filter={`url(#${glowId})`} />

          {/* Thin bright highlight edge on arc */}
          <path d="M 25 125 A 105 105 0 0 1 235 125" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Decorative inner dashed ring */}
          <path d="M 38 125 A 92 92 0 0 1 222 125" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 8" />

          {/* Tick marks — color matched to arc zones */}
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => {
            const tickRot = (tick / 100) * 180 - 90;
            const isMajor = tick % 25 === 0;
            const tickColor =
              tick < 20  ? '#ef4444' :
              tick < 40  ? '#f97316' :
              tick < 60  ? '#eab308' :
              tick < 80  ? '#84cc16' : '#10b981';
            const innerR = isMajor ? -85 : -90;
            return (
              <g key={tick} transform={`translate(130, 125) rotate(${tickRot})`}>
                <line x1="0" y1={innerR} x2="0" y2="-98"
                  stroke={tickColor}
                  strokeWidth={isMajor ? "2.5" : "1"}
                  opacity={isMajor ? 1 : 0.45}
                />
                {isMajor && (
                  <line x1="0" y1={innerR} x2="0" y2="-98"
                    stroke={tickColor} strokeWidth="4" opacity="0.25"
                    filter={`url(#${glowId})`}
                  />
                )}
              </g>
            );
          })}

          {/* Labels — well inside the bowl, clear of arc glow */}
          <text x="22"  y="152" fill="#475569" fontSize="10" textAnchor="middle" fontWeight="700" letterSpacing="1.5">F.EXT</text>
          <text x="72"  y="108" fill="#f87171" fontSize="11" textAnchor="middle" fontWeight="900" letterSpacing="1">BEAR</text>
          <text x="130" y="11"  fill="#cbd5e1" fontSize="13" textAnchor="middle" fontWeight="900" letterSpacing="3">NEUTRAL</text>
          <text x="188" y="108" fill="#4ade80" fontSize="11" textAnchor="middle" fontWeight="900" letterSpacing="1">BULL</text>
          <text x="238" y="152" fill="#475569" fontSize="10" textAnchor="middle" fontWeight="700" letterSpacing="1.5">F.EXT</text>

          {/* Needle shadow layer */}
          <g transform={`translate(130, 125) rotate(${rotation})`}
             style={{ transition: 'transform 1.4s cubic-bezier(.34,1.56,.64,1)' }}>
            <polygon points="-6,6 6,6 0,-102" fill="#000" opacity="0.35" filter={`url(#${glowStrongId})`} />
          </g>

          {/* Needle */}
          <g transform={`translate(130, 125) rotate(${rotation})`}
             style={{ transition: 'transform 1.4s cubic-bezier(.34,1.56,.64,1)' }}>
            {/* Tail counterweight */}
            <polygon points="-4,8 4,8 0,0" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
            {/* Main needle body — metallic */}
            <polygon points="-2.5,5 2.5,5 0.8,-85 -0.8,-85" fill={`url(#${needleGradId})`} />
            {/* Tip glow halo */}
            <polygon points="-1.2,-82 1.2,-82 0,-106" fill={zone.color} opacity="0.5" filter={`url(#${glowStrongId})`} />
            {/* Tip — colored to zone */}
            <polygon points="-1.2,-82 1.2,-82 0,-106" fill={zone.color} />

            {/* Pivot — outer ring dark */}
            <circle cx="0" cy="0" r="15" fill="#0c1220" stroke="#1e293b" strokeWidth="1.5" />
            {/* Pivot — middle metallic ring */}
            <circle cx="0" cy="0" r="11" fill={`url(#${pivotGradId})`} stroke="#475569" strokeWidth="1" />
            {/* Pivot — inner zone-colored dot */}
            <circle cx="0" cy="0" r="5.5" fill={zone.color} opacity="0.9" />
            {/* Pivot — specular shine */}
            <circle cx="-2.5" cy="-2.5" r="1.8" fill="rgba(255,255,255,0.55)" />
          </g>

        </svg>
      </div>

      {/* Zone badge + Title + Display Value */}
      <div className="flex flex-col items-center gap-2 -mt-2 z-10">

        {/* Dynamic zone pill */}
        <div
          className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase border backdrop-blur-md"
          style={{
            color: zone.color,
            borderColor: `${zone.color}50`,
            background: `${zone.color}18`,
            boxShadow: `0 0 12px ${zone.glow}`,
          }}
        >
          {zone.label}
        </div>

        {/* Title tag */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 px-4 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-md shadow">
          <span className="text-[12px] font-bold text-slate-200 tracking-[0.18em] uppercase">{title}</span>
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </div>

        {/* PCR / numeric value */}
        {displayValue !== undefined && (
          <div className="relative flex items-center justify-center mt-0.5">
            <span
              className="absolute inset-0 rounded-full blur-2xl opacity-50"
              style={{ background: zone.color }}
            />
            <span
              className="relative text-[2.6rem] font-black tracking-tight leading-none"
              style={{ color: zone.color, textShadow: `0 0 24px ${zone.color}, 0 0 48px ${zone.glow}` }}
            >
              {displayValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


const OptionsPlayer = () => {
  const [moneyFluxData, setMoneyFluxData] = useState<any[]>([]);
  const [sentimentValue, setSentimentValue] = useState(65); // Default to slightly bullish
  const [pcrValue, setPcrValue] = useState(70); // Default to slightly bullish
  const [rawPcr, setRawPcr] = useState<number>(1.2);
  const [niftyData, setNiftyData] = useState<{price: number, pts: number, percent: number} | null>(null);
  const [liveMovers, setLiveMovers] = useState<any[]>([]);

  const [chartConfig, setChartConfig] = useState({ symbol: "NSE:NIFTY", interval: "D" });
  const [chartMode, setChartMode] = useState<'internal' | 'tradingview'>('internal');
  const [internalSeries, setInternalSeries] = useState<Array<{ i: number; price: number }>>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [candles, setCandles] = useState<CandlestickData<UTCTimestamp>[]>([]);
  const [candlesLoading, setCandlesLoading] = useState(false);
  const [candlesError, setCandlesError] = useState<string | null>(null);
  const tradingViewChartRef = useRef<HTMLDivElement | null>(null);

  const indexYahooMap = useMemo<Record<string, string>>(() => {
    return {
      'NSE:NIFTY': '^NSEI',
      'NSE:BANKNIFTY': '^NSEBANK',
      'NSE:FINNIFTY': '^NSEI',
      'NSE:MIDCPNIFTY': '^NSEI',
      'BSE:SENSEX': '^BSESN',
    };
  }, []);

  const isIndexSymbol = useMemo(() => {
    return Object.prototype.hasOwnProperty.call(indexYahooMap, chartConfig.symbol);
  }, [chartConfig.symbol, indexYahooMap]);

  const isTradingViewIndex = useMemo(() => {
    return chartMode === 'tradingview' && isIndexSymbol;
  }, [chartMode, isIndexSymbol]);

  const tradingViewSymbol = useMemo(() => {
    // Keep the label aligned with the selected market instrument even though
    // the candlestick renderer now uses our own verified Yahoo OHLC feed.
    if (chartConfig.symbol === 'NSE:NIFTY' || chartConfig.symbol === 'NSE:NIFTY50') return 'NSE:NIFTY';
    if (chartConfig.symbol === 'NSE:BANKNIFTY') return 'NSE:BANKNIFTY';
    if (chartConfig.symbol === 'NSE:FINNIFTY') return 'NSE:FINNIFTY';
    if (chartConfig.symbol === 'NSE:MIDCPNIFTY') return 'NSE:MIDCPNIFTY';
    if (chartConfig.symbol === 'BSE:SENSEX') return 'BSE:SENSEX';
    return chartConfig.symbol;
  }, [chartConfig.symbol]);

  const candleRequestConfig = useMemo(() => {
    if (chartConfig.interval === 'W') return { range: '3y', interval: '1wk', bars: 180 };
    if (chartConfig.interval === 'M') return { range: '10y', interval: '1mo', bars: 180 };
    return { range: '1y', interval: '1d', bars: 240 };
  }, [chartConfig.interval]);

  useEffect(() => {
    if (chartMode !== 'tradingview') return;
    const yahooSymbol = indexYahooMap[chartConfig.symbol] ?? chartConfig.symbol;
    let cancelled = false;

    (async () => {
      try {
        setCandlesLoading(true);
        setCandlesError(null);
        const bars = await fetchHistoricalOHLCV(yahooSymbol, candleRequestConfig);
        if (cancelled) return;

        const nextCandles = bars.map((bar) => ({
          time: bar.timestamp as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }));

        setCandles(nextCandles);
      } catch (e: any) {
        if (cancelled) return;
        setCandles([]);
        setCandlesError(e?.message || 'Failed to load candlestick data');
      } finally {
        if (!cancelled) setCandlesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [candleRequestConfig, chartConfig.interval, chartConfig.symbol, chartMode, indexYahooMap, tradingViewSymbol]);

  useEffect(() => {
    if (chartMode !== 'tradingview') return;
    const host = tradingViewChartRef.current;
    if (!host || candles.length === 0) return;

    const chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#0f1520' },
        textColor: '#94a3b8',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      crosshair: {
        mode: CrosshairMode.MagnetOHLC,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        timeVisible: chartConfig.interval === 'D',
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
      borderVisible: false,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    series.setData(candles);
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      chart.timeScale().fitContent();
    });
    resizeObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, chartConfig.interval, chartMode]);

  useEffect(() => {
    if (!isTradingViewIndex) return;
    if (['1', '5', '15', '30', '60'].includes(chartConfig.interval)) {
      setChartConfig((prev) => ({ ...prev, interval: 'D' }));
    }
  }, [chartConfig.interval, isTradingViewIndex]);

  // NSE symbol → company website for logo fetching
  const STOCK_DOMAINS: Record<string, string> = {
    RELIANCE: 'ril.com', TCS: 'tcs.com', HDFCBANK: 'hdfcbank.com',
    ICICIBANK: 'icicibank.com', INFY: 'infosys.com', ITC: 'itcportal.com',
    SBI: 'sbi.co.in', 'L&T': 'larsentoubro.com', BAJFINANCE: 'bajajfinserv.in',
    BHARTIARTL: 'airtel.in', KOTAKBANK: 'kotak.com', HINDUNILVR: 'hul.co.in',
    AXISBANK: 'axisbank.com', ASIANPAINT: 'asianpaints.com', MARUTI: 'marutisuzuki.com',
    HCLTECH: 'hcltech.com', SUNPHARMA: 'sunpharma.com', TITAN: 'titancompany.in',
    ULTRACEMCO: 'ultratechcement.com', TATASTEEL: 'tatasteel.com', WIPRO: 'wipro.com',
    BAJAJFINSV: 'bajajfinserv.in', NESTLEIND: 'nestle.in', POWERGRID: 'powergridindia.com',
    'M&M': 'mahindra.com', NTPC: 'ntpc.co.in', JSWSTEEL: 'jsw.in',
  };

  useEffect(() => {
    if (chartMode !== 'internal') return;
    const yahooSymbol = indexYahooMap[chartConfig.symbol];
    if (!yahooSymbol) {
      setInternalSeries([]);
      setInternalError('Chart not available for this symbol');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setInternalLoading(true);
        setInternalError(null);
        const prices = await fetchHistoricalPrices(yahooSymbol, 90);
        if (cancelled) return;
        const series = prices.map((p, idx) => ({ i: idx + 1, price: p }));
        setInternalSeries(series);
      } catch (e: any) {
        if (cancelled) return;
        setInternalSeries([]);
        setInternalError(e?.message || 'Failed to load chart');
      } finally {
        if (!cancelled) setInternalLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chartConfig.symbol, chartMode, indexYahooMap]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // 1. Fetch Live Nifty 50 Data
      try {
        const nifty = await fetchStockPrice('^NSEI');
        if (nifty && isMounted) {
          const pts = nifty.previousClose ? (nifty.price - nifty.previousClose) : (nifty.price * nifty.change / 100);
          setNiftyData({
            price: nifty.price,
            pts: Number(pts.toFixed(2)),
            percent: nifty.change
          });
        }
      } catch (e) {
        console.warn('Failed to fetch Nifty 50', e);
      }

      // 2. Fetch Money Flux and Movers Data
      const results: any[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < NIFTY_50_SYMBOLS.length; i += batchSize) {
        const batch = NIFTY_50_SYMBOLS.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (symbol) => {
            try {
              const data = await fetchStockPrice(`${symbol}.NS`);
              if (data && isMounted) {
                // Determine color based on percentage change
                let fill = '#e11d48'; // Rose 600 (Dark Red)
                if (data.change > 0) fill = '#10b981'; // Emerald 500 (Green)
                if (data.change > 2) fill = '#059669'; // Emerald 600 (Darker Green)
                if (data.change < -2) fill = '#be123c'; // Rose 700 (Darker Red)
                
                // Size based on roughly standard market cap weighting
                let size = 100;
                if (['RELIANCE', 'HDFCBANK', 'ICICIBANK', 'INFY'].includes(symbol)) size = 500;
                else if (['TCS', 'ITC', 'L&T', 'SBI'].includes(symbol)) size = 300;

                const pts = data.previousClose ? (data.price - data.previousClose) : (data.price * data.change / 100);

                results.push({
                  name: symbol,
                  size,
                  change: data.change,
                  pts: Number(pts.toFixed(2)),
                  fill
                });
              }
            } catch (e) {
              console.warn(`Failed to fetch ${symbol}`);
            }
          })
        );
      }

      if (isMounted && results.length > 0) {
        setMoneyFluxData([{
          name: 'NIFTY50',
          children: [...results].sort((a, b) => b.size - a.size)
        }]);
        
        const advances = results.filter(r => r.change > 0).length;
        const total = results.length;
        const advanceRatio = advances / total;
        
        setSentimentValue(advanceRatio * 100);
        
        // 3. Fetch Real Options Chain for PCR
        try {
          const indexSymbol = chartConfig.symbol.replace('NSE:', '').replace('BSE:', '').replace('1!', '');
          const optionsResponse = await fetch(`/api/options/${indexSymbol}`);
          if (optionsResponse.ok) {
            const optionsData = await optionsResponse.json();
            if (optionsData && optionsData.filtered) {
              const ceOI = optionsData.filtered.CE?.totOI || 1;
              const peOI = optionsData.filtered.PE?.totOI || 1;
              const realPcr = Number((peOI / ceOI).toFixed(2));
              setRawPcr(realPcr);
              
              // Map real PCR to 0-100 gauge
              // High PCR (> 1.2) = oversold/bullish bounce expected
              // Low PCR (< 0.8) = overbought/bearish resistance expected
              // We want the gauge to show higher values (green) for bullish
              const normalizedGaugePcr = Math.min(100, Math.max(0, ((realPcr - 0.5) / 1.0) * 100));
              setPcrValue(normalizedGaugePcr);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch real Options Chain PCR', e);
        }

        // Top Movers: Sort by absolute change points and take top 10
        const sortedMovers = [...results].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 10);
        
        const formattedMovers = sortedMovers.map(m => {
          const isPos = m.change > 0;
          // Generate a consistent icon color based on string length
          const colors = ['text-rose-400', 'text-sky-400', 'text-amber-400', 'text-emerald-400', 'text-fuchsia-400'];
          const logoColor = colors[m.name.length % colors.length];
          return {
            symbol: m.name,
            pts: m.pts,
            color: isPos ? 'text-emerald-400' : 'text-rose-400',
            logoColor
          };
        });
        setLiveMovers(formattedMovers);
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 15000); // refresh every 15s
    
    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, [chartConfig.symbol]);

  const topMovers = liveMovers.length > 0 ? liveMovers : [
    { symbol: 'Loading...', pts: 0, icon: 'loading', color: 'text-slate-400', logoColor: 'text-slate-600' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] text-slate-300">
      {/* Top Control Bar */}
      <div className="flex items-center px-6 py-3 gap-6 bg-[#0f1520] border-b border-slate-800 shrink-0">
        <div className="flex bg-[#1e293b] rounded-lg p-1">
          <button
            onClick={() => setChartMode('tradingview')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              chartMode === 'tradingview'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Candlestick Chart
          </button>
          <button
            onClick={() => setChartMode('internal')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              chartMode === 'internal'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Line Chart
          </button>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-6">
          <select
            className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer hover:text-white transition-colors"
            value={chartConfig.symbol}
            onChange={(e) => setChartConfig(prev => ({ ...prev, symbol: e.target.value }))}
          >
            <option value="NSE:NIFTY">Index: NIFTY 50</option>
            <option value="BSE:SENSEX">Index: SENSEX</option>
            <option value="NSE:BANKNIFTY">Index: BANK NIFTY</option>
            <option value="NSE:MIDCPNIFTY">Index: MIDCAP NIFTY</option>
            <option value="NSE:FINNIFTY">Index: FIN NIFTY</option>
          </select>
          <select
            className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer hover:text-white transition-colors"
            value={chartConfig.interval}
            onChange={(e) => setChartConfig(prev => ({ ...prev, interval: e.target.value }))}
          >
            {!isTradingViewIndex && <option value="1">Time: 1m</option>}
            {!isTradingViewIndex && <option value="5">Time: 5m</option>}
            {!isTradingViewIndex && <option value="15">Time: 15m</option>}
            {!isTradingViewIndex && <option value="30">Time: 30m</option>}
            {!isTradingViewIndex && <option value="60">Time: 1H</option>}
            <option value="D">Time: 1D</option>
            <option value="W">Time: 1W</option>
            <option value="M">Time: 1M</option>
          </select>
          <select className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer hover:text-white transition-colors">
            {(() => {
              // Generate next 6 Nifty weekly expiries (every Thursday)
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const today = new Date();
              const day = today.getDay(); // 0=Sun … 6=Sat; 4=Thu
              const daysToThursday = day <= 4 ? 4 - day : 11 - day;
              const first = new Date(today);
              first.setDate(today.getDate() + daysToThursday);
              return Array.from({ length: 6 }, (_, i) => {
                const d = new Date(first);
                d.setDate(first.getDate() + i * 7);
                const label = `${d.getDate()} ${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
                return <option key={i} value={label}>Exp: {label}</option>;
              });
            })()}
          </select>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-6">
          
          {/* Indice Mover Section */}
          <div className="shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-bold text-white tracking-wide">Indice Mover</h2>
              <Info className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="flex flex-col xl:flex-row gap-4">
              {/* Nifty 50 Card */}
              <div className="w-full xl:w-56 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center shrink-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                <div className="text-3xl font-black text-blue-500 italic mb-3 tracking-tighter drop-shadow-md relative z-10">NIFTY<br/><span className="text-white">50</span></div>
                <div className="flex items-center gap-2 relative z-10">
                  <span className={`font-bold text-sm ${niftyData && niftyData.pts >= 0 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]'}`}>
                    {niftyData ? `${niftyData.pts > 0 ? 'UP' : 'DOWN'} ${Math.abs(niftyData.pts)} pts` : 'Loading...'}
                  </span>
                  <span className="text-slate-300 text-xs font-medium">
                    {niftyData ? `${niftyData.percent > 0 ? '↑' : '↓'} ${Math.abs(niftyData.percent)} %` : ''}
                  </span>
                </div>
              </div>
              
              {/* Movers Grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {topMovers.map(mover => (
                  <div key={mover.symbol} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/5 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:scale-105 transition-transform overflow-hidden">
                      {STOCK_DOMAINS[mover.symbol] ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${STOCK_DOMAINS[mover.symbol]}&sz=64`}
                          alt={mover.symbol}
                          className="w-6 h-6 object-contain rounded-sm"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={`text-sm font-black ${mover.logoColor} drop-shadow-md ${STOCK_DOMAINS[mover.symbol] ? 'hidden' : ''}`}>
                        {mover.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-slate-200 truncate">{mover.symbol}</span>
                      <span className={`text-[11px] font-bold ${mover.color} drop-shadow-md`}>
                        {mover.pts > 0 ? '+' : ''}{mover.pts}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-6 min-h-[600px]">
            
            {/* Left Column: Chart */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
              <div className="p-4 flex items-center justify-between shrink-0 border-b border-white/5">
                <h2 className="text-base font-bold text-white tracking-wide">Market Chart</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChartMode('internal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${chartMode === 'internal' ? 'bg-white/10 text-white border-white/15' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'}`}
                  >
                    Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('tradingview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${chartMode === 'tradingview' ? 'bg-white/10 text-white border-white/15' : 'bg-transparent text-slate-300 border-white/10 hover:bg-white/5'}`}
                  >
                    TradingView
                  </button>
                  <a
                    href={`https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tradingViewSymbol)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-transparent text-slate-300 border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Open
                  </a>
                </div>
              </div>
              <div className="flex-1 w-full relative min-h-[400px]">
                {chartMode === 'tradingview' ? (
                  <div className="absolute inset-0">
                    {candlesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : candles.length > 0 ? (
                      <>
                        <div ref={tradingViewChartRef} className="h-full w-full" />
                        <div className="absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                          <div className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">TradingView Candles</div>
                          <div className="mt-1 text-xs font-semibold text-slate-200">{tradingViewSymbol}</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-sm font-bold text-slate-200">Candlestick chart unavailable</div>
                        <div className="mt-1 text-xs text-slate-400 max-w-[360px]">
                          {candlesError || 'Unable to load candlestick data for this symbol.'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 p-4">
                    {internalLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : internalSeries.length > 0 ? (
                      <div className="h-full w-full relative">
                        <div className="absolute top-2 left-2 z-10 bg-black/30 backdrop-blur border border-white/10 rounded-lg px-3 py-2">
                          <div className="text-[10px] font-bold text-slate-400">Last</div>
                          <div className="text-sm font-black text-white">
                            ₹{internalSeries[internalSeries.length - 1].price.toFixed(2)}
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={internalSeries} margin={{ top: 16, right: 10, left: 10, bottom: 8 }}>
                          <defs>
                            <linearGradient id="internalChartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis
                            dataKey="i"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={32}
                          />
                          <YAxis
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={56}
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(v) => `₹${Number(v).toFixed(0)}`}
                          />
                          <Tooltip
                            cursor={{ stroke: 'rgba(255,255,255,0.12)' }}
                            contentStyle={{
                              background: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: '12px',
                            }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 700, fontSize: 12 }}
                            itemStyle={{ color: '#e2e8f0', fontWeight: 800 }}
                            formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Price']}
                            labelFormatter={(label) => `Point ${label}`}
                          />
                          <Area type="monotone" dataKey="price" stroke="#60a5fa" strokeWidth={2} fill="url(#internalChartGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-sm font-bold text-slate-200">Chart unavailable</div>
                        <div className="mt-1 text-xs text-slate-400 max-w-[360px]">
                          {internalError || 'Unable to load chart data for this symbol.'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Dials & Treemap */}
            <div className="flex flex-col gap-6 min-h-0">
              
              {/* Dials — side by side in one card so both fit on screen */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 pt-4 pb-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-2xl" />
                <div className="grid grid-cols-2 gap-2">
                  <Gauge id="sentiment" value={sentimentValue} title="Sentiment Bias" />
                  <Gauge id="pcr"       value={pcrValue}       title="PCR" displayValue={rawPcr} />
                </div>
              </div>

              {/* Money Flux Treemap */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex-1 flex flex-col min-h-[300px]">
                <div className="p-4 flex items-center gap-2 shrink-0 border-b border-white/5">
                  <h2 className="text-base font-bold text-white tracking-wide">Money Flux</h2>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 w-full p-4 pt-0">
                  {moneyFluxData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={moneyFluxData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#131722"
                        content={<CustomizedContent />}
                      >
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-lg shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                                  <p className="font-bold text-white drop-shadow-md">{data.name}</p>
                                  <p className={`text-sm font-bold ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'} drop-shadow-md`}>
                                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </Treemap>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OptionsPlayer;
