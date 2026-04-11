import React, { useState } from 'react';
import {
  BookOpen, Quote, Brain, Star, ChevronRight,
  Lightbulb, TrendingUp, Search, Filter, ArrowUpRight,
  Calendar, ExternalLink, ShieldAlert, BrainCircuit
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Real, iconic, sourced quotes from legendary traders & investors
// ─────────────────────────────────────────────────────────────────────────────

const quotes = [
  {
    id: 1,
    text: "Be fearful when others are greedy, and greedy when others are fearful.",
    author: "Warren Buffett",
    role: "Chairman & CEO, Berkshire Hathaway",
    source: "Shareholder Letter, 2004",
    category: "Contrarian",
    accentClass: "amber",
    avatar: "/psychology/author_warren_buffett.png",
    size: "hero", // large featured card
    year: "2004",
  },
  {
    id: 2,
    text: "The market can remain irrational longer than you can remain solvent.",
    author: "John Maynard Keynes",
    role: "Economist & Speculator",
    source: "Attributed — widely cited in market literature",
    category: "Risk",
    accentClass: "blue",
    avatar: null,
    size: "large",
    year: "1930s",
  },
  {
    id: 3,
    text: "I never attempt to make money on the stock market. I buy on the assumption that they could close the market the next day and not reopen it for five years.",
    author: "Warren Buffett",
    role: "Chairman & CEO, Berkshire Hathaway",
    source: "Berkshire Hathaway Annual Meeting",
    category: "Patience",
    accentClass: "emerald",
    avatar: "/psychology/author_warren_buffett.png",
    size: "normal",
    year: "1995",
  },
  {
    id: 4,
    text: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.",
    author: "George Soros",
    role: "Founder, Soros Fund Management",
    source: "The Alchemy of Finance, 1987",
    category: "Risk",
    accentClass: "blue",
    avatar: "/psychology/author_george_soros.png",
    size: "normal",
    year: "1987",
  },
  {
    id: 5,
    text: "The four most dangerous words in investing are: 'This time it's different.'",
    author: "Sir John Templeton",
    role: "Founder, Templeton Mutual Funds",
    source: "Forbes Magazine Interview",
    category: "Discipline",
    accentClass: "rose",
    avatar: null,
    size: "normal",
    year: "1993",
  },
  {
    id: 6,
    text: "Money is made by sitting, not trading.",
    author: "Jesse Livermore",
    role: "Legendary Speculator, 'Boy Plunger'",
    source: "Reminiscences of a Stock Operator, 1923",
    category: "Patience",
    accentClass: "amber",
    avatar: "/psychology/author_jesse_livermore.png",
    size: "small",
    year: "1923",
  },
  {
    id: 7,
    text: "I am always doing that which I cannot do, in order that I may learn how to do it.",
    author: "Paul Tudor Jones",
    role: "Founder, Tudor Investment Corp",
    source: "Market Wizards, Jack Schwager, 1989",
    category: "Mindset",
    accentClass: "violet",
    avatar: null,
    size: "small",
    year: "1989",
  },
  {
    id: 8,
    text: "The trend is your friend until the end when it bends.",
    author: "Ed Seykota",
    role: "Pioneer of Systematic Trading",
    source: "Market Wizards, Jack Schwager, 1989",
    category: "Discipline",
    accentClass: "orange",
    avatar: "/psychology/author_ed_seykota.png",
    size: "small",
    year: "1989",
  },
  {
    id: 9,
    text: "In this business, if you're good, you're right six times out of ten. You're never going to be right nine times out of ten.",
    author: "Peter Lynch",
    role: "Former Manager, Magellan Fund, Fidelity",
    source: "One Up on Wall Street, 1989",
    category: "Mindset",
    accentClass: "teal",
    avatar: null,
    size: "normal",
    year: "1989",
  },
  {
    id: 10,
    text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
    author: "Philip Fisher",
    role: "Author, Common Stocks and Uncommon Profits",
    source: "Common Stocks and Uncommon Profits, 1958",
    category: "Contrarian",
    accentClass: "cyan",
    avatar: null,
    size: "normal",
    year: "1958",
  },
  {
    id: 11,
    text: "Wide diversification is only required when investors do not understand what they are doing.",
    author: "Warren Buffett",
    role: "Chairman & CEO, Berkshire Hathaway",
    source: "Berkshire Hathaway Annual Report",
    category: "Strategy",
    accentClass: "amber",
    avatar: "/psychology/author_warren_buffett.png",
    size: "small",
    year: "1993",
  },
  {
    id: 12,
    text: "Markets are never wrong — opinions often are.",
    author: "Jesse Livermore",
    role: "Legendary Speculator, 'Boy Plunger'",
    source: "How to Trade in Stocks, 1940",
    category: "Discipline",
    accentClass: "amber",
    avatar: "/psychology/author_jesse_livermore.png",
    size: "small",
    year: "1940",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Articles
// ─────────────────────────────────────────────────────────────────────────────

const articles = [
  {
    id: 1,
    title: "The Psychology of Fear and Greed in Markets",
    excerpt: "Two primal emotions drive every market cycle. Understanding them — and keeping them in check — is the most durable edge a trader can develop.",
    category: "Emotion Control",
    readTime: "6 min read",
    gradient: "from-rose-600/20 to-orange-600/5",
    border: "border-rose-500/20",
    accentColor: "text-rose-400",
    tagBg: "bg-rose-500/15 text-rose-300",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    content: `Fear and greed are the twin engines that power every market cycle. When fear dominates, prices fall below fair value. When greed takes hold, they soar above it. The professional trader's edge lies not in predicting the market, but in reading these emotions in the crowd while keeping them in check within themselves.

**The Fear Cycle:**
When a position moves against you, the brain's amygdala — the seat of fight-or-flight — fires. Cortisol floods in, impairing rational decision-making. The instinct is to hold the loss hoping it recovers. This is loss aversion: Kahneman and Tversky proved that the pain of a ₹1,000 loss is felt twice as intensely as the pleasure of a ₹1,000 gain.

**The Greed Trap:**
Conversely, during winning streaks, dopamine creates overconfidence. Traders increase size at exactly the wrong moment — near tops — because the recent success pattern feels like certainty. Stanley Druckenmiller famously said his worst mistakes came after his greatest successes, when he felt "infallible."

**The Professional's Antidote:**
Pre-define your stop loss before entering. Keep a trading journal noting your emotional state. Ray Dalio, founder of Bridgewater Associates, meditates daily and cites it as foundational to his decision-making clarity under pressure.`,
  },
  {
    id: 2,
    title: "Why 80% of Retail Traders Lose — The Real Reason",
    excerpt: "It's almost never poor stock picks. Decades of data point to two root causes: over-leverage and the psychological mismanagement of drawdowns.",
    category: "Risk Management",
    readTime: "8 min read",
    gradient: "from-blue-600/20 to-indigo-600/5",
    border: "border-blue-500/20",
    accentColor: "text-blue-400",
    tagBg: "bg-blue-500/15 text-blue-300",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    content: `SEBI data for FY2022 showed that 89% of individual F&O traders in India lost money. This isn't unique — studies across US, Europe, and Asia consistently show similar figures. The cause is almost never poor security selection.

**Root Cause #1: Over-Leverage**
At 10x leverage, a 10% adverse move eliminates your capital. Professional traders at elite hedge funds rarely exceed 2–3x on individual positions. The retail trader, chasing fast returns, routinely takes 10x, 20x, or more through options.

**Root Cause #2: The Drawdown Spiral**
After a losing streak, the psychological pressure to "make it back" causes position sizes to increase — exactly when they should decrease. A 50% drawdown requires a 100% gain to recover. This mathematics, combined with urgency, is lethal.

**The Kelly Solution:**
Kelly % = Win Rate − [(1 − Win Rate) / Avg Win : Avg Loss]. Professional traders use a fraction of Kelly (25–50%) to further reduce variance. Never risk more than 1% of capital on a single trade until you have 200+ documented trades proving your edge.`,
  },
  {
    id: 3,
    title: "Process Over Outcome: The Key Mental Shift",
    excerpt: "A good trade can lose money. A bad trade can make money. If you judge quality by outcome alone, you will never develop real skill.",
    category: "Mindset",
    readTime: "5 min read",
    gradient: "from-emerald-600/20 to-teal-600/5",
    border: "border-emerald-500/20",
    accentColor: "text-emerald-400",
    tagBg: "bg-emerald-500/15 text-emerald-300",
    image: "https://images.unsplash.com/photo-1612010167102-d1e8f83833e1?auto=format&fit=crop&w=1200&q=80",
    content: `The most powerful mental shift in trading: judge every trade on process quality, not outcome. A disciplined execution of a poor setup that stops out is a good trade. A reckless position that accidentally profits is a bad trade that just got lucky.

**What Process-Orientation Demands:**
- Pre-defined entry criteria (minimum 3–5 conditions met before entry)
- Stop loss placed before position is opened
- Position size calculated from risk amount, not conviction level
- A journal entry within 15 minutes of close — what did I do, and why?

**The Surgeon Analogy:**
A cardiothoracic surgeon doesn't measure their skill by patient survival rate alone. They measure by technical execution. Sometimes perfect technique loses the patient. Sometimes poor technique survives by luck. The hospital that improves rewards process, not outcome. Trading is identical.

**Practical Implementation:**
Score every trade 1–10 on process quality, separately from P&L. After 50 trades, correlate process scores with P&L. You will find — always — that the highest-process trades trend profitable, and the lowest-process trades trend to losses, even if individual outcomes look random.`,
  },
  {
    id: 4,
    title: "Patience as a Position: Sitting in Cash",
    excerpt: "Jesse Livermore said it in 1923. Buffett has said it every decade since. The hardest skill in trading isn't picking — it's waiting.",
    category: "Patience",
    readTime: "4 min read",
    gradient: "from-amber-600/20 to-yellow-600/5",
    border: "border-amber-500/20",
    accentColor: "text-amber-400",
    tagBg: "bg-amber-500/15 text-amber-300",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    content: `In 1923, Jesse Livermore wrote: "After spending many years in Wall Street and after making and losing millions of dollars I want to tell you this: It never was my thinking that made the big money for me. It always was my sitting." A century later, this remains the hardest skill to develop.

**The Zero-Commission Trap:**
The removal of brokerage commissions (Zerodha, Robinhood) paradoxically increased losses for retail traders. With no cost to trade, the psychological barrier to overtrading vanished. Activity became confused with productivity. High-frequency positioning replaced measured, deliberate entries.

**Buffett's Punch Card:**
Charlie Munger and Warren Buffett frequently reference the mental model of a punch card with 20 holes — representing every investment decision of your career. With only 20 slots, you'd be extraordinarily selective. The constraint creates patience.

**Practical Implementation:**
Treat cash as a position with an explicit thesis: "I am holding cash because no current opportunity meets my full criteria checklist." Log it in your journal the same way you'd log a trade. Waiting is not nothing — it is active restraint, and it is one of the most profitable things a trader can do.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

const books = [
  {
    id: 1, title: "Trading in the Zone", author: "Mark Douglas", year: "2000", genre: "Psychology", rating: 5,
    coverImage: "/psychology/book_trading_zone.png", authorImage: "/psychology/author_mark_douglas.png",
    description: "The definitive text on trading psychology. Douglas systematically dismantles why knowledge alone never produces consistent results, and builds the probabilistic mindset that separates professionals from amateurs.",
    keyLesson: "Think in probabilities, not certainties. Every trade is just one sample from a distribution.",
    importantLessons: [
      "The market is a probabilistic environment; no single trade determines your success.",
      "Accept the risk completely before you enter any trade to eliminate emotional distress.",
      "Create a sample size of trades (e.g., 20) and judge the process, not individual outcomes.",
      "An edge is nothing more than an indication of a higher probability of one thing happening over another.",
      "If you can learn to create a state of mind that is not affected by the market's behavior, the struggle will cease to exist.",
      "The best traders stay in the flow of the market because they don't perceive anything the market does as a threat.",
      "You do not need to know what is going to happen next to make money.",
      "There is a random distribution between wins and losses for any given set of variables that define an edge.",
      "When you genuinely accept the risks, you will be at peace with any outcome.",
      "The hard reality of trading is that, if you want to create consistency, you have to start from the premise that no matter what the outcome, you are responsible."
    ],
    color: "from-violet-900/40 to-[#131b26]", border: "border-violet-500/30", accentColor: "text-violet-400",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30", spineBg: "bg-violet-600",
  },
  {
    id: 2, title: "Reminiscences of a Stock Operator", author: "Edwin Lefèvre", year: "1923", genre: "Biography", rating: 5,
    coverImage: "/psychology/book_reminiscences.png", authorImage: "/psychology/author_jesse_livermore.png",
    description: "A fictionalised biography of Jesse Livermore. Over a century old, every psychological insight — on patience, on loss, on hubris, on the crowd — maps perfectly onto modern markets. Required reading.",
    keyLesson: "Human nature doesn't change. Neither does the market's ability to exploit it.",
    importantLessons: [
      "It was never my thinking that made the big money for me. It always was my sitting. Patience is power.",
      "Markets are never wrong, opinions often are.",
      "Never average losses. Averaging down is the hallmark of an amateur.",
      "The trend is evident before the news justifies it.",
      "There is nothing new in Wall Street. Whatever happens in the stock market today has happened before and will happen again.",
      "A loss never bothers me after I take it. I forget it overnight. But being wrong - not taking the loss - that is what does damage to the pocketbook and to the soul.",
      "The game of speculation is the most uniformly fascinating game in the world. But it is not a game for the stupid.",
      "Money is made by sitting, not trading.",
      "Watch the market leaders, the stocks that have led the charge upward in a bull market.",
      "Don't try to catch all the fluctuations. Wait for the big moves."
    ],
    color: "from-amber-900/40 to-[#131b26]", border: "border-amber-500/30", accentColor: "text-amber-400",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30", spineBg: "bg-amber-700",
  },
  {
    id: 3, title: "Market Wizards", author: "Jack D. Schwager", year: "1989", genre: "Interviews", rating: 5,
    coverImage: "/psychology/book_market_wizards.png", authorImage: null,
    description: "Schwager interviews Ed Seykota, Paul Tudor Jones, Michael Marcus, and others. The diversity of approaches is startling — but the shared foundations of discipline, risk management, and self-knowledge are universal.",
    keyLesson: "There is no single trading style that works. There is only disciplined, consistent application of an edge.",
    importantLessons: [
      "You have to know when you are wrong and admit it quickly and without ego.",
      "Position sizing and risk management are far more important than exact entry and exit criteria.",
      "The best traders adapt to the market rather than forcing the market to adapt to them.",
      "Everyone gets what they want out of the market. Some get profits, others get excitement.",
      "Never risk more than 1% or 2% of your total account equity on any single trade.",
      "Cut your losses short and let your profits run. It's the golden rule of trading.",
      "Don't focus on making money; focus on protecting what you have.",
      "Good trading is boring. If you want excitement, go to Las Vegas.",
      "A trading system is only as good as the psychology of the trader executing it.",
      "There are a million ways to make money in markets. The irony is that they are all very difficult to find."
    ],
    color: "from-emerald-900/40 to-[#131b26]", border: "border-emerald-500/30", accentColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", spineBg: "bg-emerald-700",
  },
  {
    id: 4, title: "The Psychology of Money", author: "Morgan Housel", year: "2020", genre: "Behavioral Finance", rating: 5,
    coverImage: "/psychology/book_psychology_money.png", authorImage: null,
    description: "Housel argues that financial outcomes are driven more by behavior than intelligence. Nineteen short chapters, each a standalone insight into why smart people make poor financial decisions.",
    keyLesson: "Compounding requires staying in the game. Avoiding catastrophic mistakes matters more than optimising returns.",
    importantLessons: [
      "Wealth is what you don't see—it's the cars not purchased, the upgrades forgone.",
      "The highest form of wealth is the ability to wake up every morning and say, 'I can do whatever I want today.'",
      "Getting money requires taking risks, being optimistic, and putting yourself out there. Keeping money requires the opposite of taking risk.",
      "Compounding only works if you can give an asset years and years to grow.",
      "No one is crazy. Everyone makes financial decisions based on their own unique experiences and worldview.",
      "You can be wrong half the time and still make a fortune.",
      "Doing well with money has a little to do with how smart you are and a lot to do with how you behave.",
      "Planning is important, but the most important part of every plan is to plan on the plan not going according to plan.",
      "Use money to gain control over your time, because not having control of your time is a powerful and universal drag on happiness.",
      "Room for error is the most underappreciated force in finance. It comes in many forms: a frugal budget, flexible thinking, and a loose timeline."
    ],
    color: "from-blue-900/40 to-[#131b26]", border: "border-blue-500/30", accentColor: "text-blue-400",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30", spineBg: "bg-blue-700",
  },
  {
    id: 5, title: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: "2011", genre: "Behavioral Science", rating: 5,
    coverImage: "/psychology/book_thinking_fast_slow.png", authorImage: null,
    description: "Nobel laureate Kahneman's life work in one volume. System 1 (fast, emotional, instinctive) vs System 2 (slow, deliberate, rational). Every cognitive bias that destroys trading accounts is explained here with empirical rigour.",
    keyLesson: "Your intuitions about markets are almost entirely wrong. Slow, deliberate decision-making is the only antidote.",
    importantLessons: [
      "Loss Aversion: The pain of losing $1,000 is psychologically twice as intense as the joy of making $1,000.",
      "Confirmation Bias: We seek information that confirms our beliefs and ignore contradictory evidence.",
      "The Illusion of Validity: High confidence is often a sign that an individual has constructed a coherent story, not that the story is true.",
      "Sunk Cost Fallacy: It is irrational to factor past losses into current decisions.",
      "System 1 is fast, instinctive, and emotional; System 2 is slower, more deliberative, and more logical.",
      "Anchoring Effect: People rely too heavily on the first piece of information offered when making decisions.",
      "The Hindsight Bias: We tend to believe that past events were more predictable than they actually were.",
      "Overconfidence is a powerful source of illusions regarding financial markets.",
      "We are prone to overestimate how much we understand about the world and to underestimate the role of chance.",
      "By training System 2 and being aware of our cognitive biases, we can improve our decision-making."
    ],
    color: "from-rose-900/40 to-[#131b26]", border: "border-rose-500/30", accentColor: "text-rose-400",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30", spineBg: "bg-rose-700",
  },
  {
    id: 6, title: "The Disciplined Trader", author: "Mark Douglas", year: "1990", genre: "Psychology", rating: 4,
    coverImage: "/psychology/book_disciplined_trader.png", authorImage: "/psychology/author_mark_douglas.png",
    description: "Douglas's first book. More raw and personal than Trading in the Zone, it explains why the psychological environment of trading is unlike any other and why conventional success habits actively sabotage traders.",
    keyLesson: "Every loss teaches you something about your psychology. The market is the most honest mirror you will ever face.",
    importantLessons: [
      "Success in trading requires acquiring a state of mind that is disconnected from the typical social framework.",
      "A rule that you violate occasionally is not a rule; it is a suggestion.",
      "The more you attempt to control the market, the more chaotic it becomes.",
      "Fear of being wrong is the primary reason for making mistakes in trading.",
      "You must learn to trust yourself completely to do what needs to be done, when it needs to be done, without hesitation.",
      "Trading is a continuing exercise in self-control and emotional discipline.",
      "The market will always reflect your inner psychological state.",
      "To be a successful trader, you must embrace uncertainty and recognize that any given trade can fail.",
      "Your ability to be objective is directly proportional to how much you are willing to let go of your expectations.",
      "Mastery is not about predicting the market, it is about mastering yourself."
    ],
    color: "from-cyan-900/40 to-[#131b26]", border: "border-cyan-500/30", accentColor: "text-cyan-400",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", spineBg: "bg-cyan-700",
  },
];

const biases = [
  {
    id: 1,
    title: "FOMO (Fear of Missing Out)",
    description: "The overwhelming anxiety that a massive market move is happening without you. Causes traders to abandon their plan and buy at the absolute top.",
    trigger: "Seeing big green candles or watching others post huge gains online.",
    antidote: "Accept that the market provides infinite opportunities. Missing one train just means waiting at the station for the next one.",
    color: "from-rose-500/20", iconColor: "text-rose-400", border: "border-rose-500/30"
  },
  {
    id: 2,
    title: "Sunk Cost Fallacy",
    description: "Refusing to close a losing position because you have already invested so much money or time. 'If it comes back to break-even, I'll sell.'",
    trigger: "A position dropping 20%+ while you search for news to confirm your original thesis.",
    antidote: "The money is already gone. Ask yourself: 'Would I buy this asset right now at today's price?' If no, sell.",
    color: "from-amber-500/20", iconColor: "text-amber-400", border: "border-amber-500/30"
  },
  {
    id: 3,
    title: "Confirmation Bias",
    description: "Seeking out information that confirms your existing bias while completely ignoring facts that contradict it.",
    trigger: "Being heavily long and only clicking on bullish news articles.",
    antidote: "Actively play Devil's Advocate. Search for the strongest arguments for why your trade might be entirely wrong.",
    color: "from-blue-500/20", iconColor: "text-blue-400", border: "border-blue-500/30"
  },
  {
    id: 4,
    title: "Revenge Trading",
    description: "Immediately entering a new, higher-risk position right after suffering a painful loss to 'win it back' from the market.",
    trigger: "Hitting your stop loss and instantly hitting 'Buy' again with double size.",
    antidote: "The Tilt Protocol: Walk away from the screen for at least 30 minutes after a full stop-out.",
    color: "from-red-600/20", iconColor: "text-red-400", border: "border-red-500/30"
  },
  {
    id: 5,
    title: "Recency Bias",
    description: "Believing that whatever has been happening in the market recently will continue to happen indefinitely.",
    trigger: "A 5-day bull run making you believe the market will never go down again.",
    antidote: "Zoom out on the charts. Understand market cycles and mean reversion. The recent past does not permanently extrapolate.",
    color: "from-purple-500/20", iconColor: "text-purple-400", border: "border-purple-500/30"
  },
  {
    id: 6,
    title: "Endowment Effect",
    description: "Valuing an asset more highly simply because you own it. You wouldn't buy it today, but you refuse to sell it.",
    trigger: "Holding onto a stagnant or declining stock 'just in case' it becomes a winner.",
    antidote: "Value assets objectively based on current market conditions, not on what you paid for them.",
    color: "from-emerald-500/20", iconColor: "text-emerald-400", border: "border-emerald-500/30"
  }
];

const CATEGORIES = ["All", "Contrarian", "Risk", "Patience", "Discipline", "Mindset", "Strategy"];

// ─────────────────────────────────────────────────────────────────────────────
// Accent colour maps
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT: Record<string, { border: string; glow: string; tag: string; tagText: string; quoteNum: string; line: string }> = {
  amber:  { border: "border-amber-500/25",  glow: "shadow-amber-500/10",  tag: "bg-amber-500/15",  tagText: "text-amber-300",  quoteNum: "text-amber-500/20",  line: "bg-amber-500/40" },
  blue:   { border: "border-blue-500/25",   glow: "shadow-blue-500/10",   tag: "bg-blue-500/15",   tagText: "text-blue-300",   quoteNum: "text-blue-500/20",   line: "bg-blue-500/40" },
  emerald:{ border: "border-emerald-500/25",glow: "shadow-emerald-500/10",tag: "bg-emerald-500/15",tagText: "text-emerald-300",quoteNum: "text-emerald-500/20",line: "bg-emerald-500/40" },
  rose:   { border: "border-rose-500/25",   glow: "shadow-rose-500/10",   tag: "bg-rose-500/15",   tagText: "text-rose-300",   quoteNum: "text-rose-500/20",   line: "bg-rose-500/40" },
  violet: { border: "border-violet-500/25", glow: "shadow-violet-500/10", tag: "bg-violet-500/15", tagText: "text-violet-300", quoteNum: "text-violet-500/20", line: "bg-violet-500/40" },
  orange: { border: "border-orange-500/25", glow: "shadow-orange-500/10", tag: "bg-orange-500/15", tagText: "text-orange-300", quoteNum: "text-orange-500/20", line: "bg-orange-500/40" },
  teal:   { border: "border-teal-500/25",   glow: "shadow-teal-500/10",   tag: "bg-teal-500/15",   tagText: "text-teal-300",   quoteNum: "text-teal-500/20",   line: "bg-teal-500/40" },
  cyan:   { border: "border-cyan-500/25",   glow: "shadow-cyan-500/10",   tag: "bg-cyan-500/15",   tagText: "text-cyan-300",   quoteNum: "text-cyan-500/20",   line: "bg-cyan-500/40" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} className={`w-3 h-3 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
    ))}
  </div>
);

const AuthorAvatar: React.FC<{ src: string | null; name: string; size?: 'sm' | 'md' | 'lg' }> = ({ src, name, size = 'md' }) => {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-lg' }[size];
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={name} className={`${sz} rounded-full object-cover border-2 border-white/15 shadow-xl flex-shrink-0`} />
  ) : (
    <div className={`${sz} rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white/10 flex items-center justify-center font-bold text-white/70 shadow-xl flex-shrink-0 tracking-wider`}>
      {initials}
    </div>
  );
};

// Hero quote card — full width, large editorial
const HeroQuoteCard: React.FC<{ q: typeof quotes[0] }> = ({ q }) => {
  const ac = ACCENT[q.accentClass] || ACCENT.amber;
  return (
    <div className={`relative rounded-2xl border ${ac.border} bg-[#0f1520]/80 backdrop-blur-xl overflow-hidden shadow-2xl ${ac.glow} transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:-translate-y-1`}>
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.03),transparent_60%)]" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      
      {/* Left accent bar */}
      <div className={`absolute left-0 top-8 bottom-8 w-0.5 ${ac.line} rounded-full`} />

      <div className="relative p-8 md:p-10">
        {/* Top row */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded ${ac.tag} ${ac.tagText}`}>
            {q.category}
          </span>
          <div className="flex items-center gap-1.5 text-slate-300 font-bold bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {q.year}
          </div>
        </div>

        {/* Large decorative quote mark */}
        <div className={`font-serif text-[120px] leading-none select-none absolute top-6 right-8 ${ac.quoteNum} pointer-events-none`}>"</div>

        {/* Quote text */}
        <blockquote className="relative z-10 mb-8">
          <p className="text-2xl md:text-3xl font-light text-white leading-snug tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            "{q.text}"
          </p>
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-4">
          <AuthorAvatar src={q.avatar} name={q.author} size="lg" />
          <div>
            <p className="font-bold text-white text-base">{q.author}</p>
            <p className="text-slate-400 text-sm">{q.role}</p>
            <p className="text-slate-600 text-xs mt-0.5 italic">{q.source}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Large quote — half-width
const LargeQuoteCard: React.FC<{ q: typeof quotes[0] }> = ({ q }) => {
  const ac = ACCENT[q.accentClass] || ACCENT.blue;
  return (
    <div className={`relative rounded-2xl border ${ac.border} bg-[#0f1520]/70 backdrop-blur-md overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 h-full group`}>
      <div className={`absolute left-0 top-6 bottom-6 w-0.5 ${ac.line} rounded-full transition-all duration-500 group-hover:w-1 group-hover:shadow-[0_0_12px_currentColor]`} style={{ color: ac.line.includes('emerald') ? '#10b981' : ac.line.includes('amber') ? '#f59e0b' : '#3b82f6' }} />
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.015] rounded-full blur-2xl pointer-events-none group-hover:bg-white/[0.03] transition-colors duration-500" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className={`text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded ${ac.tag} ${ac.tagText}`}>{q.category}</span>
          <span className="text-slate-300 font-bold bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 text-[10px] shadow-sm">{q.year}</span>
        </div>
        
        <div className={`font-serif text-7xl leading-none select-none absolute top-4 right-5 ${ac.quoteNum} pointer-events-none`}>"</div>

        <blockquote className="mb-5 pr-6">
          <p className="text-base text-white/90 leading-relaxed font-light" style={{ fontFamily: 'Georgia, serif' }}>
            "{q.text}"
          </p>
        </blockquote>

        <div className="flex items-center gap-3 border-t border-white/5 pt-4">
          <AuthorAvatar src={q.avatar} name={q.author} size="sm" />
          <div>
            <p className="text-sm font-semibold text-white/85">{q.author}</p>
            <p className="text-xs text-slate-500">{q.role}</p>
            <p className="text-[10px] text-slate-700 italic">{q.source}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small compact quote card
const SmallQuoteCard: React.FC<{ q: typeof quotes[0] }> = ({ q }) => {
  const ac = ACCENT[q.accentClass] || ACCENT.amber;
  return (
    <div className={`relative rounded-xl border ${ac.border} bg-[#0f1520]/60 backdrop-blur-sm overflow-hidden shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#0f1520]/90 group`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${ac.line} transition-all duration-300 group-hover:h-1`} />
      
      <div className="p-4 relative">
        <div className="flex items-start justify-between mb-3 relative z-10">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded ${ac.tag} ${ac.tagText} whitespace-nowrap`}>{q.category}</span>
          <span className="text-slate-300 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-[9px] whitespace-nowrap ml-2 shadow-sm">{q.year}</span>
        </div>
        
        <blockquote className="mb-3">
          <p className="text-sm text-white/85 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            "{q.text}"
          </p>
        </blockquote>

        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
          <AuthorAvatar src={q.avatar} name={q.author} size="sm" />
          <div>
            <p className="text-xs font-semibold text-white/80 leading-tight">{q.author}</p>
            <p className="text-[10px] text-slate-600">{q.source}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const IRON_RULES = [
  "Never average down a losing options position.",
  "Process over outcome; judge the trade by the execution of your plan.",
  "Your job is to manage risk, profits will manage themselves.",
  "Cut your losses short, let your winners run.",
  "If you cannot accept the specific risk of a trade, do not take it.",
  "Boredom is not a valid reason to enter the market.",
  "A single trade should never dictate the trajectory of your trading career.",
  "The market can remain irrational much longer than you can remain solvent.",
  "Hope is not a valid trading strategy."
];

const TradingPsychology: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'quotes' | 'articles' | 'books' | 'biases'>('quotes');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [expandedBook, setExpandedBook] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const todayIndex = new Date().getDate() % IRON_RULES.length;
  const ruleOfTheDay = IRON_RULES[todayIndex];

  const filtered = quotes.filter(q => {
    const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
    const matchSearch = !searchQuery || q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Partition quotes by size
  const hero = filtered.find(q => q.size === 'hero');
  const large = filtered.filter(q => q.size === 'large');
  const normals = filtered.filter(q => q.size === 'normal');
  const smalls = filtered.filter(q => q.size === 'small');

  const filteredArticles = articles.filter(a => {
    const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredBooks = books.filter(b =>
    !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* ── Daily Iron Rule Banner ── */}
      <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#0f1520] via-amber-900/10 to-[#0f1520] shadow-[0_0_30px_rgba(245,158,11,0.08)] overflow-hidden group hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] transition-all duration-500">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        <div className="absolute top-1/2 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-20 px-6 py-5 md:py-6 flex flex-col md:flex-row items-start md:items-center gap-5">
           <div className="shrink-0 w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <ShieldAlert className="w-6 h-6 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
           </div>
           <div>
              <div className="flex items-center gap-2 mb-1.5">
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500" style={{ letterSpacing: '0.3em' }}>Rule of the Day</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
                 "{ruleOfTheDay}"
              </h2>
           </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <div className="absolute inset-0 bg-[#0f1520]/90 backdrop-blur-2xl" />
        <div className="absolute top-0 right-0 w-96 h-64 bg-emerald-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-64 bg-emerald-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative px-8 py-7">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="p-3.5 bg-violet-500/15 rounded-2xl border border-violet-500/25 shadow-[0_0_24px_rgba(139,92,246,0.15)]">
              <Brain className="w-9 h-9 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Trading <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400">Psychology</span>
                </h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/25 text-violet-400 tracking-[0.2em] uppercase">Mind Lab</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                Curated wisdom from the world's greatest traders — sourced quotes, deep-dive articles, and essential reading to master the mental game.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: "Sourced Quotes", value: quotes.length, icon: Quote, color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/15" },
              { label: "Deep Articles", value: articles.length, icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
              { label: "Essential Books", value: books.length, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/15" },
            ].map(kpi => {
              const K = kpi.icon;
              return (
                <div key={kpi.label} className={`flex items-center gap-3 p-3 rounded-xl border ${kpi.bg}`}>
                  <K className={`w-4 h-4 ${kpi.color} shrink-0`} />
                  <div>
                    <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-slate-600">{kpi.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-[#0f1520]/80 backdrop-blur-md border border-emerald-500/15 p-1 rounded-xl gap-1 shrink-0 shadow-lg">
          {(['quotes', 'articles', 'books', 'biases'] as const).map(tab => {
            const icons = { quotes: Quote, articles: Lightbulb, books: BookOpen, biases: BrainCircuit };
            const labels = { quotes: 'Wisdom Quotes', articles: 'Articles', books: 'Books', biases: 'Mental Models' };
            const T = icons[tab];
            return (
              <button key={tab} onClick={() => setActiveSection(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeSection === tab
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-emerald-500/10 border border-transparent'
                }`}>
                <T className="w-3.5 h-3.5" />{labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
          <input type="text" placeholder="Search by quote, author, or source…" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1520]/80 backdrop-blur-md border border-emerald-500/20 text-emerald-50 text-sm rounded-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none placeholder-slate-500 transition-all shadow-lg"
          />
        </div>
      </div>

      {/* Category filter */}
      {activeSection !== 'books' && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-emerald-500/50 shrink-0" />
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-[11px] font-bold rounded-full border transition-all duration-300 shadow-sm ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-[#0f1520]/60 backdrop-blur-sm border-emerald-500/10 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-200 hover:bg-[#0f1520]/90'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ════ QUOTES — editorial magazine layout ════ */}
      {activeSection === 'quotes' && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-600">
              <Quote className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No quotes match your search or filter.</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Hero */}
              {hero && <HeroQuoteCard q={hero} />}

              {/* Large + first two normals */}
              {(large.length > 0 || normals.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {large.map(q => <LargeQuoteCard key={q.id} q={q} />)}
                  {normals.slice(0, Math.max(0, 2 - large.length)).map(q => <LargeQuoteCard key={q.id} q={q} />)}
                </div>
              )}

              {/* Remaining normals in 2-col */}
              {normals.slice(Math.max(0, 2 - large.length)).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {normals.slice(Math.max(0, 2 - large.length)).map(q => <LargeQuoteCard key={q.id} q={q} />)}
                </div>
              )}

              {/* Smalls — 3 per row */}
              {smalls.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {smalls.map(q => <SmallQuoteCard key={q.id} q={q} />)}
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* ════ ARTICLES ════ */}
      {activeSection === 'articles' && (
        <div className="space-y-6">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20 text-slate-600">
              <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No articles match.</p>
            </div>
          ) : expandedArticle !== null ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(() => {
                const article = articles.find(a => a.id === expandedArticle)!;
                return (
                  <div className={`rounded-3xl border ${article.border} bg-[#0f1520]/90 backdrop-blur-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative`}>
                    <button onClick={() => setExpandedArticle(null)} className="absolute top-6 right-6 z-30 w-12 h-12 bg-black/50 backdrop-blur-xl rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 hover:scale-105 transition-all border border-white/20 shadow-xl cursor-pointer">
                       <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    
                    {/* Hero Image Block */}
                    <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden shrink-0">
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0f1520] via-[#0f1520]/50 to-transparent z-10" />
                       <div className="absolute inset-0 bg-[#0f1520]/20 z-10" />
                       <img src={article.image} alt={article.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000" />
                       
                       <div className="absolute bottom-10 left-6 md:left-12 z-20 md:pr-12">
                         <div className="flex items-center gap-3 mb-5 flex-wrap">
                           <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg ${article.tagBg} border border-white/10`}>{article.category}</span>
                           <span className="text-xs font-bold text-white/70 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">{article.readTime}</span>
                         </div>
                         <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-2 tracking-tight drop-shadow-2xl">{article.title}</h2>
                       </div>
                    </div>
                    
                    {/* Reader Content Setup */}
                    <div className="px-6 md:px-12 py-12 max-w-4xl mx-auto">
                      <p className="text-xl md:text-2xl font-light text-slate-300 leading-relaxed mb-12 italic border-l-4 border-emerald-500/50 pl-6 opacity-90" style={{ fontFamily: 'Georgia, serif' }}>
                        {article.excerpt}
                      </p>
                      
                      <div className="space-y-8">
                        {article.content.split('\n\n').map((para, i) => {
                          if (para.startsWith('**') && para.endsWith('**')) {
                            return <h4 key={i} className={`text-xl md:text-2xl font-bold ${article.accentColor} mt-14 mb-5 tracking-tight flex items-center gap-3`}><div className={`w-2 h-2 rounded-full bg-current opacity-70`} />{para.replace(/\*\*/g, '')}</h4>;
                          }
                          return (
                            <p key={i} className="text-lg md:text-xl text-slate-300/90 leading-[1.85] font-normal" style={{ fontFamily: 'Georgia, serif' }}>
                              {para.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                                part.startsWith('**') ? <strong key={j} className="text-emerald-50 font-semibold">{part.replace(/\*\*/g, '')}</strong> : part
                              )}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
              {filteredArticles.map(article => (
                <div key={article.id} className={`group relative rounded-3xl border ${article.border} bg-[#0f1520]/70 backdrop-blur-xl overflow-hidden shadow-xl hover:shadow-[0_15px_40px_rgba(16,185,129,0.2)] hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full`} onClick={() => setExpandedArticle(article.id)}>
                   <div className="relative h-56 w-full overflow-hidden shrink-0">
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0f1520] to-transparent z-10" />
                     <img src={article.image} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out" />
                     <div className="absolute top-4 left-4 z-20">
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/10 shadow-lg ${article.tagBg} backdrop-blur-md`}>{article.category}</span>
                     </div>
                   </div>
                   
                   <div className="p-6 md:p-8 flex flex-col flex-1 relative z-20">
                     <h3 className={`text-2xl font-bold text-white mb-4 group-hover:${article.accentColor} transition-colors tracking-tight leading-snug`}>{article.title}</h3>
                     <p className="text-sm md:text-base text-slate-400 leading-relaxed flex-1 mb-8 opacity-90">{article.excerpt}</p>
                     
                     <div className="flex items-center justify-between border-t border-emerald-500/10 pt-5 mt-auto pb-1">
                       <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">{article.readTime}</span>
                       <div className="flex items-center gap-2 text-sm font-black text-white group-hover:text-emerald-400 transition-colors bg-white/5 group-hover:bg-emerald-500/10 px-4 py-2 rounded-full border border-white/5">
                         Read Article <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                       </div>
                     </div>
                   </div>
                   
                   {/* Hover Glow Background Element */}
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════ BOOKS ════ */}
      {activeSection === 'books' && (
        <div className="space-y-6">
          {filteredBooks.length === 0 ? (
             <div className="text-center py-20 text-slate-600 w-full">
               <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
               <p className="text-sm">No books match.</p>
             </div>
          ) : expandedBook !== null ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(() => {
                const book = books.find(b => b.id === expandedBook)!;
                return (
                  <div className={`rounded-3xl border ${book.border} bg-[#0f1520]/90 backdrop-blur-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative`}>
                    
                    {/* Background glows */}
                    <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${book.color} opacity-40 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none`} />
                    <div className={`absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr ${book.color} opacity-20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none`} />
                    
                    <button onClick={() => setExpandedBook(null)} className="absolute top-6 right-6 z-30 w-12 h-12 bg-black/50 backdrop-blur-xl rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 hover:scale-105 transition-all border border-white/20 shadow-xl cursor-pointer">
                       <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    
                    <div className="flex flex-col lg:flex-row relative z-10">
                      {/* Left: Book Cover Immersive Area */}
                      <div className="w-full lg:w-[40%] xl:w-[35%] py-16 px-10 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 shrink-0">
                         <div className="relative w-48 md:w-56 mb-8 shadow-[20px_20px_40px_rgba(0,0,0,0.8)] transform -rotate-y-12 perspective-1000 rotate-2">
                           <div className={`absolute left-0 top-0 bottom-0 w-3 ${book.spineBg} z-20 brightness-75 border-r border-black/30 shadow-[inset_-3px_0_6px_rgba(0,0,0,0.6)]`} />
                           <img src={book.coverImage} alt={book.title} className="w-full object-cover rounded-md border border-white/20" />
                           <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10 z-10 pointer-events-none" />
                         </div>
                         
                         <div className="flex flex-col items-center text-center mt-2">
                           <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">{book.title}</h2>
                           <div className="flex items-center gap-3 bg-white/[0.03] p-2 pr-5 rounded-full border border-white/10 shadow-lg">
                             <AuthorAvatar src={book.authorImage} name={book.author} size="md" />
                             <div className="text-left">
                               <p className="text-sm font-bold text-slate-200">{book.author}</p>
                               <p className={`text-[10px] font-black tracking-widest uppercase ${book.accentColor}`}>Author</p>
                             </div>
                           </div>
                         </div>
                      </div>
                      
                      {/* Right: Key Lessons & Info */}
                      <div className="flex-1 p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-8">
                           <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg ${book.badgeColor} backdrop-blur-md`}>{book.genre}</span>
                           <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">{book.year}</span>
                           <div className="ml-auto"><StarRating rating={book.rating} /></div>
                        </div>
                        
                        <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10 opacity-90 font-light border-l-4 border-slate-700 pl-5">
                          {book.description}
                        </p>
                        
                        <h4 className="text-xl font-black text-white my-6 flex items-center gap-3 border-b border-white/10 pb-4">
                          <BookOpen className={`w-5 h-5 ${book.accentColor}`} /> Most Important Lessons
                        </h4>
                        
                        <ul className="space-y-5">
                          {(book.importantLessons as string[]).map((lesson, idx) => (
                            <li key={idx} className="flex pl-1">
                              <span className={`font-serif text-3xl md:text-4xl leading-none mt-1 mr-4 opacity-50 ${book.accentColor}`}>"</span>
                              <p className="text-base md:text-lg text-slate-200 leading-[1.7] italic mt-2" style={{ fontFamily: 'Georgia, serif' }}>
                                {lesson}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {filteredBooks.map(book => (
                <div key={book.id} onClick={() => setExpandedBook(book.id)} className={`group relative rounded-3xl border ${book.border} bg-[#0f1520]/80 backdrop-blur-2xl overflow-hidden shadow-xl hover:shadow-[0_15px_40px_rgba(16,185,129,0.15)] hover:-translate-y-2 transition-all duration-500 cursor-pointer`}>
                  {/* Dynamic ambient glow behind the card */}
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${book.color} opacity-0 group-hover:opacity-60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 transition-all duration-700 pointer-events-none`} />
                  
                  <div className="flex h-full p-2 gap-5 md:gap-6 relative z-10">
                    {/* Book Cover Container with 3D Effect */}
                    <div className="relative shrink-0 w-32 md:w-36 pt-4 pl-4 pb-4">
                       <div className="relative h-full w-full shadow-[10px_10px_25px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden group-hover:scale-105 group-hover:-rotate-y-12 group-hover:rotate-6 transition-all duration-700 transform perspective-1000 border border-white/10 group-hover:border-white/20">
                         <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${book.spineBg} z-20 brightness-75 border-r border-black/30 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.5)]`} />
                         <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-white/5 z-10 pointer-events-none" />
                         <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/2 z-10 pointer-events-none" />
                         <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover rounded-sm" style={{ minHeight: '220px' }} />
                       </div>
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 py-5 pr-5 flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded shadow-sm border ${book.badgeColor} backdrop-blur-md`}>{book.genre}</span>
                          </div>
                          <h3 className={`text-lg md:text-xl font-bold text-white leading-tight group-hover:${book.accentColor} transition-colors tracking-tight drop-shadow-md`}>{book.title}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3 shrink-0 self-start">
                        <AuthorAvatar src={book.authorImage} name={book.author} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-slate-200">{book.author}</p>
                          <p className={`text-[9px] font-black tracking-widest uppercase ${book.accentColor}`}>Author</p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-400/90 leading-relaxed flex-1 mb-4 line-clamp-2">{book.description}</p>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                        <div className={`text-[11px] font-bold ${book.accentColor} uppercase tracking-wider`}>Click to open insights</div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 group-hover:${book.badgeColor} transition-colors border border-white/10`}>
                           <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer strip ── */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#0f1520]/80 backdrop-blur-lg p-6 text-center shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent mx-auto mb-4" />
        <p className="text-emerald-50/80 text-sm max-w-2xl mx-auto leading-relaxed italic" style={{ fontFamily: 'Georgia, serif' }}>
          "The game of speculation is the most uniformly fascinating game in the world. But it is not a game for the stupid, the mentally lazy, the person of inferior emotional balance, or the get-rich-quick adventurer."
        </p>
        <p className="text-xs text-emerald-500/60 mt-3 font-semibold tracking-wide uppercase">— Jesse Livermore, Reminiscences of a Stock Operator (1923)</p>
      </div>

      {/* ════ BIASES (MENTAL MODELS) ════ */}
      {activeSection === 'biases' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {biases.map(bias => (
            <div key={bias.id} className="group h-[320px] w-full cursor-pointer" style={{ perspective: '1000px' }}>
              <div 
                className="relative w-full h-full transition-transform duration-700" 
                style={{ transformStyle: 'preserve-3d' }}
              >
                
                {/* Front of Card */}
                <div 
                  className={`absolute w-full h-full rounded-3xl border ${bias.border} bg-[#0f1520]/80 backdrop-blur-xl p-8 flex flex-col items-center text-center shadow-lg group-hover:-rotate-y-180 transition-transform duration-700`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${bias.color} p-[1px] mb-6 shadow-inner`}>
                    <div className="w-full h-full bg-[#0a0e17] rounded-[15px] flex items-center justify-center">
                       <BrainCircuit className={`w-8 h-8 ${bias.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3 tracking-tight drop-shadow-md">{bias.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium line-clamp-4">{bias.description}</p>
                  
                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hover to reveal antidote</p>
                  </div>
                </div>

                {/* Back of Card (The Antidote) */}
                <div 
                  className={`absolute w-full h-full rounded-3xl border ${bias.border} bg-gradient-to-br from-[#0f1520] to-[#0a0e17] p-8 flex flex-col shadow-[0_0_40px_rgba(16,185,129,0.1)] group-hover:rotate-y-0 transition-transform duration-700`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />
                   
                   <div className="mb-5 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-2 block">The Trigger</span>
                     <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-rose-500/50 pl-3">"{bias.trigger}"</p>
                   </div>
                   
                   <div className="flex-1">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2 flex items-center gap-1.5">
                       <ShieldAlert className="w-3.5 h-3.5" /> The Antidote
                     </span>
                     <p className="text-base text-white/95 leading-[1.6] font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                       {bias.antidote}
                     </p>
                   </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default TradingPsychology;
