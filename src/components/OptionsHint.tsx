import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Zap, Target, Clock, Shield, AlertTriangle, Activity, Sparkles, BookOpen, ArrowRight, Flame, Crosshair, BarChart2 } from 'lucide-react';

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
  bullish:  { color: '#22c55e', gradient: 'from-emerald-500/10 to-emerald-900/5', border: 'border-emerald-500/30', label: 'BULLISH',  icon: TrendingUp, glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
  bearish:  { color: '#f87171', gradient: 'from-rose-500/10 to-rose-900/5', border: 'border-rose-500/30', label: 'BEARISH',  icon: TrendingDown, glow: 'drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' },
  neutral:  { color: '#60a5fa', gradient: 'from-blue-500/10 to-blue-900/5', border: 'border-blue-500/30', label: 'NEUTRAL',  icon: Target, glow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' },
  volatile: { color: '#c084fc', gradient: 'from-purple-500/10 to-purple-900/5', border: 'border-purple-500/30', label: 'VOLATILE', icon: Zap, glow: 'drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' },
};

const StrategyCardComp: React.FC<{ s: StrategyCard }> = ({ s }) => {
  const [open, setOpen] = useState(false);
  const cfg = typeConfig[s.type];
  const Icon = cfg.icon;
  
  return (
    <div
      className={`rounded-3xl border backdrop-blur-xl transition-all duration-500 cursor-pointer group bg-gradient-to-br ${cfg.gradient} ${cfg.border} overflow-hidden hover:scale-[1.02] hover:-translate-y-1 relative`}
      style={{ boxShadow: open ? `0 12px 40px ${cfg.color}20` : `0 4px 20px rgba(0,0,0,0.2)` }}
      onClick={() => setOpen(!open)}
    >
      {/* Background Glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-700`} style={{ background: cfg.color }} />
      
      <div className="p-6 flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-5 w-full">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-12 shadow-xl border border-white/5" style={{ background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}10)` }}>
            <Icon className="w-7 h-7" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="font-black text-slate-100 text-lg tracking-wide group-hover:text-white transition-colors truncate">{s.name}</div>
              <svg width="48" height="40" viewBox="0 0 40 35" className={`opacity-60 group-hover:opacity-100 transition-all duration-500 ${cfg.glow} group-hover:scale-110`} style={{ color: cfg.color }}>
                {s.payoffSvg}
              </svg>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-inner" style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
              <span className="text-xs text-slate-400 font-bold bg-black/20 px-3 py-1 rounded-lg border border-white/5 shadow-inner">
                <span className="text-amber-400">{'★'.repeat(s.complexity)}</span>
                <span className="text-slate-600">{'★'.repeat(3 - s.complexity)}</span> 
                <span className="ml-1.5 opacity-80">Complexity</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5 bg-black/20">
            
            {/* Legs */}
            <div className="flex flex-wrap gap-2.5">
              {s.legs.map((leg, i) => (
                <span key={i} className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 shadow-md flex items-center gap-2 hover:bg-white/10 transition-colors">
                  <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: leg.includes('BUY') ? '#22c55e' : leg.includes('SELL') ? '#f87171' : '#60a5fa', color: leg.includes('BUY') ? '#22c55e' : leg.includes('SELL') ? '#f87171' : '#60a5fa' }} />
                  {leg}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                <div className="text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> When to Use</div>
                <div className="text-slate-300 font-bold leading-relaxed">{s.when}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                <div className="text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Ideal IV</div>
                <div className="text-slate-300 font-bold leading-relaxed">{s.idealIV}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/20 rounded-2xl p-4 border border-emerald-900/50 relative overflow-hidden group/profit shadow-lg">
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/profit:opacity-100 transition-opacity duration-500" />
                <div className="text-emerald-500/80 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Max Profit</div>
                <div className="text-emerald-400 font-black text-sm relative z-10">{s.maxProfit}</div>
              </div>
              <div className="bg-gradient-to-br from-rose-950/60 to-rose-900/20 rounded-2xl p-4 border border-rose-900/50 relative overflow-hidden group/loss shadow-lg">
                <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover/loss:opacity-100 transition-opacity duration-500" />
                <div className="text-rose-500/80 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5"/> Max Loss</div>
                <div className="text-rose-400 font-black text-sm relative z-10">{s.maxLoss}</div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5 text-xs shadow-inner">
              <div className="text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Setup Explanation</div>
              <div className="text-slate-300 font-bold leading-relaxed">{s.setup}</div>
            </div>
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

  const tabs = [
    { id: 'strategies', label: 'Strategies', icon: Target },
    { id: 'buyer',      label: 'Option Buyer',icon: Crosshair },
    { id: 'seller',     label: 'Option Seller',icon: BarChart2 },
    { id: 'greeks',     label: 'Greeks',     icon: Activity },
    { id: 'pcr',        label: 'PCR Guide',  icon: Activity },
    { id: 'iv',         label: 'IV Guide',   icon: Flame },
    { id: 'strikes',    label: 'Strikes',    icon: Shield },
    { id: 'hedging',    label: 'Hedging',    icon: AlertTriangle },
    { id: 'theta',      label: 'Theta',      icon: Clock },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-300 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Enhanced Hero Section ── */}
        <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#131b2c] to-[#0f1522] border border-[#1e293b] shadow-2xl">
          {/* Abstract glowing orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[80px] transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px]" />
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          </div>

          <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-[11px] font-black tracking-widest text-violet-300 uppercase">Pro Options Suite</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-3">
                Options Masterclass
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
                Elevate your trading with our definitive guide to options strategies, PCR interpretation, IV crush avoidance, and mastering theta decay.
              </p>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-2 p-5 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <Shield className="w-4 h-4" /> Suitable for NSE F&O
              </div>
              <div className="text-xs text-slate-500 font-medium">Educational & Analytical Use Only</div>
            </div>
          </div>
        </div>

        {/* ── Modern Tab Navigation ── */}
        <div className="flex justify-start sm:justify-center overflow-x-auto pb-2 custom-scrollbar hide-scroll-indicator">
          <div className="inline-flex p-1.5 bg-[#131b2c]/80 backdrop-blur-xl border border-[#1e293b] rounded-2xl shadow-xl gap-1">
            {tabs.map(t => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out overflow-hidden group ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-90" />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="relative z-10 tracking-wide">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content Container ── */}
        <div className="relative z-10 animate-fade-in-up">
          
          {/* ── Buyer Guide Tab ── */}
          {activeTab === 'buyer' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-sky-900/20 via-[#131b2c] to-emerald-900/20 border border-sky-500/20 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-emerald-500/5 opacity-60" />
                <div className="relative z-10 shrink-0 w-16 h-16 bg-gradient-to-br from-sky-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.25)]">
                  <Crosshair className="w-8 h-8 text-white" />
                </div>
                <div className="relative z-10 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h3 className="text-2xl md:text-3xl font-black text-white">Professional Options Buyer Guide</h3>
                    
                    {/* Language Toggle */}
                    <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md">
                      <button
                        onClick={() => setLang('en')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'en' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setLang('hi')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'hi' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        हिंदी (Hindi)
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl mt-2">
                    {lang === 'en' ? (
                      <>Being an option buyer requires <strong className="text-sky-300">precision, speed, and strict risk management</strong>. Time (Theta) is always working against you, so you must trade with momentum.</>
                    ) : (
                      <>एक ऑप्शन बायर होने के नाते आपको <strong className="text-sky-300">सटीकता, स्पीड और सख्त रिस्क मैनेजमेंट</strong> की जरुरत होती है। समय (Theta) हमेशा आपके खिलाफ काम करता है, इसलिए आपको मोमेंटम के साथ ट्रेड करना चाहिए।</>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Why Buy */}
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-black text-emerald-400">{lang === 'en' ? BUYER_GUIDE.why.title : BUYER_GUIDE.why.hindiTitle}</h4>
                  </div>
                  <div className="space-y-4">
                    {BUYER_GUIDE.why.points.map((p, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                        <p className="leading-relaxed font-medium">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* When to Buy */}
                <div className="bg-sky-950/20 border border-sky-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-500 to-blue-400 opacity-80" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-black text-sky-400">{lang === 'en' ? BUYER_GUIDE.when.title : BUYER_GUIDE.when.hindiTitle}</h4>
                  </div>
                  <div className="space-y-4">
                    {BUYER_GUIDE.when.points.map((p, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-sky-400 font-bold mt-0.5">⚡</span>
                        <p className="leading-relaxed font-medium">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capital Allocation */}
                <div className="bg-fuchsia-950/20 border border-fuchsia-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-400 opacity-80" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 text-fuchsia-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-black text-fuchsia-400">{lang === 'en' ? BUYER_GUIDE.capital.title : BUYER_GUIDE.capital.hindiTitle}</h4>
                  </div>
                  <div className="space-y-4">
                    {BUYER_GUIDE.capital.points.map((p, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-fuchsia-400 font-bold mt-0.5">🛡️</span>
                        <p className="leading-relaxed font-medium">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What to Avoid */}
                <div className="bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-red-500 opacity-80" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-black text-rose-400">{lang === 'en' ? BUYER_GUIDE.avoid.title : BUYER_GUIDE.avoid.hindiTitle}</h4>
                  </div>
                  <div className="space-y-4">
                    {BUYER_GUIDE.avoid.points.map((p, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-rose-400 font-bold mt-0.5">✕</span>
                        <p className="leading-relaxed font-medium">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* The Setup Guide */}
              <div className="bg-[#131b2c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                  <h4 className="text-xl font-black text-white">
                    {lang === 'en' ? 'The Professional Buyer Setup' : 'प्रोफेशनल बायर सेटअप'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {BUYER_GUIDE.setup.map((s, i) => (
                    <div key={i} className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:bg-white/5 hover:border-white/10 transition-colors">
                      <div className="text-sm font-black text-indigo-400 mb-2">{lang === 'en' ? s.step : s.hindiStep}</div>
                      <p className="text-slate-400 text-xs leading-relaxed font-medium">{lang === 'en' ? s.desc : s.hindiDesc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Notch Strategies */}
              <div className="bg-gradient-to-r from-violet-900/10 via-[#131b2c] to-fuchsia-900/10 border border-violet-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-white">
                      {lang === 'en' ? 'Top-Notch Strategies for Option Buyers' : 'ऑप्शन बायर्स के लिए टॉप-नॉच स्ट्रेटेजी'}
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {lang === 'en' ? 'These are high-probability setups used by professional option buyers.' : 'ये वो हाई-प्रोबेबिलिटी (High Probability) सेटअप्स हैं जो प्रोफेशनल ऑप्शन बायर्स इस्तेमाल करते हैं।'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {BUYER_GUIDE.topStrategies.map((s, i) => (
                    <div key={i} className={`bg-gradient-to-b from-[#1a233a] to-[#131b2c] border ${s.border} rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 shadow-xl`}>
                      <div className={`absolute top-0 left-0 w-full h-1 ${s.bg} opacity-80 group-hover:opacity-100 transition-opacity`} />
                      
                      <div className="flex items-center gap-4 mb-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-black/40 border border-white/5 shadow-inner ${s.color}`}>
                          {s.icon}
                        </div>
                        <h5 className={`text-lg font-black ${s.color} leading-tight`}>
                          {lang === 'en' ? s.title : s.hindiTitle}
                        </h5>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                          {lang === 'en' ? s.desc : s.hindiDesc}
                        </p>
                        <div className={`bg-black/30 rounded-xl p-4 border border-white/5 shadow-inner`}>
                          <div className={`text-[10px] font-black ${s.color} uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
                            <Zap className="w-3.5 h-3.5"/> Pro Tip
                          </div>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            {lang === 'en' ? s.proTip : s.hindiProTip}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Option Seller Tab ── */}
          {activeTab === 'seller' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-900/20 via-[#131b2c] to-blue-900/20 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-blue-500/5 opacity-60" />
                <div className="relative z-10 shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                  <BarChart2 className="w-8 h-8 text-white" />
                </div>
                <div className="relative z-10 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h3 className="text-2xl md:text-3xl font-black text-white">Professional Options Seller Guide</h3>
                    
                    {/* Language Toggle */}
                    <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md">
                      <button
                        onClick={() => setLang('en')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'en' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setLang('hi')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'hi' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        हिंदी (Hindi)
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl mt-2">
                    {lang === 'en' ? (
                      <>Being an option seller (writer) is like <strong className="text-amber-300">running an insurance company</strong>. You collect premiums from buyers and rely on probability, time decay, and statistics to keep the money.</>
                    ) : (
                      <>एक ऑप्शन सेलर (राइटर) होना <strong className="text-amber-300">इन्शुरन्स कंपनी चलाने</strong> जैसा है। आप बायर्स से प्रीमियम इकट्ठा करते हैं और पैसा बचाने के लिए प्रोबेबिलिटी, टाइम डिकेय (Theta), और स्टैटिस्टिक्स पर निर्भर रहते हैं।</>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Why Sell */}
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-black text-emerald-400">{lang === 'en' ? SELLER_GUIDE.why.title : SELLER_GUIDE.why.hindiTitle}</h4>
                  </div>
                  <div className="space-y-4">
                    {SELLER_GUIDE.why.points.map((p, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                        <p className="leading-relaxed font-medium">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks & Margin */}
                <div className="bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-red-500 opacity-80" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-black text-rose-400">{lang === 'en' ? SELLER_GUIDE.risks.title : SELLER_GUIDE.risks.hindiTitle}</h4>
                  </div>
                  <div className="space-y-4">
                    {SELLER_GUIDE.risks.points.map((p, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-rose-400 font-bold mt-0.5">✕</span>
                        <p className="leading-relaxed font-medium">{lang === 'en' ? p.text : p.hindi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* The Setup Guide */}
              <div className="bg-[#131b2c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                  <h4 className="text-xl font-black text-white">
                    {lang === 'en' ? 'The Professional Seller Setup' : 'प्रोफेशनल सेलर सेटअप'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SELLER_GUIDE.setup.map((s, i) => (
                    <div key={i} className="bg-black/30 border border-amber-500/10 rounded-2xl p-5 hover:bg-amber-500/5 hover:border-amber-500/20 transition-colors">
                      <div className="text-sm font-black text-amber-400 mb-2">{lang === 'en' ? s.step : s.hindiStep}</div>
                      <p className="text-slate-400 text-xs leading-relaxed font-medium">{lang === 'en' ? s.desc : s.hindiDesc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Notch Strategies */}
              <div className="bg-gradient-to-r from-amber-900/10 via-[#131b2c] to-blue-900/10 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-white">
                      {lang === 'en' ? 'Top-Notch Strategies for Option Sellers' : 'ऑप्शन सेलर्स के लिए टॉप-नॉच स्ट्रेटेजी'}
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {lang === 'en' ? 'These are high-probability setups used by institutional option writers.' : 'ये वो हाई-प्रोबेबिलिटी सेटअप्स हैं जो बड़े इंस्टीटूशनल (Institutional) ऑप्शन सेलर्स इस्तेमाल करते हैं।'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {SELLER_GUIDE.topStrategies.map((s, i) => (
                    <div key={i} className={`bg-gradient-to-b from-[#1a233a] to-[#131b2c] border ${s.border} rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 shadow-xl`}>
                      <div className={`absolute top-0 left-0 w-full h-1 ${s.bg} opacity-80 group-hover:opacity-100 transition-opacity`} />
                      
                      <div className="flex items-center gap-4 mb-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-black/40 border border-white/5 shadow-inner ${s.color}`}>
                          {s.icon}
                        </div>
                        <h5 className={`text-lg font-black ${s.color} leading-tight`}>
                          {lang === 'en' ? s.title : s.hindiTitle}
                        </h5>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                          {lang === 'en' ? s.desc : s.hindiDesc}
                        </p>
                        <div className={`bg-black/30 rounded-xl p-4 border border-white/5 shadow-inner`}>
                          <div className={`text-[10px] font-black ${s.color} uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
                            <Zap className="w-3.5 h-3.5"/> Pro Tip
                          </div>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            {lang === 'en' ? s.proTip : s.hindiProTip}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Greeks Tab ── */}
          {activeTab === 'greeks' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-900/20 via-[#131b2c] to-fuchsia-900/20 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-fuchsia-500/5 opacity-60" />
                <div className="relative z-10 shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.25)]">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="relative z-10 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h3 className="text-2xl md:text-3xl font-black text-white">Option Greeks Dashboard</h3>
                    
                    {/* Language Toggle */}
                    <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md">
                      <button
                        onClick={() => setLang('en')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'en' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setLang('hi')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'hi' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        हिंदी (Hindi)
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl mt-2">
                    {lang === 'en' ? (
                      <>Option Greeks are mathematical measures used to evaluate <strong className="text-indigo-300">the risk and sensitivity</strong> of an options contract to various factors like price, time, and volatility.</>
                    ) : (
                      <>ऑप्शन ग्रीक्स वो मैथमेटिकल फॉर्मूले हैं जो किसी भी ऑप्शन के <strong className="text-indigo-300">रिस्क और सेंसिटिविटी (Sensitivity)</strong> को नापते हैं (जैसे प्राइस, टाइम, और वोलैटिलिटी का असर)।</>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {GREEKS_DATA.map((greek, i) => (
                  <div key={i} className={`bg-gradient-to-br ${greek.bg} border ${greek.border} rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[70px] opacity-20 group-hover:opacity-30 transition-opacity bg-white" />
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border border-white/10 bg-black/20 shadow-inner group-hover:scale-110 transition-transform duration-500 text-3xl ${greek.color}`}>
                          {greek.icon}
                        </div>
                        <div>
                          <div className={`text-2xl font-black ${greek.color} tracking-tight`}>
                            {lang === 'en' ? greek.name : greek.hindiName}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 flex-1">
                        <div className="bg-black/25 rounded-2xl p-4 border border-white/5 shadow-inner">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Definition</div>
                          <div className="text-slate-200 font-bold leading-relaxed text-sm">
                            {lang === 'en' ? greek.definition : greek.hindiDefinition}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-950/30 rounded-2xl p-4 border border-emerald-500/10 shadow-inner">
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Call Option</div>
                            <div className="text-emerald-200 font-medium text-xs">{greek.call}</div>
                          </div>
                          <div className="bg-rose-950/30 rounded-2xl p-4 border border-rose-500/10 shadow-inner">
                            <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Put Option</div>
                            <div className="text-rose-200 font-medium text-xs">{greek.put}</div>
                          </div>
                        </div>

                        <div className="bg-indigo-950/30 rounded-2xl p-4 border border-indigo-500/20 mt-auto">
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/> Pro Insight</div>
                          <div className="text-indigo-200 font-medium text-xs leading-relaxed">
                            {lang === 'en' ? greek.insight : greek.hindiInsight}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Strategies Tab ── */}
          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">Click any strategy card to expand setup details and payoff charts.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {STRATEGIES.map(s => <StrategyCardComp key={s.name} s={s} />)}
              </div>
            </div>
          )}

          {/* ── PCR Tab ── */}
          {activeTab === 'pcr' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-blue-900/20 to-[#131b2c] border border-blue-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500" />
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Activity className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">Put-Call Ratio (PCR)</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    <strong className="text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">PCR = Total Put OI / Total Call OI</strong><br /><br />
                    PCR measures the ratio of put options to call options outstanding. It is widely used as a <strong className="text-slate-200">contrarian sentiment indicator</strong>. Extreme readings often signal an impending market reversal.
                  </p>

                  {/* PCR Visual Gauge */}
                  <div className="bg-black/30 rounded-2xl p-5 border border-white/5 mb-6 relative overflow-hidden">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                      <span>PCR Sentiment Meter</span>
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-slate-200 z-10" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                      <span>0.5 (Top)</span>
                      <span>1.0 (Neutral)</span>
                      <span>1.5 (Bottom)</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group/rule">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/rule:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center gap-2.5 mb-2 relative z-10">
                      <AlertTriangle className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                      <span className="text-sm font-black text-amber-400 uppercase tracking-widest">Golden Rule</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed font-medium relative z-10">PCR is a lagging indicator. Always combine it with price action, support/resistance, and volume. Never trade PCR in isolation.</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-8">
                <div className="bg-gradient-to-b from-[#131b2c] to-[#0f1522] border border-[#1e293b] rounded-3xl p-6 md:p-8 shadow-xl h-full flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-slate-800/20 rounded-full blur-[100px] pointer-events-none" />
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4" /> PCR Heatmap Zones
                  </h4>
                  <div className="space-y-4 relative z-10">
                    {PCR_ZONES.map((z, i) => (
                      <div key={i} className="relative group rounded-2xl p-5 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-5 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-0.5">
                        {/* Background color hint */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2.5 shadow-[0_0_10px_currentColor]" style={{ background: z.color, color: z.color }} />
                        
                        <div className="w-full sm:w-32 shrink-0">
                          <div className="text-2xl font-black tracking-tight" style={{ color: z.color, textShadow: `0 0 15px ${z.color}40` }}>{z.range}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">PCR Range</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="inline-flex px-3 py-1 rounded-lg text-xs font-black mb-2.5 border shadow-sm" style={{ color: z.color, borderColor: `${z.color}30`, background: `${z.color}15` }}>
                            {z.label}
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium">{z.hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── IV Tab ── */}
          {activeTab === 'iv' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-500/10 via-[#131b2c] to-blue-500/10 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform duration-500 relative z-10">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Implied Volatility (IV)</h3>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
                    IV represents the market's forecast of a likely movement in a security's price. <strong className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">High IV = Expensive Options</strong>. <strong className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">Low IV = Cheap Options</strong>. The absolute cardinal rule of options trading is to <strong className="text-white border-b-2 border-yellow-500">Buy Low IV, Sell High IV.</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {IV_TIPS.map((tip, i) => (
                  <div key={i} className={`bg-gradient-to-b ${tip.color} ${tip.border} border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -top-10 -right-10 p-4 opacity-20 text-8xl group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 blur-[2px] group-hover:blur-0">{tip.icon}</div>
                    <div className="relative z-10">
                      <div className={`text-2xl font-black ${tip.text} mb-2 tracking-tight`}>{tip.label}</div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 px-3.5 py-1.5 rounded-full mb-5 backdrop-blur-md border border-white/20 shadow-lg">
                        <ArrowRight className="w-3.5 h-3.5" /> {tip.action}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-6 h-20 font-medium">{tip.reason}</p>
                      <div className="bg-black/40 rounded-2xl p-5 border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Ideal Strategies</div>
                        <div className={`text-sm font-bold ${tip.text} leading-snug`}>{tip.strategies}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Strikes Tab ── */}
          {activeTab === 'strikes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {STRIKE_GUIDE.map((g, i) => (
                  <div key={i} className={`bg-gradient-to-b from-[#1a233a] to-[#131b2c] border ${g.border} rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 shadow-xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]`}>
                    {/* Glowing Accent */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${g.bg} ${g.glow} opacity-80 group-hover:opacity-100 transition-opacity`} />
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 ${g.bg}`} />
                    
                    <div className="flex items-center gap-5 mb-8 relative z-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl ${g.bg} ${g.glow} transform group-hover:rotate-6 transition-transform duration-500`}>
                        {g.tag}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{g.full}</h3>
                        <div className={`text-xs font-bold ${g.color} tracking-widest uppercase mt-1`}>{g.premium} Premium</div>
                      </div>
                    </div>

                    {/* Delta Progress Bar */}
                    <div className="mb-8 relative z-10">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
                        <span>Delta Exposure</span>
                        <span className={g.color}>{g.deltaText}</span>
                      </div>
                      <div className="h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className={`h-full ${g.bg} rounded-full relative overflow-hidden`} style={{ width: `${g.delta}%` }}>
                           <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 animate-[shimmer_2s_infinite]" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Call Strike</span>
                        <span className="text-sm font-black text-slate-200">{g.call}</span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Put Strike</span>
                        <span className="text-sm font-black text-slate-200">{g.put}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Best Used For</div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">{g.use}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-3xl p-6 md:p-8 flex items-start md:items-center gap-5 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative z-10 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-2xl">💡</span>
                </div>
                <div className="relative z-10">
                  <h4 className="text-base font-black text-blue-400 mb-2 tracking-tight">Professional Insight</h4>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    For directional trades, prefer <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">ATM options</strong> for high gamma and liquidity. For generating income, sell <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">OTM options</strong>. Always check the bid-ask spread before entering — a wide spread means the option is illiquid and should be avoided.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Hedging Tab ── */}
          {activeTab === 'hedging' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900/20 via-[#131b2c] to-blue-900/20 border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 opacity-60" />
                <div className="relative z-10 shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="relative z-10 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h3 className="text-2xl md:text-3xl font-black text-white">Professional Hedging Framework</h3>
                    
                    {/* Language Toggle */}
                    <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md">
                      <button
                        onClick={() => setLang('en')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'en' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setLang('hi')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${lang === 'hi' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                      >
                        हिंदी (Hindi)
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl mt-2">
                    {lang === 'en' ? (
                      <>Hedging is not about being always bearish. It is about <strong className="text-emerald-300">controlling drawdown, surviving event risk, and preserving capital</strong> so your core strategy can continue compounding. Professionals hedge exposure, not opinions.</>
                    ) : (
                      <>हेजिंग का मतलब हमेशा मंदी (bearish) सोचना नहीं है। इसका उद्देश्य <strong className="text-emerald-300">नुकसान को कम करना, इवेंट रिस्क से बचना और कैपिटल को बचाए रखना है</strong> ताकि आपकी मुख्य स्ट्रेटेजी आगे बढ़ती रहे। प्रोफेशनल्स एक्सपोजर को हेज करते हैं, अपनी राय को नहीं।</>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {(lang === 'en' ? HEDGING_MODELS : HEDGING_MODELS_HI).map((model, i) => (
                  <div key={i} className={`bg-gradient-to-br ${model.bg} border ${model.border} rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[70px] opacity-20 group-hover:opacity-30 transition-opacity bg-white" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border border-white/10 bg-black/20 shadow-inner group-hover:scale-110 transition-transform duration-500 ${model.color}`}>
                            <svg width="32" height="32" viewBox="0 0 40 35" className="opacity-80 group-hover:opacity-100 drop-shadow-[0_0_8px_currentColor]">
                              {model.payoffSvg}
                            </svg>
                          </div>
                          <div>
                            <div className={`text-xl font-black ${model.color} tracking-tight`}>{model.title}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{model.subtitle}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 whitespace-nowrap">
                          {model.badge}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Structure</div>
                          <div className="text-slate-200 font-bold leading-relaxed">{model.setup}</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Best Used For</div>
                            <div className="text-slate-300 font-medium leading-relaxed">{model.bestFor}</div>
                          </div>
                          <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Professional Rule</div>
                            <div className="text-slate-300 font-medium leading-relaxed">{model.proRule}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-emerald-950/30 rounded-2xl p-4 border border-emerald-500/10">
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Strength</div>
                            <div className="text-emerald-200 font-medium leading-relaxed">{model.strength}</div>
                          </div>
                          <div className="bg-rose-950/30 rounded-2xl p-4 border border-rose-500/10">
                            <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Weakness</div>
                            <div className="text-rose-200 font-medium leading-relaxed">{model.weakness}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(lang === 'en' ? HEDGING_RULES : HEDGING_RULES_HI).map((rule, i) => (
                  <div key={i} className="bg-[#131b2c] border border-white/10 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                        {rule.icon}
                      </div>
                      <h4 className={`text-lg font-black ${rule.tone}`}>{rule.title}</h4>
                    </div>
                    <div className="space-y-2.5">
                      {rule.points.map((point, j) => (
                        <div key={j} className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-2xl p-3.5">
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${rule.tone.replace('text-', 'bg-')}`} />
                          <p className="text-sm text-slate-300 leading-relaxed font-medium">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-amber-900/20 via-[#131b2c] to-rose-900/20 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h4 className="text-lg font-black text-amber-400 tracking-wide uppercase">
                    {lang === 'en' ? 'Professional Hedging Mistakes' : 'प्रोफेशनल हेजिंग की गलतियां'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                    <div className="text-white font-black mb-2">{lang === 'en' ? 'Late Hedge' : 'देरी से हेज करना'}</div>
                    <p className="text-slate-300 leading-relaxed">
                      {lang === 'en' 
                        ? 'Buying protection after panic spikes usually means paying peak IV for poor reward.' 
                        : 'पैनिक आने और IV बढ़ने के बाद प्रोटेक्शन खरीदने का मतलब है महंगे दाम पर कम फायदा लेना।'}
                    </p>
                  </div>
                  <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                    <div className="text-white font-black mb-2">{lang === 'en' ? 'Over-Hedging' : 'ओवर-हेजिंग (जरुरत से ज्यादा हेज)'}</div>
                    <p className="text-slate-300 leading-relaxed">
                      {lang === 'en' 
                        ? 'Too much hedge neutralizes portfolio edge and silently kills long-term return.' 
                        : 'जरुरत से ज्यादा हेज करने से पोर्टफोलियो न्यूट्रल हो जाता है और लॉन्ग-टर्म प्रॉफिट खत्म हो जाता है।'}
                    </p>
                  </div>
                  <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                    <div className="text-white font-black mb-2">{lang === 'en' ? 'No Exit Plan' : 'एग्जिट प्लान न होना'}</div>
                    <p className="text-slate-300 leading-relaxed">
                      {lang === 'en' 
                        ? 'A hedge without a review trigger becomes a decaying cost center instead of risk management.' 
                        : 'बिना एग्जिट प्लान वाला हेज रिस्क मैनेजमेंट की बजाय सिर्फ एक खर्च (नुकसान) बन कर रह जाता है।'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Theta Tab ── */}
          {activeTab === 'theta' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/20 via-[#131b2c] to-rose-900/20 border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Theta (Time Decay)</h3>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    Theta measures <strong className="text-rose-300">how much option premium erodes per day</strong>. Time is a silent killer for option <em className="text-white font-bold">buyers</em> and the greatest ally for option <em className="text-white font-bold">sellers</em>. Understanding the theta curve is critical to profitability.
                  </p>
                </div>
              </div>

              {/* Theta Decay Visual Curve */}
              <div className="bg-[#131b2c] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/10 transition-colors duration-700" />
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> The Theta Decay Curve
                </h4>
                
                <div className="relative h-48 sm:h-64 w-full flex items-end">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 border-l border-b border-white/10 flex flex-col justify-between pb-8 pl-8">
                    <div className="border-b border-white/5 w-full h-0"></div>
                    <div className="border-b border-white/5 w-full h-0"></div>
                    <div className="border-b border-white/5 w-full h-0"></div>
                  </div>
                  
                  {/* Axis Labels */}
                  <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] font-bold text-slate-500 text-right pr-2 py-1">
                    <span>100%</span>
                    <span>50%</span>
                    <span>0%</span>
                  </div>
                  <div className="absolute bottom-0 left-8 right-0 h-8 flex justify-between text-[10px] font-bold text-slate-500 pt-2 px-1">
                    <span>90 Days</span>
                    <span>60 Days</span>
                    <span>30 Days</span>
                    <span className="text-rose-400">0 Days</span>
                  </div>

                  {/* The Curve SVG */}
                  <svg className="absolute inset-0 w-full h-full pb-8 pl-8 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="thetaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="70%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <path 
                      d="M 0,0 Q 40,5 70,30 T 100,100" 
                      fill="none" 
                      stroke="url(#thetaGradient)" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                      filter="url(#glow)"
                      className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                    />
                    
                    {/* Data Points */}
                    <circle cx="0" cy="0" r="2" fill="#8b5cf6" />
                    <circle cx="33" cy="4" r="2" fill="#a855f7" />
                    <circle cx="66" cy="22" r="2" fill="#d946ef" />
                    <circle cx="85" cy="55" r="3" fill="#f43f5e" className="animate-pulse" />
                    <circle cx="100" cy="100" r="4" fill="#e11d48" />
                    
                    {/* Danger Zone Highlight */}
                    <rect x="85" y="0" width="15" height="100" fill="url(#dangerZone)" opacity="0.2" />
                    <defs>
                      <linearGradient id="dangerZone" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Tooltips/Annotations */}
                  <div className="absolute top-[10%] left-[20%] text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 backdrop-blur-sm hidden sm:block">
                    Slow Decay (30-90 Days)
                  </div>
                  <div className="absolute top-[40%] right-[15%] text-xs font-bold text-rose-300 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 backdrop-blur-sm hidden sm:block">
                    Rapid Decay (&lt;14 Days)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: '📉', title: 'The Buyer\'s Dilemma', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', desc: 'If you buy an option and price doesn\'t move, you LOSE premium daily. The option loses value even in a perfectly flat market.', tips: ['Buy options with enough DTE (>14 days)', 'Set a stop-loss on premium (e.g., exit if 40% lost)', 'Prefer buying when IV is extremely low'] },
                  { icon: '📈', title: 'The Seller\'s Advantage', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'If you sell an option and price doesn\'t move, you EARN premium daily via theta decay — especially powerful in range-bound markets.', tips: ['Sell 30–45 DTE for fastest decay curve', 'Use spreads to limit risk on naked sells', 'Close at 50% profit to reduce gamma risk'] },
                  { icon: '⚡', title: 'Theta Acceleration', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'Theta decay is NOT linear. It accelerates dramatically in the last 7–14 days before expiry as extrinsic value collapses.', tips: ['Avoid buying options in final week', 'Excellent week for weekly option sellers', 'ATM options have highest theta in final week'] },
                  { icon: '⚖️', title: 'Theta vs Delta', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Buyers need Delta (price movement) to overcome Theta destruction. Sellers need the market to stay quiet so Theta earns more than Delta costs.', tips: ['Buyer needs: Big + Fast move', 'Seller needs: Slow / No move', 'Events spike IV → buy early, sell after'] },
                ].map((item, i) => (
                  <div key={i} className={`bg-[#131b2c] rounded-3xl border ${item.border} p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${item.bg}`}>
                        {item.icon}
                      </div>
                      <h4 className={`text-lg font-black ${item.color}`}>{item.title}</h4>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 h-16">{item.desc}</p>
                    <div className="space-y-2">
                      {item.tips.map((t, j) => (
                        <div key={j} className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${item.bg.replace('/10', '')}`} />
                          <span className="text-xs font-medium text-slate-300 leading-snug">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-rose-400" />
                  <span className="text-base font-black text-rose-400 uppercase tracking-widest">The Golden Rule</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-white">Never hold a bought option through expiry hoping for a miracle.</strong> Theta will destroy 100% of extrinsic value by expiry. Set clear time-based exits — if your thesis hasn't played out in 50% of the remaining DTE (Days to Expiry), <strong className="text-rose-300">exit the position.</strong>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OptionsHint;
