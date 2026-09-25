import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Zap, Target, Clock, Shield, AlertTriangle, 
  Activity, Sparkles, BookOpen, ArrowRight, Flame, Crosshair, BarChart2,
  Search, Check, Compass, CheckCircle2, ChevronRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StrategyCard {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  setup: string;
  when: string;
  maxProfit: string;
  maxLoss: string;
  idealIV: string;
  complexity: 1 | 2 | 3;
  legs: string[];
  payoffSvg: React.ReactNode;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STRATEGIES: StrategyCard[] = [
  {
    name: 'Bull Call Spread',
    type: 'bullish',
    setup: 'Buy lower strike CALL + Sell higher strike CALL (same expiry)',
    when: 'Moderately bullish; want to reduce premium cost vs naked call',
    maxProfit: 'Difference between strikes − net premium paid',
    maxLoss: 'Net premium paid (limited)',
    idealIV: 'Low to moderate IV — cheaper to buy',
    complexity: 2,
    legs: ['BUY 1 ATM Call', 'SELL 1 OTM Call'],
    payoffSvg: <path d="M 5 25 L 15 25 L 25 10 L 35 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Bear Put Spread',
    type: 'bearish',
    setup: 'Buy higher strike PUT + Sell lower strike PUT (same expiry)',
    when: 'Moderately bearish; defined risk trade on downside',
    maxProfit: 'Difference between strikes − net premium paid',
    maxLoss: 'Net premium paid (limited)',
    idealIV: 'Low to moderate IV',
    complexity: 2,
    legs: ['BUY 1 ATM Put', 'SELL 1 OTM Put'],
    payoffSvg: <path d="M 5 10 L 15 10 L 25 25 L 35 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Iron Condor',
    type: 'neutral',
    setup: 'Sell OTM Call + Buy further OTM Call + Sell OTM Put + Buy further OTM Put',
    when: 'Market expected to stay range-bound; high IV (sell premium)',
    maxProfit: 'Net credit received upfront',
    maxLoss: 'Spread width − net credit',
    idealIV: 'High IV — sell expensive premium',
    complexity: 3,
    legs: ['SELL OTM Call', 'BUY far OTM Call', 'SELL OTM Put', 'BUY far OTM Put'],
    payoffSvg: <path d="M 5 25 L 10 25 L 15 10 L 25 10 L 30 25 L 35 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Long Straddle',
    type: 'volatile',
    setup: 'Buy ATM Call + Buy ATM Put (same strike, same expiry)',
    when: 'Big move expected but direction unknown (earnings, RBI policy)',
    maxProfit: 'Unlimited (on breakout in either direction)',
    maxLoss: 'Total premium paid for both options',
    idealIV: 'Low IV — buy cheap before an event',
    complexity: 2,
    legs: ['BUY 1 ATM Call', 'BUY 1 ATM Put'],
    payoffSvg: <path d="M 5 10 L 20 25 L 35 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Short Strangle',
    type: 'neutral',
    setup: 'Sell OTM Call + Sell OTM Put (different strikes, same expiry)',
    when: 'Market expected range-bound; collect theta decay',
    maxProfit: 'Net credit received (limited)',
    maxLoss: 'Unlimited (naked legs — risky!)',
    idealIV: 'Very high IV — collect inflated premium',
    complexity: 3,
    legs: ['SELL OTM Call', 'SELL OTM Put'],
    payoffSvg: <path d="M 5 25 L 12 10 L 28 10 L 35 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Covered Call',
    type: 'bullish',
    setup: 'Own underlying stock + Sell OTM Call',
    when: 'Mildly bullish; generate income from existing stock holding',
    maxProfit: 'Strike price − buy price + premium received',
    maxLoss: 'Stock price − premium received (stock can fall)',
    idealIV: 'High IV — sell expensive call for more premium',
    complexity: 1,
    legs: ['HOLD stock', 'SELL OTM Call'],
    payoffSvg: <path d="M 5 30 L 20 10 L 35 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
];

const PCR_ZONES = [
  { range: '< 0.5', label: 'Extreme Bullishness / Top Signal', color: 'rgb(220,38,38)', bg: 'rgba(220,38,38,0.1)', hint: 'Too many bulls — contrarian BEARISH warning. Smart money may start shorting.' },
  { range: '0.5 – 0.7', label: 'Bullish Zone', color: 'rgb(249,115,22)', bg: 'rgba(249,115,22,0.1)', hint: 'More calls being written — mild bullish sentiment. Market likely trending up.' },
  { range: '0.7 – 1.0', label: 'Neutral / Balanced', color: 'rgb(234,179,8)', bg: 'rgba(234,179,8,0.1)', hint: 'Balanced put/call activity. Market is indecisive. Wait for direction.' },
  { range: '1.0 – 1.2', label: 'Bearish Zone', color: 'rgb(34,197,94)', bg: 'rgba(34,197,94,0.1)', hint: 'More puts being written — mild bearish sentiment. Support may hold.' },
  { range: '> 1.2', label: 'Extreme Fear / Bottom Signal', color: 'rgb(16,185,129)', bg: 'rgba(16,185,129,0.1)', hint: 'Too many bears — contrarian BULLISH reversal signal. Good time to look for longs.' },
];

const IV_TIPS = [
  { label: 'High IV (>20%)', icon: '🔥', action: 'SELL premium strategies', strategies: 'Iron Condor, Short Strangle, Covered Call', reason: 'High IV means options are expensive. Favor selling to collect inflated premiums that decay.', color: 'from-orange-500/20 to-red-500/5', border: 'border-orange-500/30', text: 'text-orange-400' },
  { label: 'Low IV (<12%)', icon: '❄️', action: 'BUY premium strategies', strategies: 'Long Straddle, Long Strangle, Debit Spreads', reason: 'Low IV means options are cheap. Favor buying before an expected event (earnings, policy).', color: 'from-blue-500/20 to-cyan-500/5', border: 'border-blue-500/30', text: 'text-blue-400' },
  { label: 'IV Crush Risk', icon: '⚠️', action: 'AVOID buying before events', strategies: 'Don\'t buy naked options just before earnings/events', reason: 'After big events, IV collapses even if price moves. Buy early or use spreads.', color: 'from-amber-500/20 to-yellow-500/5', border: 'border-amber-500/30', text: 'text-amber-400' },
];

const STRIKE_GUIDE = [
  { tag: 'ITM', full: 'In The Money', call: 'Strike < CMP', put: 'Strike > CMP', premium: '🔴 High', delta: 80, deltaText: '0.6 – 1.0', use: 'Near delta-1 exposure; less time decay risk; expensive', color: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-500/30', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' },
  { tag: 'ATM', full: 'At The Money', call: 'Strike ≈ CMP', put: 'Strike ≈ CMP', premium: '🟡 Medium', delta: 50, deltaText: '~0.5', use: 'Most liquid; highest gamma & theta; best for directional trades', color: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
  { tag: 'OTM', full: 'Out of The Money', call: 'Strike > CMP', put: 'Strike < CMP', premium: '🟢 Low', delta: 25, deltaText: '0.1 – 0.4', use: 'Cheap lottery tickets; high risk; use for spread legs or event plays', color: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.3)]' },
];

const HEDGING_MODELS = [
  {
    title: 'Protective Put',
    subtitle: 'Long Cash / Futures Hedge',
    badge: 'Capital Protection',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'from-emerald-500/10 to-emerald-900/5',
    setup: 'Hold stock or long futures + buy ATM / slightly OTM put.',
    bestFor: 'Swing portfolios, overnight carry, event-risk protection on long holdings.',
    strength: 'Defines downside while leaving upside open.',
    weakness: 'Insurance cost drags returns if market stays flat.',
    proRule: 'Buy hedge when IV is reasonable and before major event risk, not after panic spikes.',
    payoffSvg: <path d="M 5 25 L 15 25 L 35 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Covered Call Overlay',
    subtitle: 'Yield Enhancement Hedge',
    badge: 'Income Model',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'from-blue-500/10 to-blue-900/5',
    setup: 'Hold stock + sell OTM call against the position.',
    bestFor: 'Neutral-to-mildly bullish view where trader wants monthly premium income.',
    strength: 'Reduces cost basis and cushions mild downside via premium collected.',
    weakness: 'Caps upside sharply in strong trending markets.',
    proRule: 'Use only on stocks you are comfortable delivering or rolling aggressively.',
    payoffSvg: <path d="M 5 35 L 20 15 L 35 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Collar',
    subtitle: 'Defined-Range Portfolio Hedge',
    badge: 'Professional Favorite',
    color: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'from-violet-500/10 to-violet-900/5',
    setup: 'Hold stock + buy protective put + sell covered call.',
    bestFor: 'Investors who want fixed downside protection with reduced hedge cost.',
    strength: 'Cheap or near-zero-cost hedge with clear floor and ceiling.',
    weakness: 'Locks portfolio into a band; upside gets surrendered above call strike.',
    proRule: 'Choose put strike at pain threshold and call strike at willing exit level.',
    payoffSvg: <path d="M 5 25 L 15 25 L 25 10 L 35 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Bull Put Spread Hedge',
    subtitle: 'Credit Structure Defense',
    badge: 'Margin Efficient',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'from-amber-500/10 to-amber-900/5',
    setup: 'Sell higher strike put + buy lower strike put.',
    bestFor: 'Bullish traders who want defined-risk premium selling instead of naked longs.',
    strength: 'Lower margin, fixed risk, theta-positive structure.',
    weakness: 'Still loses if market breaks below support quickly.',
    proRule: 'Build only below strong support and avoid entering after support has already cracked.',
    payoffSvg: <path d="M 5 25 L 15 25 L 25 10 L 35 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Bear Call Spread Hedge',
    subtitle: 'Short-Delta Overlay',
    badge: 'Resistance Hedge',
    color: 'text-rose-400',
    border: 'border-rose-500/20',
    bg: 'from-rose-500/10 to-rose-900/5',
    setup: 'Sell lower strike call + buy higher strike call.',
    bestFor: 'Long portfolios needing short-term hedge into resistance or event risk.',
    strength: 'Defined-risk bearish overlay; offsets drawdown when upside stalls.',
    weakness: 'Can under-hedge sharp downside because gains are capped.',
    proRule: 'Use as temporary overlay when spot rallies into supply, not as permanent defense.',
    payoffSvg: <path d="M 5 10 L 15 10 L 25 25 L 35 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Long Straddle / Strangle Hedge',
    subtitle: 'Event Volatility Hedge',
    badge: 'Volatility Play',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'from-cyan-500/10 to-cyan-900/5',
    setup: 'Buy both sides before a large expected move where direction is unclear.',
    bestFor: 'Budget day, policy, earnings, election, global shock setups.',
    strength: 'Protects against gap risk in either direction.',
    weakness: 'Theta and IV crush can destroy the trade if move is late or small.',
    proRule: 'Treat as event hedge only; reduce or exit quickly after event once volatility is realized.',
    payoffSvg: <path d="M 5 10 L 20 25 L 35 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Delta-Neutral Portfolio',
    subtitle: 'Directional Immunity',
    badge: 'Advanced',
    color: 'text-teal-400',
    border: 'border-teal-500/20',
    bg: 'from-teal-500/10 to-teal-900/5',
    setup: 'Adjust option positions so the total portfolio Delta equals zero.',
    bestFor: 'Traders wanting to profit purely from Theta (time decay) or Vega (volatility), without caring about market direction.',
    strength: 'Completely immune to small or moderate market movements.',
    weakness: 'Requires constant adjustment (Gamma scalping/rebalancing) as price moves.',
    proRule: 'Rebalance your deltas at the end of the day or at predefined price levels, not on every small tick.',
    payoffSvg: <path d="M 5 17 Q 20 12, 35 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Put Ratio Backspread',
    subtitle: 'Crash Protection',
    badge: 'Tail Risk Hedge',
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-500/20',
    bg: 'from-fuchsia-500/10 to-fuchsia-900/5',
    setup: 'Sell 1 ATM Put and Buy 2 (or 3) OTM Puts. Usually entered for a net credit or zero cost.',
    bestFor: 'Extreme bearish expectations. Protects against a black-swan market crash.',
    strength: 'Unlimited profit on the downside, often entered for zero cost.',
    weakness: 'Max loss occurs if the market drops slightly and pins exactly at the long strike.',
    proRule: 'Ensure the trade is entered for a credit so you don\'t lose money if the market aggressively rallies instead.',
    payoffSvg: <path d="M 5 5 L 20 25 L 25 15 L 35 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'Calendar Spread',
    subtitle: 'Time Decay Arbitrage',
    badge: 'Theta Play',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'from-orange-500/10 to-orange-900/5',
    setup: 'Sell a near-expiry option and Buy a far-expiry option of the same strike.',
    bestFor: 'Hedging a long-term position while generating short-term income from rapid time decay.',
    strength: 'Capitalizes on the fact that near-term options lose value faster than long-term options.',
    weakness: 'Vulnerable to large, fast directional moves and IV crush in the far-expiry option.',
    proRule: 'Use this when IV is generally low but expected to rise, as calendar spreads are positive Vega trades.',
    payoffSvg: <path d="M 5 25 Q 20 -5, 35 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
];

const HEDGING_MODELS_HI = [
  {
    title: 'प्रोटेक्टिव पुट (Protective Put)',
    subtitle: 'लॉन्ग कैश / फ्यूचर्स हेज',
    badge: 'कैपिटल प्रोटेक्शन',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'from-emerald-500/10 to-emerald-900/5',
    setup: 'स्टॉक या लॉन्ग फ्यूचर्स होल्ड करें + ATM / थोड़ा OTM पुट खरीदें।',
    bestFor: 'स्विंग पोर्टफोलियो, ओवरनाइट कैरी, लॉन्ग होल्डिंग्स पर इवेंट-रिस्क प्रोटेक्शन।',
    strength: 'नीचे का रिस्क (downside) फिक्स करता है जबकि ऊपर का प्रॉफिट खुला रहता है।',
    weakness: 'अगर मार्केट फ्लैट रहता है तो इन्शुरन्स की कॉस्ट (प्रीमियम) रिटर्न्स कम कर देती है।',
    proRule: 'हेज तब खरीदें जब IV ठीक हो और बड़े इवेंट रिस्क से पहले, न कि पैनिक आने के बाद।',
    payoffSvg: <path d="M 5 25 L 15 25 L 35 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'कवर्ड कॉल ओवरले (Covered Call Overlay)',
    subtitle: 'यील्ड एनहांसमेंट हेज',
    badge: 'इनकम मॉडल',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'from-blue-500/10 to-blue-900/5',
    setup: 'स्टॉक होल्ड करें + पोजीशन के खिलाफ OTM कॉल बेचें (Sell)।',
    bestFor: 'न्यूट्रल या थोड़ा बुलिश व्यू जहाँ ट्रेडर को हर महीने प्रीमियम इनकम चाहिए।',
    strength: 'कॉस्ट बेसिस कम करता है और प्रीमियम मिलने से थोड़ा डाउनसाइड कुशन देता है।',
    weakness: 'मजबूत ट्रेंडिंग मार्केट में ऊपर के प्रॉफिट को लिमिट कर देता है।',
    proRule: 'सिर्फ उन स्टॉक्स पर इस्तेमाल करें जिन्हें आप डिलीवरी देने या अग्रेसिव रोल करने के लिए कम्फ़र्टेबल हों।',
    payoffSvg: <path d="M 5 35 L 20 15 L 35 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'कॉलर (Collar)',
    subtitle: 'डिफाइंड-रेंज पोर्टफोलियो हेज',
    badge: 'प्रोफेशनल फेवरेट',
    color: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'from-violet-500/10 to-violet-900/5',
    setup: 'स्टॉक होल्ड करें + प्रोटेक्टिव पुट खरीदें + कवर्ड कॉल बेचें।',
    bestFor: 'इन्वेस्टर्स जो कम हेज कॉस्ट के साथ फिक्स्ड डाउनसाइड प्रोटेक्शन चाहते हैं।',
    strength: 'सस्ता या लगभग ज़ीरो-कॉस्ट हेज जिसमें फ्लोर और सीलिंग दोनों क्लियर होते हैं।',
    weakness: 'पोर्टफोलियो को एक रेंज में लॉक कर देता है; कॉल स्ट्राइक के ऊपर का प्रॉफिट नहीं मिलता।',
    proRule: 'पुट स्ट्राइक अपने रिस्क सहने की लिमिट पर चुनें और कॉल स्ट्राइक अपने प्रॉफिट बुक करने के लेवल पर।',
    payoffSvg: <path d="M 5 25 L 15 25 L 25 10 L 35 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'बुल पुट स्प्रेड हेज (Bull Put Spread)',
    subtitle: 'क्रेडिट स्ट्रक्चर डिफेंस',
    badge: 'मार्जिन एफिशिएंट',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'from-amber-500/10 to-amber-900/5',
    setup: 'हायर स्ट्राइक पुट बेचें + लोअर स्ट्राइक पुट खरीदें।',
    bestFor: 'बुलिश ट्रेडर्स जो नेकेड लॉन्ग की जगह डिफाइंड-रिस्क प्रीमियम सेलिंग चाहते हैं।',
    strength: 'कम मार्जिन, फिक्स्ड रिस्क, थीटा-पॉजिटिव (समय के साथ फायदा) स्ट्रक्चर।',
    weakness: 'अगर मार्केट सपोर्ट तोड़कर तेजी से गिरता है तो नुकसान होता है।',
    proRule: 'सिर्फ मजबूत सपोर्ट के नीचे ही बनाएं, सपोर्ट टूटने के बाद एंट्री न लें।',
    payoffSvg: <path d="M 5 25 L 15 25 L 25 10 L 35 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'बेयर कॉल स्प्रेड हेज (Bear Call Spread)',
    subtitle: 'शॉर्ट-डेल्टा ओवरले',
    badge: 'रेजिस्टेंस हेज',
    color: 'text-rose-400',
    border: 'border-rose-500/20',
    bg: 'from-rose-500/10 to-rose-900/5',
    setup: 'लोअर स्ट्राइक कॉल बेचें + हायर स्ट्राइक कॉल खरीदें।',
    bestFor: 'लॉन्ग पोर्टफोलियो जिन्हें रेजिस्टेंस या इवेंट रिस्क के पास शॉर्ट-टर्म हेज चाहिए।',
    strength: 'डिफाइंड-रिस्क बेयरिश ओवरले; जब अपसाइड रुक जाता है तो नुकसान की भरपाई करता है।',
    weakness: 'तेज गिरावट में पूरी तरह हेज नहीं कर पाता क्योंकि प्रॉफिट लिमिटेड होता है।',
    proRule: 'इसे टेम्परेरी ओवरले की तरह इस्तेमाल करें जब मार्केट रेजिस्टेंस (सप्लाई) पर हो, परमानेंट डिफेंस की तरह नहीं।',
    payoffSvg: <path d="M 5 10 L 15 10 L 25 25 L 35 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'लॉन्ग स्ट्रैडल / स्ट्रैंगल (Long Straddle)',
    subtitle: 'इवेंट वोलैटिलिटी हेज',
    badge: 'वोलैटिलिटी प्ले',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'from-cyan-500/10 to-cyan-900/5',
    setup: 'बड़े मूव की उम्मीद होने पर दोनों साइड (कॉल और पुट) खरीदें जब डायरेक्शन क्लियर न हो।',
    bestFor: 'बजट, पॉलिसी, अर्निंग्स, इलेक्शन, या ग्लोबल शॉक जैसे इवेंट्स।',
    strength: 'किसी भी डायरेक्शन में गैप रिस्क से बचाता है।',
    weakness: 'अगर मूव लेट या छोटा होता है तो थीटा और IV क्रश ट्रेड को बर्बाद कर सकते हैं।',
    proRule: 'सिर्फ इवेंट हेज की तरह इस्तेमाल करें; वोलैटिलिटी ख़त्म होने के बाद इवेंट के तुरंत बाद एग्जिट करें।',
    payoffSvg: <path d="M 5 10 L 20 25 L 35 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'डेल्टा-न्यूट्रल पोर्टफोलियो (Delta-Neutral)',
    subtitle: 'डायरेक्शनल इम्युनिटी',
    badge: 'एडवांस्ड',
    color: 'text-teal-400',
    border: 'border-teal-500/20',
    bg: 'from-teal-500/10 to-teal-900/5',
    setup: 'ऑप्शन पोजीशंस को इस तरह एडजस्ट करना कि पूरे पोर्टफोलियो का डेल्टा (Delta) ज़ीरो हो जाए।',
    bestFor: 'वे ट्रेडर्स जो सिर्फ थीटा (टाइम डिकेय) या वेगा (वोलैटिलिटी) से प्रॉफिट कमाना चाहते हैं, बिना मार्केट की दिशा की परवाह किए।',
    strength: 'छोटे या सामान्य मार्केट मूवमेंट्स से पोर्टफोलियो पर कोई असर नहीं पड़ता।',
    weakness: 'जैसे-जैसे प्राइस बदलता है, बार-बार एडजस्टमेंट (रीबैलेंसिंग) की जरुरत पड़ती है।',
    proRule: 'दिन के अंत में या पहले से तय प्राइस लेवल पर अपने डेल्टा को रीबैलेंस करें, हर छोटे टिक पर नहीं।',
    payoffSvg: <path d="M 5 17 Q 20 12, 35 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'पुट रेशियो बैकस्प्रेड (Put Ratio Backspread)',
    subtitle: 'क्रैश प्रोटेक्शन',
    badge: 'टेल रिस्क हेज',
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-500/20',
    bg: 'from-fuchsia-500/10 to-fuchsia-900/5',
    setup: '1 ATM पुट बेचें (Sell) और 2 (या 3) OTM पुट खरीदें (Buy)। इसे अक्सर ज़ीरो कॉस्ट या क्रेडिट पर किया जाता है।',
    bestFor: 'जब बहुत बड़ी गिरावट की उम्मीद हो। यह ब्लैक-स्वान (मार्केट क्रैश) से बचाता है।',
    strength: 'नीचे की तरफ अनलिमिटेड प्रॉफिट, और अक्सर इसे बनाने में कोई पैसा नहीं लगता (ज़ीरो कॉस्ट)।',
    weakness: 'सबसे बड़ा नुकसान तब होता है जब मार्केट थोड़ा सा गिरे और लॉन्ग स्ट्राइक पर ही रुक जाए।',
    proRule: 'ट्रेड हमेशा क्रेडिट (प्रीमियम लेकर) बनाएं ताकि अगर मार्केट तेजी से ऊपर भागे तो भी आपको नुकसान न हो।',
    payoffSvg: <path d="M 5 5 L 20 25 L 25 15 L 35 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    title: 'कैलेंडर स्प्रेड (Calendar Spread)',
    subtitle: 'टाइम डिकेय आर्बिट्रेज',
    badge: 'थीटा प्ले',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'from-orange-500/10 to-orange-900/5',
    setup: 'पास की एक्सपायरी का ऑप्शन बेचें और दूर की एक्सपायरी का उसी स्ट्राइक का ऑप्शन खरीदें।',
    bestFor: 'लॉन्ग-टर्म पोजीशन को हेज करने और पास की एक्सपायरी के टाइम डिकेय (Theta) से शॉर्ट-टर्म इनकम कमाने के लिए।',
    strength: 'इस बात का फायदा उठाता है कि पास की एक्सपायरी के ऑप्शंस दूर वालों के मुकाबले तेजी से अपनी वैल्यू (प्रीमियम) खोते हैं।',
    weakness: 'मार्केट में अचानक बड़े मूव या दूर की एक्सपायरी में IV क्रैश होने पर नुकसान हो सकता है।',
    proRule: 'इसे तब इस्तेमाल करें जब IV कम हो लेकिन बढ़ने की उम्मीद हो, क्योंकि कैलेंडर स्प्रेड्स पॉजिटिव वेगा (Vega) ट्रेड होते हैं।',
    payoffSvg: <path d="M 5 25 Q 20 -5, 35 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
];

const HEDGING_RULES = [
  {
    title: 'When To Hedge',
    tone: 'text-emerald-400',
    icon: '🛡️',
    points: [
      'Hedge before risk expands: events, overnight gaps, weak global setup, or major support tests.',
      'Do not wait until panic candles and IV explosions make insurance extremely expensive.',
      'Portfolio size should decide hedge size, not emotion after the move has already happened.',
    ],
  },
  {
    title: 'What Professionals Hedge',
    tone: 'text-blue-400',
    icon: '🎯',
    points: [
      'They hedge delta exposure first, then gamma/vega only when event risk justifies it.',
      'Index options are preferred for broad portfolio hedges because liquidity and execution are superior.',
      'Single-stock hedges are used only when portfolio risk is concentrated in a few names.',
    ],
  },
  {
    title: 'How To Size',
    tone: 'text-amber-400',
    icon: '⚖️',
    points: [
      'Full hedge is rare. Partial hedge of 25% to 70% is common to protect while preserving upside.',
      'Over-hedging converts a portfolio into a low-conviction neutral book and hurts compounding.',
      'Use hedge notional against portfolio beta, not just raw rupee value.',
    ],
  },
  {
    title: 'Adjustment Discipline',
    tone: 'text-rose-400',
    icon: '🔁',
    points: [
      'Roll hedges when spot breaches your intended defense zone, not randomly every day.',
      'If the hedge doubles quickly on panic, scale some out; the job of the hedge is protection, not greed.',
      'Remove decayed hedges when the original risk condition disappears.',
    ],
  },
];

const HEDGING_RULES_HI = [
  {
    title: 'हेज कब करें (When To Hedge)',
    tone: 'text-emerald-400',
    icon: '🛡️',
    points: [
      'रिस्क बढ़ने से पहले हेज करें: इवेंट्स, ओवरनाइट गैप्स, कमजोर ग्लोबल सेटअप, या बड़े सपोर्ट टेस्ट पर।',
      'पैनिक कैंडल बनने और IV बढ़ने का इंतज़ार न करें क्योंकि तब इन्शुरन्स बहुत महंगा हो जाता है।',
      'पोर्टफोलियो का साइज हेज का साइज तय करना चाहिए, न कि मूव हो जाने के बाद का इमोशन।',
    ],
  },
  {
    title: 'प्रोफेशनल्स क्या हेज करते हैं',
    tone: 'text-blue-400',
    icon: '🎯',
    points: [
      'वे पहले डेल्टा एक्सपोजर हेज करते हैं, फिर गामा/वेगा (सिर्फ तब जब इवेंट रिस्क हो)।',
      'पूरे पोर्टफोलियो हेज के लिए इंडेक्स ऑप्शंस बेहतर होते हैं क्योंकि उनमें लिक्विडिटी और एग्जीक्यूशन अच्छा होता है।',
      'सिंगल-स्टॉक हेज का इस्तेमाल सिर्फ तब होता है जब पोर्टफोलियो रिस्क कुछ ही स्टॉक्स में ज्यादा हो।',
    ],
  },
  {
    title: 'साइज कैसे तय करें (How To Size)',
    tone: 'text-amber-400',
    icon: '⚖️',
    points: [
      'फुल हेज (100%) बहुत कम होता है। 25% से 70% का पार्शियल हेज आम है ताकि प्रोटेक्शन भी रहे और अपसाइड भी।',
      'ओवर-हेज करने से पोर्टफोलियो न्यूट्रल हो जाता है और लॉन्ग-टर्म प्रॉफिट (कंपाउंडिंग) को नुकसान पहुँचता है।',
      'सिर्फ रुपये की वैल्यू नहीं, बल्कि पोर्टफोलियो बीटा के हिसाब से हेज नोशनल तय करें।',
    ],
  },
  {
    title: 'एडजस्टमेंट डिसिप्लिन (Adjustments)',
    tone: 'text-rose-400',
    icon: '🔁',
    points: [
      'हेज को तब रोल करें जब स्पॉट प्राइस आपके डिफेंस जोन को पार करे, न कि रोज़ाना रैंडम तरीके से।',
      'अगर पैनिक में हेज का प्राइस तेजी से डबल हो जाए, तो कुछ प्रॉफिट बुक करें; हेज का काम प्रोटेक्शन है, लालच नहीं।',
      'जब रिस्क ख़त्म हो जाए, तो डिकेय हो रहे (गिरते हुए) हेज को हटा दें।',
    ],
  },
];

const GREEKS_DATA = [
  {
    id: 'delta',
    name: 'Delta (δ)',
    hindiName: 'डेल्टा',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/10 to-emerald-900/5',
    border: 'border-emerald-500/20',
    icon: '📈',
    definition: 'How much the option premium changes for every ₹1 move in the underlying stock.',
    hindiDefinition: 'अंडरलाइंग स्टॉक के ₹1 ऊपर या नीचे जाने पर ऑप्शन के प्रीमियम में कितना बदलाव आएगा।',
    call: 'Positive (0 to +1)',
    put: 'Negative (-1 to 0)',
    insight: 'ATM options have a delta of ~0.50. Deep ITM approaches 1.0 (moves like the stock). Deep OTM approaches 0.',
    hindiInsight: 'ATM ऑप्शंस का डेल्टा ~0.50 होता है। Deep ITM का 1.0 (स्टॉक की तरह चलता है) और Deep OTM का 0 होता है।',
  },
  {
    id: 'gamma',
    name: 'Gamma (γ)',
    hindiName: 'गामा',
    color: 'text-blue-400',
    bg: 'from-blue-500/10 to-blue-900/5',
    border: 'border-blue-500/20',
    icon: '🚀',
    definition: 'The rate of change of Delta. It measures how fast Delta changes as the stock moves.',
    hindiDefinition: 'डेल्टा के बदलने की स्पीड। यह बताता है कि स्टॉक के मूव होने पर डेल्टा कितनी तेजी से बढ़ेगा या घटेगा।',
    call: 'Positive',
    put: 'Positive',
    insight: 'Gamma is highest for ATM options. It is the reason options explode in value during sudden big moves.',
    hindiInsight: 'गामा ATM ऑप्शंस में सबसे ज्यादा होता है। अचानक बड़े मूव आने पर ऑप्शंस का प्राइस तेजी से इसी वजह से बढ़ता है।',
  },
  {
    id: 'vega',
    name: 'Vega (ν)',
    hindiName: 'वेगा',
    color: 'text-orange-400',
    bg: 'from-orange-500/10 to-orange-900/5',
    border: 'border-orange-500/20',
    icon: '🔥',
    definition: 'How much the option premium changes for every 1% change in Implied Volatility (IV).',
    hindiDefinition: 'Implied Volatility (IV) में 1% का बदलाव आने पर ऑप्शन के प्रीमियम में कितना बदलाव आएगा।',
    call: 'Positive',
    put: 'Positive',
    insight: 'Vega is highest for ATM options. Option buyers love rising IV; sellers love crashing IV.',
    hindiInsight: 'वेगा ATM ऑप्शंस में सबसे ज्यादा होता है। ऑप्शन खरीदने वालों को बढ़ता हुआ IV और बेचने वालों को गिरता हुआ IV पसंद है।',
  },
  {
    id: 'theta',
    name: 'Theta (θ)',
    hindiName: 'थीटा',
    color: 'text-rose-400',
    bg: 'from-rose-500/10 to-rose-900/5',
    border: 'border-rose-500/20',
    icon: '⏳',
    definition: 'How much value the option loses each day as it gets closer to expiration (Time Decay).',
    hindiDefinition: 'एक्सपायरी के करीब आने पर हर दिन ऑप्शन अपनी कितनी वैल्यू (प्रीमियम) खोता है (टाइम डिकेय)।',
    call: 'Negative',
    put: 'Negative',
    insight: 'Theta hurts option buyers and helps sellers. Decay accelerates rapidly in the last week of expiry.',
    hindiInsight: 'थीटा ऑप्शन खरीदने वालों का दुश्मन और बेचने वालों का दोस्त है। एक्सपायरी के आखिरी हफ्ते में यह बहुत तेजी से गिरता है।',
  },
  {
    id: 'rho',
    name: 'Rho (ρ)',
    hindiName: 'रो',
    color: 'text-purple-400',
    bg: 'from-purple-500/10 to-purple-900/5',
    border: 'border-purple-500/20',
    icon: '🏦',
    definition: 'How much the option premium changes for every 1% change in interest rates.',
    hindiDefinition: 'ब्याज दरों (Interest Rates) में 1% का बदलाव आने पर ऑप्शन के प्रीमियम में कितना बदलाव आएगा।',
    call: 'Positive',
    put: 'Negative',
    insight: 'Usually ignored by short-term retail traders as interest rates change slowly. Matters more for LEAPS.',
    hindiInsight: 'शॉर्ट-टर्म ट्रेडर्स इसे इग्नोर करते हैं क्योंकि ब्याज दरें धीरे बदलती हैं। यह लॉन्ग-टर्म ऑप्शंस (LEAPS) में ज्यादा काम आता है।',
  }
];

const BUYER_GUIDE = {
  why: {
    title: 'Why Buy Options?',
    hindiTitle: 'ऑप्शन क्यों खरीदें?',
    points: [
      { text: 'Limited Risk, Unlimited Reward: Your maximum loss is strictly limited to the premium paid.', hindi: 'लिमिटेड रिस्क, अनलिमिटेड रिवॉर्ड: आपका सबसे बड़ा नुकसान सिर्फ दिए गए प्रीमियम तक ही सीमित है।' },
      { text: 'High Leverage: Control a large position with a very small amount of capital.', hindi: 'हाई लीवरेज (Leverage): बहुत कम कैपिटल से एक बड़ी पोजीशन को कंट्रोल करने की ताकत।' },
      { text: 'No Margin Calls: Unlike selling options or futures, you will never get a margin call.', hindi: 'नो मार्जिन कॉल: ऑप्शन सेलिंग या फ्यूचर्स की तरह इसमें कभी मार्जिन कॉल का खतरा नहीं होता।' }
    ]
  },
  when: {
    title: 'When to Buy Options?',
    hindiTitle: 'ऑप्शन कब खरीदें?',
    points: [
      { text: 'High Momentum: When you expect a fast, directional breakout (Delta > Theta).', hindi: 'हाई मोमेंटम (Momentum): जब आपको लगे कि मार्केट बहुत तेजी से एक ही दिशा में भागेगा (डेल्टा > थीटा)।' },
      { text: 'Low IV Environment: Buy when Implied Volatility is low (options are cheap) and expected to expand.', hindi: 'लो IV (Low IV): तब खरीदें जब IV बहुत कम हो (ऑप्शन सस्ते हों) और आगे बढ़ने की उम्मीद हो।' },
      { text: 'Before Big Events: Buy slightly before earnings, RBI policies, or budget before IV crushes.', hindi: 'बड़े इवेंट्स से पहले: बजट, पॉलिसी या अर्निंग्स से पहले खरीदें, इवेंट ख़त्म होने के बाद नहीं (IV क्रश से बचें)।' }
    ]
  },
  avoid: {
    title: 'What to Avoid (Death Traps)',
    hindiTitle: 'किन गलतियों से बचें (Death Traps)',
    points: [
      { text: 'Holding Till Expiry: Never hold OTM options till expiry hoping for a miracle. Theta will wipe out 100% of the value.', hindi: 'एक्सपायरी तक होल्ड करना: OTM ऑप्शंस को कभी भी चमत्कार की उम्मीद में एक्सपायरी तक होल्ड न करें। थीटा आपकी पूरी कैपिटल ज़ीरो कर देगा।' },
      { text: 'Buying Far OTM: "Cheap" lottery tickets usually expire worthless. Buy ATM or slightly ITM for better delta.', hindi: 'दूर के OTM खरीदना: "सस्ते" लॉटरी टिकट अक्सर ज़ीरो हो जाते हैं। बेहतर डेल्टा के लिए हमेशा ATM या ITM खरीदें।' },
      { text: 'Averaging Losers: Never average a losing options trade. Cut your losses early.', hindi: 'नुकसान को एवरेज करना: गिरते हुए ऑप्शन को कभी एवरेज न करें। अपना नुकसान जल्दी बुक करें और बाहर निकलें।' }
    ]
  },
  capital: {
    title: 'Pro Capital Allocation',
    hindiTitle: 'प्रो कैपिटल मैनेजमेंट',
    points: [
      { text: 'Max 10% Capital per Trade: Never deploy more than 10% of your total option buying capital in a single trade.', hindi: 'एक ट्रेड में मैक्स 10% कैपिटल: अपने कुल ऑप्शन बाइंग कैपिटल का 10% से ज्यादा एक ट्रेड में कभी न लगाएं।' },
      { text: 'Risk 2% per Day: Stop trading for the day if you lose 2% of your total capital.', hindi: 'दिन का 2% रिस्क: अगर आपकी कुल कैपिटल का 2% एक दिन में डूब जाए, तो उस दिन ट्रेडिंग बंद कर दें।' },
      { text: 'Pyramiding: Only add more lots to winning trades, never to losing trades.', hindi: 'पिरैमिडिंग (Pyramiding): लॉट साइज सिर्फ तब बढ़ाएं जब ट्रेड प्रॉफिट में हो, नुकसान में कभी एवरेज न करें।' }
    ]
  },
  setup: [
    { step: '1. Identify the Trend', hindiStep: '1. ट्रेंड को पहचानें', desc: 'Use Price Action, Moving Averages, or Supertrend to find a clear direction.', hindiDesc: 'प्राइस एक्शन या मूविंग एवरेज का इस्तेमाल करके मार्केट की सही दिशा पता करें।' },
    { step: '2. Check IV & PCR', hindiStep: '2. IV और PCR चेक करें', desc: 'Ensure IV is not extremely high and PCR supports your directional bias.', hindiDesc: 'चेक करें कि IV बहुत ज्यादा न हो और PCR आपके ट्रेड की दिशा को सपोर्ट कर रहा हो।' },
    { step: '3. Select Strike', hindiStep: '3. सही स्ट्राइक चुनें', desc: 'Choose ATM or ITM options. Avoid deep OTMs.', hindiDesc: 'हमेशा ATM या ITM ऑप्शंस चुनें। दूर के OTM से दूर रहें।' },
    { step: '4. Define Stop Loss', hindiStep: '4. स्टॉप-लॉस तय करें', desc: 'Set a strict SL on the chart or premium (e.g., exit at 30% loss).', hindiDesc: 'चार्ट या प्रीमियम पर एक सख्त स्टॉप-लॉस लगाएं (जैसे: 30% नुकसान पर एग्जिट)।' },
  ],
  topStrategies: [
    {
      title: 'Momentum Breakout Buying',
      hindiTitle: 'मोमेंटम ब्रेकआउट बाइंग',
      icon: '🚀',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      desc: 'Wait for a strong consolidation period. Buy ATM options exactly when price breaks out of the range with high volume.',
      hindiDesc: 'मार्केट के कंसोलिडेशन (एक रेंज में रुकने) का इंतज़ार करें। जैसे ही भारी वॉल्यूम के साथ ब्रेकआउट हो, तुरंत ATM ऑप्शन खरीदें।',
      proTip: 'Delta expands quickly and Gamma acts in your favor during strong breakouts.',
      hindiProTip: 'मजबूत ब्रेकआउट में डेल्टा तेजी से बढ़ता है और गामा (Gamma) आपके प्रॉफिट को डबल स्पीड से बढ़ाता है।'
    },
    {
      title: 'Gamma Scalping (Expiry Day)',
      hindiTitle: 'गामा स्कैल्पिंग (एक्सपायरी के दिन)',
      icon: '⚡',
      color: 'text-fuchsia-400',
      bg: 'bg-fuchsia-500/10',
      border: 'border-fuchsia-500/20',
      desc: 'Buy slightly OTM or ATM options around 1:30 PM to 2:30 PM on expiry day when a big move is expected. Hold for quick 10-15 min spikes.',
      hindiDesc: 'एक्सपायरी के दिन दोपहर 1:30 से 2:30 के बीच (जब बड़ा मूव आने वाला हो) थोड़े OTM या ATM ऑप्शंस खरीदें। सिर्फ 10-15 मिनट के स्पाइक (उछाल) के लिए होल्ड करें।',
      proTip: 'Gamma is highest on expiry. A 20-point index move can double your option premium.',
      hindiProTip: 'एक्सपायरी पर गामा सबसे ज्यादा होता है। इंडेक्स का 20 पॉइंट का मूव आपके प्रीमियम को डबल कर सकता है।'
    },
    {
      title: 'IV Crush / Earnings Play',
      hindiTitle: 'IV क्रश / अर्निंग्स प्ले',
      icon: '🔥',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      desc: 'Buy options 1-2 weeks BEFORE a major event (Earnings, Budget) when IV is low. Sell just before the event when IV spikes.',
      hindiDesc: 'किसी बड़े इवेंट (जैसे बजट या कंपनी रिजल्ट) से 1-2 हफ्ते पहले ऑप्शन खरीदें जब IV कम हो। इवेंट शुरू होने से ठीक पहले बेच दें जब IV बढ़ जाए।',
      proTip: 'Do not hold through the event! IV will crush and wipe out premium even if the direction is right.',
      hindiProTip: 'इवेंट के दौरान ऑप्शन होल्ड न करें! IV क्रश होने से प्रीमियम खत्म हो जाएगा, भले ही आपकी दिशा सही क्यों न हो।'
    },
  ]
};

const SELLER_GUIDE = {
  why: {
    title: 'Why Sell Options?',
    hindiTitle: 'ऑप्शन क्यों बेचें (Sell)?',
    points: [
      { text: 'Theta is Your Friend: You make money every single day just from time decay, even if the market goes nowhere.', hindi: 'थीटा आपका दोस्त है: मार्केट अगर कहीं न जाए (फ्लैट रहे), तब भी आप हर दिन टाइम डिकेय से पैसा कमाते हैं।' },
      { text: 'High Probability: Option sellers win ~70-80% of the time because they have a wider margin of error.', hindi: 'हाई प्रोबेबिलिटी (High Probability): ऑप्शन सेलर के जीतने के चांस 70-80% होते हैं क्योंकि उनके पास गलती की गुंजाइश ज्यादा होती है।' },
      { text: 'IV Crush Advantage: Sellers profit massively when high Implied Volatility suddenly drops after big events.', hindi: 'IV क्रश का फायदा: बड़े इवेंट्स के बाद जब IV अचानक गिरता है, तो सेलर को बहुत बड़ा प्रॉफिट होता है।' }
    ]
  },
  risks: {
    title: 'Seller Risks & Margin',
    hindiTitle: 'सेलर के रिस्क और मार्जिन',
    points: [
      { text: 'Unlimited Risk: A naked short option has theoretically unlimited loss if the market gaps wildly against you.', hindi: 'अनलिमिटेड रिस्क: अगर आप बिना हेज किए (Naked) ऑप्शन बेचते हैं और मार्केट अचानक उल्टा भाग जाए, तो नुकसान की कोई लिमिट नहीं होती।' },
      { text: 'High Capital Required: Selling requires margin. One lot of Nifty requires approx ₹1 Lakh in margin.', hindi: 'ज्यादा कैपिटल: ऑप्शन बेचने के लिए मार्जिन चाहिए होता है। निफ्टी के 1 लॉट के लिए करीब ₹1 लाख की जरुरत पड़ती है।' },
      { text: 'Black Swan Events: A 5% overnight gap against your position can wipe out months of small gains.', hindi: 'ब्लैक स्वान इवेंट (Black Swan): रात भर में 5% का उल्टा गैप आपके महीनों के छोटे-छोटे प्रॉफिट को एक दिन में ख़त्म कर सकता है।' }
    ]
  },
  setup: [
    { step: '1. Sell OTM Strikes', hindiStep: '1. OTM स्ट्राइक बेचें', desc: 'Find strong Support/Resistance levels and sell options outside those boundaries.', hindiDesc: 'मजबूत सपोर्ट/रेजिस्टेंस ढूंढें और उसके बाहर के (OTM) ऑप्शंस बेचें।' },
    { step: '2. Always Hedge', hindiStep: '2. हमेशा हेज करें', desc: 'Convert Naked shorts into Spreads (e.g., Bull Put Spread) to cap max loss.', hindiDesc: 'नेकेड सेलिंग न करें, हमेशा स्प्रेड्स (जैसे Bull Put Spread) बनाकर अपने नुकसान को लॉक करें।' },
    { step: '3. IV Rank > 50', hindiStep: '3. IV रैंक > 50', desc: 'Only sell when premiums are expensive (High IV). Do not sell in a dead market.', hindiDesc: 'सिर्फ तब बेचें जब प्रीमियम महंगे हों (High IV)। मरे हुए (Low IV) मार्केट में कभी न बेचें।' },
    { step: '4. Exit at 50% Profit', hindiStep: '4. 50% प्रॉफिट पर एग्जिट', desc: 'Don\'t wait for expiry to collect the last few pennies. Close the trade at 50% max profit.', hindiDesc: 'आखिरी कुछ रुपयों के लिए एक्सपायरी का इंतज़ार न करें। मैक्स प्रॉफिट का 50% मिलते ही ट्रेड क्लोज करें।' },
  ],
  topStrategies: [
    {
      title: 'Iron Condor (Range Bound)',
      hindiTitle: 'आयरन कोंडोर (रेंज-बाउंड)',
      icon: '🦅',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      desc: 'Sell an OTM Call Spread and an OTM Put Spread simultaneously. Best for markets stuck in a wide range.',
      hindiDesc: 'एक साथ OTM कॉल स्प्रेड और OTM पुट स्प्रेड बेचें। यह तब सबसे अच्छा है जब मार्केट एक बड़ी रेंज में फंसा हो।',
      proTip: 'Collect theta safely. Max loss is strictly capped by the long wings.',
      hindiProTip: 'सुरक्षित तरीके से थीटा कमाएं। लॉन्ग लेग्स (Wings) की वजह से इसमें मैक्स लॉस फिक्स होता है।'
    },
    {
      title: 'Covered Call (Holding Stocks)',
      hindiTitle: 'कवर्ड कॉल (स्टॉक होल्डिंग पर)',
      icon: '🏦',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      desc: 'If you hold 1 lot of shares, sell OTM calls every month against it to generate "rental" income.',
      hindiDesc: 'अगर आपके पास स्टॉक्स की डिलीवरी है, तो हर महीने उसके खिलाफ OTM कॉल बेचकर "किराए" (Rental Income) की तरह पैसा कमाएं।',
      proTip: 'Lowers your overall purchase price of the stock over time.',
      hindiProTip: 'लंबे समय में यह आपके स्टॉक्स की खरीद कीमत (Purchase Price) को कम कर देता है।'
    },
    {
      title: 'Credit Spreads (Directional)',
      hindiTitle: 'क्रेडिट स्प्रेड्स (डायरेक्शनल)',
      icon: '🛡️',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      desc: 'Bullish? Sell a Put Spread. Bearish? Sell a Call Spread. High probability trades with defined risk.',
      hindiDesc: 'बुलिश हैं? पुट स्प्रेड बेचें। बेयरिश हैं? कॉल स्प्रेड बेचें। यह फिक्स्ड रिस्क के साथ हाई प्रोबेबिलिटी ट्रेड है।',
      proTip: 'Requires 3x less margin than naked selling and gives you peace of mind overnight.',
      hindiProTip: 'नेकेड सेलिंग के मुकाबले इसमें 3 गुना कम मार्जिन लगता है और रात भर टेंशन नहीं होती।'
    },
  ]
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const typeConfig = {
  bullish:  { color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'BULLISH',  icon: TrendingUp },
  bearish:  { color: '#f87171', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'BEARISH',  icon: TrendingDown },
  neutral:  { color: '#60a5fa', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'NEUTRAL',  icon: Target },
  volatile: { color: '#c084fc', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'VOLATILE', icon: Zap },
};

const StrategyCardComp: React.FC<{ s: StrategyCard }> = ({ s }) => {
  const [open, setOpen] = useState(false);
  const cfg = typeConfig[s.type];
  const Icon = cfg.icon;
  
  return (
    <div
      className={`rounded-xl border backdrop-blur-sm transition-all duration-200 cursor-pointer ${cfg.border} bg-[#0c121e]/90 hover:border-slate-700 overflow-hidden relative p-3 sm:p-3.5 shadow-sm`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10" style={{ background: `${cfg.color}18` }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight truncate hover:text-white transition-colors">{s.name}</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0" style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
              <span className="truncate">{s.legs.join(' + ')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <svg width="34" height="22" viewBox="0 0 40 35" className="opacity-70 transition-all shrink-0" style={{ color: cfg.color }}>
            {s.payoffSvg}
          </svg>
          <span className="text-xs text-slate-500 transition-transform">
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-slate-800/80' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden space-y-3">
          {/* Legs */}
          <div className="flex flex-wrap gap-1.5">
            {s.legs.map((leg, i) => (
              <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: leg.includes('BUY') ? '#22c55e' : leg.includes('SELL') ? '#f87171' : '#60a5fa' }} />
                {leg}
              </span>
            ))}
            <span className="text-[10px] text-slate-400 font-bold bg-black/30 px-2 py-0.5 rounded border border-white/5 ml-auto flex items-center gap-1">
              <span className="text-amber-400">{'★'.repeat(s.complexity)}</span>
              <span className="text-slate-600">{'★'.repeat(3 - s.complexity)}</span> 
              <span>Level {s.complexity}/3</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#111928]/80 rounded-lg p-2.5 border border-slate-800/80">
              <div className="text-slate-500 mb-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3"/> When to Use</div>
              <div className="text-slate-300 font-medium leading-relaxed">{s.when}</div>
            </div>
            <div className="bg-[#111928]/80 rounded-lg p-2.5 border border-slate-800/80">
              <div className="text-slate-500 mb-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3"/> Ideal IV</div>
              <div className="text-slate-300 font-medium leading-relaxed">{s.idealIV}</div>
            </div>
            <div className="bg-emerald-950/20 rounded-lg p-2.5 border border-emerald-900/40">
              <div className="text-emerald-400 mb-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Max Profit</div>
              <div className="text-emerald-300 font-bold">{s.maxProfit}</div>
            </div>
            <div className="bg-rose-950/20 rounded-lg p-2.5 border border-rose-900/40">
              <div className="text-rose-400 mb-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Max Loss</div>
              <div className="text-rose-300 font-bold">{s.maxLoss}</div>
            </div>
          </div>

          <div className="bg-[#111928]/60 rounded-lg p-2.5 border border-slate-800/80 text-[11px]">
            <div className="text-slate-500 mb-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><BookOpen className="w-3 h-3"/> Setup Explanation</div>
            <div className="text-slate-300 font-medium leading-relaxed">{s.setup}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const OptionsHint: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategies' | 'pcr' | 'iv' | 'strikes' | 'hedging' | 'theta' | 'greeks' | 'buyer' | 'seller'>('strategies');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'strategies', label: 'Strategies', icon: Target },
    { id: 'buyer',      label: 'Buyer Guide', icon: Crosshair },
    { id: 'seller',     label: 'Seller Guide', icon: BarChart2 },
    { id: 'greeks',     label: 'Greeks',     icon: Activity },
    { id: 'pcr',        label: 'PCR Guide',  icon: Activity },
    { id: 'iv',         label: 'IV Guide',   icon: Flame },
    { id: 'strikes',    label: 'Strikes',    icon: Shield },
    { id: 'hedging',    label: 'Hedging',    icon: AlertTriangle },
    { id: 'theta',      label: 'Theta Decay', icon: Clock },
  ] as const;

  const filteredStrategies = useMemo(() => {
    if (!searchQuery.trim()) return STRATEGIES;
    const q = searchQuery.toLowerCase();
    return STRATEGIES.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      s.when.toLowerCase().includes(q) ||
      s.setup.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-300 p-3 sm:p-5 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* ── Compact Executive Header (Subtle, Human, Pro Trading Manual) ── */}
        <div className="rounded-xl bg-[#0c121e] border border-slate-800/90 p-4 sm:p-4.5 shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold tracking-wider text-sky-400 uppercase bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  NSE F&O Field Manual
                </span>
                <span className="text-[10px] text-slate-500 font-medium">9:15 - 15:30 IST Rules</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <span>Options Masterclass</span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5 max-w-xl font-medium">
                {lang === 'en' 
                  ? 'Real-world rules on strategies, buyer setups, seller edges, Greeks & PCR discipline.'
                  : 'ऑप्शन ट्रेडिंग के प्रैक्टिकल नियम: स्ट्रैटेजीज, बायर/सेलर सेटअप्स, ग्रीक्स और PCR अनुशासन।'}
              </p>
            </div>

            {/* Header Controls: Language Toggle & Search */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter playbook..."
                  className="w-full bg-[#101726] border border-slate-800 text-xs text-white rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-sky-500 placeholder-slate-500 font-medium"
                />
              </div>

              {/* Language Switcher */}
              <div className="inline-flex p-0.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${lang === 'en' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('hi')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${lang === 'hi' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  हिंदी
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Compact Tab Navigation ── */}
        <div className="flex overflow-x-auto pb-1 custom-scrollbar hide-scroll-indicator">
          <div className="inline-flex p-1 bg-[#0c121e] border border-slate-800/90 rounded-xl shadow-sm gap-1">
            {tabs.map(t => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content Container ── */}
        <div className="relative z-10 space-y-4">
          
          {/* ── 1. Buyer Guide Tab ── */}
          {activeTab === 'buyer' && (
            <div className="space-y-3.5">
              <div className="bg-[#0c121e] border border-sky-500/20 rounded-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3 relative overflow-hidden">
                <div className="shrink-0 w-8 h-8 bg-sky-500/10 border border-sky-500/25 rounded-lg flex items-center justify-center text-sky-400">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Professional Options Buyer Playbook</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                    {lang === 'en' ? (
                      <>Option buying requires <strong className="text-sky-300">speed, momentum, and strict capital limits</strong>. Theta decay is always working against you, so you must trade with defined breakout volume.</>
                    ) : (
                      <>ऑप्शन बाइंग के लिए <strong className="text-sky-300">स्पीड, मोमेंटम और सख्त कैपिटल लिमिट</strong> जरूरी है। टाइम डिकेय (Theta) हमेशा आपके खिलाफ रहता है, इसलिए केवल वॉल्यूम ब्रेकआउट पर ही ट्रेड करें।</>
                    )}
                  </p>
                </div>
              </div>

              {/* 4 Core Pillars (Compact Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Why Buy */}
                <div className="bg-[#0c121e]/90 border border-emerald-500/20 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-emerald-400">{lang === 'en' ? BUYER_GUIDE.why.title : BUYER_GUIDE.why.hindiTitle}</h4>
                  </div>
                  <div className="space-y-2">
                    {BUYER_GUIDE.why.points.map((p, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <p className="leading-snug">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* When to Buy */}
                <div className="bg-[#0c121e]/90 border border-sky-500/20 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-sky-400">{lang === 'en' ? BUYER_GUIDE.when.title : BUYER_GUIDE.when.hindiTitle}</h4>
                  </div>
                  <div className="space-y-2">
                    {BUYER_GUIDE.when.points.map((p, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-300">
                        <span className="text-sky-400 font-bold">⚡</span>
                        <p className="leading-snug">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capital Allocation */}
                <div className="bg-[#0c121e]/90 border border-purple-500/20 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-purple-400">{lang === 'en' ? BUYER_GUIDE.capital.title : BUYER_GUIDE.capital.hindiTitle}</h4>
                  </div>
                  <div className="space-y-2">
                    {BUYER_GUIDE.capital.points.map((p, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-300">
                        <span className="text-purple-400 font-bold">🛡️</span>
                        <p className="leading-snug">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What to Avoid */}
                <div className="bg-[#0c121e]/90 border border-rose-500/20 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-rose-400">{lang === 'en' ? BUYER_GUIDE.avoid.title : BUYER_GUIDE.avoid.hindiTitle}</h4>
                  </div>
                  <div className="space-y-2">
                    {BUYER_GUIDE.avoid.points.map((p, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-300">
                        <span className="text-rose-400 font-bold">✕</span>
                        <p className="leading-snug">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* The Setup Workflow */}
              <div className="bg-[#0c121e] border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {lang === 'en' ? 'The Professional Execution Checklist' : 'प्रोफेशनल एक्ज़ीक्यूशन चेकलिस्ट'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {BUYER_GUIDE.setup.map((s, i) => (
                    <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-2.5">
                      <div className="text-xs font-bold text-indigo-400 mb-1">{lang === 'en' ? s.step : s.hindiStep}</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{lang === 'en' ? s.desc : s.hindiDesc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Strategies */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>{lang === 'en' ? 'High-Probability Buyer Setups' : 'हाई-प्रोबेबिलिटी बायर सेटअप्स'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {BUYER_GUIDE.topStrategies.map((s, i) => (
                    <div key={i} className={`bg-[#0c121e]/90 border ${s.border} rounded-xl p-3.5 shadow-sm space-y-2.5`}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{s.icon}</span>
                        <h5 className={`text-xs font-bold ${s.color}`}>
                          {lang === 'en' ? s.title : s.hindiTitle}
                        </h5>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {lang === 'en' ? s.desc : s.hindiDesc}
                      </p>
                      <div className="bg-black/30 rounded-lg p-2 border border-white/5 text-[11px]">
                        <span className={`font-bold ${s.color} mr-1.5`}>Pro Tip:</span>
                        <span className="text-slate-300">{lang === 'en' ? s.proTip : s.hindiProTip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 2. Option Seller Tab ── */}
          {activeTab === 'seller' && (
            <div className="space-y-3.5">
              <div className="bg-[#0c121e] border border-amber-500/20 rounded-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3 relative overflow-hidden">
                <div className="shrink-0 w-8 h-8 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-center justify-center text-amber-400">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Professional Options Seller Playbook</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                    {lang === 'en' ? (
                      <>Option selling operates like an <strong className="text-amber-300">insurance business</strong>. You harvest premium from buyers and rely on probability, statistical theta decay, and defined risk spreads.</>
                    ) : (
                      <>ऑप्शन सेलिंग एक <strong className="text-amber-300">इन्शुरन्स बिजनेस</strong> की तरह काम करती है। आप बायर्स से प्रीमियम इकट्ठा करते हैं और प्रोबेबिलिटी, टाइम डिकेय (Theta) और हेज्ड स्प्रेड्स से प्रॉफिट कमाते हैं।</>
                    )}
                  </p>
                </div>
              </div>

              {/* 2 Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0c121e]/90 border border-emerald-500/20 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-emerald-400">{lang === 'en' ? SELLER_GUIDE.why.title : SELLER_GUIDE.why.hindiTitle}</h4>
                  </div>
                  <div className="space-y-2">
                    {SELLER_GUIDE.why.points.map((p, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <p className="leading-snug">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0c121e]/90 border border-rose-500/20 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-rose-400">{lang === 'en' ? SELLER_GUIDE.risks.title : SELLER_GUIDE.risks.hindiTitle}</h4>
                  </div>
                  <div className="space-y-2">
                    {SELLER_GUIDE.risks.points.map((p, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-300">
                        <span className="text-rose-400 font-bold">⚠</span>
                        <p className="leading-snug">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="bg-[#0c121e] border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {lang === 'en' ? 'The 4 Golden Rules for Option Sellers' : 'ऑप्शन सेलर के 4 गोल्डन नियम'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {SELLER_GUIDE.setup.map((s, i) => (
                    <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-2.5">
                      <div className="text-xs font-bold text-amber-400 mb-1">{lang === 'en' ? s.step : s.hindiStep}</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{lang === 'en' ? s.desc : s.hindiDesc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Seller Strategies */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'en' ? 'Core Seller Frameworks' : 'मुख्य सेलर फ्रेमवर्क्स'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SELLER_GUIDE.topStrategies.map((s, i) => (
                    <div key={i} className={`bg-[#0c121e]/90 border ${s.border} rounded-xl p-3.5 shadow-sm space-y-2.5`}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{s.icon}</span>
                        <h5 className={`text-xs font-bold ${s.color}`}>
                          {lang === 'en' ? s.title : s.hindiTitle}
                        </h5>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {lang === 'en' ? s.desc : s.hindiDesc}
                      </p>
                      <div className="bg-black/30 rounded-lg p-2 border border-white/5 text-[11px]">
                        <span className={`font-bold ${s.color} mr-1.5`}>Pro Tip:</span>
                        <span className="text-slate-300">{lang === 'en' ? s.proTip : s.hindiProTip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Strategies Tab ── */}
          {activeTab === 'strategies' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Click any strategy card to view payoff legs, ideal IV, and risk boundaries.</span>
                <span>{filteredStrategies.length} setups available</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredStrategies.map(s => <StrategyCardComp key={s.name} s={s} />)}
              </div>
            </div>
          )}

          {/* ── 4. Greeks Tab ── */}
          {activeTab === 'greeks' && (
            <div className="space-y-3.5">
              <div className="bg-[#0c121e] border border-indigo-500/20 rounded-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-indigo-500/10 border border-indigo-500/25 rounded-lg flex items-center justify-center text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Option Greeks Dashboard</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                    {lang === 'en' 
                      ? 'Greeks measure mathematical risk and price sensitivity to underlying moves, time decay, and volatility changes.'
                      : 'ग्रीक्स किसी भी ऑप्शन के रिस्क और सेंसिटिविटी (प्राइस, टाइम, वोलैटिलिटी) को नापने के फॉर्मूले हैं।'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {GREEKS_DATA.map((greek, i) => (
                  <div key={i} className={`bg-[#0c121e]/90 border ${greek.border} rounded-xl p-3.5 shadow-sm space-y-2.5 flex flex-col`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{greek.icon}</span>
                      <h4 className={`text-sm font-bold ${greek.color}`}>
                        {lang === 'en' ? greek.name : greek.hindiName}
                      </h4>
                    </div>

                    <div className="bg-black/25 rounded-lg p-2.5 border border-white/5 text-xs text-slate-300 leading-snug">
                      {lang === 'en' ? greek.definition : greek.hindiDefinition}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-emerald-950/20 rounded p-2 border border-emerald-500/10">
                        <div className="text-emerald-400 font-bold mb-0.5">Call:</div>
                        <div className="text-slate-300 font-medium">{greek.call}</div>
                      </div>
                      <div className="bg-rose-950/20 rounded p-2 border border-rose-500/10">
                        <div className="text-rose-400 font-bold mb-0.5">Put:</div>
                        <div className="text-slate-300 font-medium">{greek.put}</div>
                      </div>
                    </div>

                    <div className="bg-indigo-950/20 rounded-lg p-2 border border-indigo-500/20 text-[11px] text-slate-300 mt-auto">
                      <span className="text-indigo-400 font-bold mr-1">Insight:</span>
                      {lang === 'en' ? greek.insight : greek.hindiInsight}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. PCR Tab ── */}
          {activeTab === 'pcr' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-[#0c121e] border border-blue-500/20 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Put-Call Ratio (PCR)</h3>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-blue-300 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">PCR = Total Put OI / Total Call OI</strong><br /><br />
                    PCR acts as a contrarian sentiment indicator. Extreme low readings signal panic call writing, while extreme high readings signal put heavy positioning.
                  </p>

                  {/* Compact PCR Gauge */}
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Sentiment Spectrum</span>
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="h-2 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-3.5 bg-white rounded shadow border border-slate-300" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 px-0.5">
                      <span>0.5 (Top)</span>
                      <span>1.0 (Neutral)</span>
                      <span>1.5 (Bottom)</span>
                    </div>
                  </div>

                  <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Trading Rule</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">Never trade PCR in isolation. Always combine with support/resistance and price action breakout.</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-8">
                <div className="bg-[#0c121e] border border-slate-800/90 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    <span>PCR Interpretation Zones</span>
                  </h4>
                  <div className="space-y-2">
                    {PCR_ZONES.map((z, i) => (
                      <div key={i} className="rounded-lg p-2.5 bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="w-24 shrink-0 font-mono text-sm font-black" style={{ color: z.color }}>
                          {z.range}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1" style={{ color: z.color, borderColor: `${z.color}30`, background: `${z.color}15` }}>
                            {z.label}
                          </span>
                          <p className="text-slate-300 text-xs leading-snug">{z.hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 6. IV Tab ── */}
          {activeTab === 'iv' && (
            <div className="space-y-3.5">
              <div className="bg-[#0c121e] border border-orange-500/20 rounded-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-orange-500/10 border border-orange-500/25 rounded-lg flex items-center justify-center text-orange-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Implied Volatility (IV) Mechanics</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                    IV dictates option pricing. <strong className="text-orange-300">High IV = Inflated Premiums</strong> (Favorable for Sellers). <strong className="text-sky-300">Low IV = Inexpensive Premiums</strong> (Favorable for Buyers). The cardinal rule: <strong className="text-white">Buy Low IV, Sell High IV.</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {IV_TIPS.map((tip, i) => (
                  <div key={i} className={`bg-[#0c121e]/90 border ${tip.border} rounded-xl p-3.5 shadow-sm space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${tip.text}`}>{tip.label}</span>
                      <span className="text-lg">{tip.icon}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-200 bg-white/5 px-2 py-1 rounded border border-white/10">
                      {tip.action}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{tip.reason}</p>
                    <div className="bg-black/30 rounded-lg p-2 border border-white/5 text-[11px]">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Ideal Setups:</div>
                      <div className={`font-medium ${tip.text}`}>{tip.strategies}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. Strikes Tab ── */}
          {activeTab === 'strikes' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STRIKE_GUIDE.map((g, i) => (
                  <div key={i} className={`bg-[#0c121e]/90 border ${g.border} rounded-xl p-3.5 shadow-sm space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${g.bg} text-black`}>{g.tag}</span>
                        <h4 className="text-sm font-bold text-white mt-1">{g.full}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">{g.premium}</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                        <span>Delta Exposure</span>
                        <span className={g.color}>{g.deltaText}</span>
                      </div>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${g.bg} rounded-full`} style={{ width: `${g.delta}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-black/30 p-2 rounded border border-white/5">
                        <span className="text-slate-500 text-[9px] block uppercase">Call</span>
                        <span className="text-white font-mono font-bold">{g.call}</span>
                      </div>
                      <div className="bg-black/30 p-2 rounded border border-white/5">
                        <span className="text-slate-500 text-[9px] block uppercase">Put</span>
                        <span className="text-white font-mono font-bold">{g.put}</span>
                      </div>
                    </div>

                    <div className="bg-black/20 p-2 rounded border border-white/5 text-xs text-slate-300">
                      <span className="text-slate-500 text-[9px] uppercase block mb-0.5">Best Used For:</span>
                      {g.use}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-[#0c121e] border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
                <span className="text-base shrink-0">💡</span>
                <div>
                  <strong className="text-blue-300">Pro Tip for Indian Index Options:</strong> For intraday momentum in Nifty/BankNifty, always trade <strong className="text-white">ATM options</strong> for highest gamma and tightest bid-ask spreads. Avoid far OTMs as theta kills 90% of their value by expiry day.
                </div>
              </div>
            </div>
          )}

          {/* ── 8. Hedging Tab ── */}
          {activeTab === 'hedging' && (
            <div className="space-y-3.5">
              <div className="bg-[#0c121e] border border-emerald-500/20 rounded-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-emerald-500/10 border border-emerald-500/25 rounded-lg flex items-center justify-center text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Professional Hedging Framework</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                    {lang === 'en' 
                      ? 'Hedging is risk control, not pessimism. It preserves trading capital and softens event shocks.'
                      : 'हेजिंग का उद्देश्य नुकसान को कंट्रोल करना और बड़े इवेंट्स के झटके से कैपिटल को बचाना है।'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {(lang === 'en' ? HEDGING_MODELS : HEDGING_MODELS_HI).slice(0, 6).map((model, i) => (
                  <div key={i} className={`bg-[#0c121e]/90 border ${model.border} rounded-xl p-3.5 shadow-sm space-y-2.5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-sm font-bold ${model.color}`}>{model.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{model.subtitle}</div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {model.badge}
                      </span>
                    </div>

                    <div className="bg-black/25 rounded-lg p-2 border border-white/5 text-xs text-slate-200">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Structure:</span>
                      {model.setup}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-emerald-950/20 rounded p-2 border border-emerald-500/10">
                        <span className="text-emerald-400 font-bold block text-[9px] uppercase">Strength</span>
                        <span className="text-slate-300">{model.strength}</span>
                      </div>
                      <div className="bg-rose-950/20 rounded p-2 border border-rose-500/10">
                        <span className="text-rose-400 font-bold block text-[9px] uppercase">Weakness</span>
                        <span className="text-slate-300">{model.weakness}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 9. Theta Tab ── */}
          {activeTab === 'theta' && (
            <div className="space-y-3.5">
              <div className="bg-[#0c121e] border border-purple-500/20 rounded-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-purple-500/10 border border-purple-500/25 rounded-lg flex items-center justify-center text-purple-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Theta (Time Decay) Mechanics</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                    Theta measures daily extrinsic premium erosion. Decay is exponential—slow between 90–30 DTE, accelerating rapidly under 14 DTE, and collapsing in the final 3 days.
                  </p>
                </div>
              </div>

              {/* Compact Decay Curve */}
              <div className="bg-[#0c121e] border border-slate-800/90 rounded-xl p-3.5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Non-Linear Decay Curve</span>
                  <span className="text-[10px] text-rose-400 font-mono">Collapse Zone: &lt; 7 Days</span>
                </div>
                <div className="h-32 w-full relative flex items-end">
                  <svg className="w-full h-full pb-6 pl-6 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path 
                      d="M 0,10 Q 45,15 75,45 T 100,95" 
                      fill="none" 
                      stroke="#f43f5e" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                    <circle cx="0" cy="10" r="2" fill="#8b5cf6" />
                    <circle cx="50" cy="18" r="2" fill="#a855f7" />
                    <circle cx="75" cy="45" r="2.5" fill="#f43f5e" />
                    <circle cx="100" cy="95" r="3" fill="#e11d48" />
                  </svg>
                  <div className="absolute bottom-0 left-6 right-0 flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                    <span>90 DTE (Slow)</span>
                    <span>45 DTE</span>
                    <span>15 DTE</span>
                    <span className="text-rose-400 font-bold">0 DTE (Death Zone)</span>
                  </div>
                </div>
              </div>

              {/* 4 Practical Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: '📉', title: "Buyer's Rule", color: 'text-rose-400', desc: 'If price stays flat, buyers lose premium every single day. Never hold OTM calls hoping for miracles.' },
                  { icon: '📈', title: "Seller's Rule", color: 'text-emerald-400', desc: 'Sellers capture theta decay in range-bound markets. Aim to exit at 50% max profit to avoid late gamma spikes.' },
                  { icon: '⚡', title: 'Expiry Day Caution', color: 'text-amber-400', desc: 'On Tuesday/Thursday expiries after 1:30 PM, OTM options can lose 80% value in minutes. Cut losses fast.' },
                  { icon: '⚖️', title: 'Theta vs Delta', color: 'text-blue-400', desc: 'Buyers need rapid Delta movement to outrun Theta loss. If momentum slows, exit the trade.' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0c121e]/90 rounded-xl border border-slate-800/80 p-3 shadow-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <h4 className={`text-xs font-bold ${item.color}`}>{item.title}</h4>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Genuine Trader's Notebook (Human Touch Bottom Bar) ── */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0a0e17] p-3 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-300">
              <strong className="text-white">Dalal Street Discipline:</strong> Never risk more than 2% of total capital on a single option trade. Always use limit orders during high volatility.
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 shrink-0">Updated for NSE/BSE F&O</span>
        </div>

      </div>
    </div>
  );
};

export default OptionsHint;
