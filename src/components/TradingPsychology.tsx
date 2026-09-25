import React, { useState } from 'react';
import {
  BookOpen, Quote, Brain, Star, ChevronRight,
  Lightbulb, Search, Filter, Calendar, ShieldAlert,
  BrainCircuit, Check, Copy, RefreshCw, Compass,
  Sparkles, ShieldCheck, AlertTriangle, ArrowRight,
  ExternalLink, Bookmark, CheckCircle2, XCircle
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Real, iconic, sourced quotes from legendary traders & investors
// ─────────────────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: number;
  text: string;
  author: string;
  role: string;
  source: string;
  category: string;
  accentClass: 'gold' | 'sky' | 'emerald' | 'rose' | 'slate';
  avatar: string | null;
  size: 'hero' | 'large' | 'normal' | 'small';
  year: string;
}

const quotes: QuoteItem[] = [
  {
    id: 1,
    text: "Be fearful when others are greedy, and greedy when others are fearful.",
    author: "Warren Buffett",
    role: "Chairman & CEO, Berkshire Hathaway",
    source: "Shareholder Letter, 2004",
    category: "Contrarian",
    accentClass: "gold",
    avatar: "/psychology/author_warren_buffett.png",
    size: "hero",
    year: "2004",
  },
  {
    id: 2,
    text: "The market can remain irrational longer than you can remain solvent.",
    author: "John Maynard Keynes",
    role: "Economist & Market Speculator",
    source: "Attributed — Cambridge & Wall St. Canon",
    category: "Risk",
    accentClass: "sky",
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
    accentClass: "gold",
    avatar: "/psychology/author_george_soros.png",
    size: "normal",
    year: "1987",
  },
  {
    id: 5,
    text: "The four most dangerous words in investing are: 'This time it's different.'",
    author: "Sir John Templeton",
    role: "Pioneer of Global Value Investing",
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
    role: "Legendary Speculator & Market Pioneer",
    source: "Reminiscences of a Stock Operator, 1923",
    category: "Patience",
    accentClass: "gold",
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
    accentClass: "sky",
    avatar: null,
    size: "small",
    year: "1989",
  },
  {
    id: 8,
    text: "The trend is your friend until the end when it bends.",
    author: "Ed Seykota",
    role: "Pioneer of Systematic Trend Trading",
    source: "Market Wizards, Jack Schwager, 1989",
    category: "Discipline",
    accentClass: "emerald",
    avatar: "/psychology/author_ed_seykota.png",
    size: "small",
    year: "1989",
  },
  {
    id: 9,
    text: "In this business, if you're good, you're right six times out of ten. You're never going to be right nine times out of ten.",
    author: "Peter Lynch",
    role: "Legendary Manager, Fidelity Magellan",
    source: "One Up on Wall Street, 1989",
    category: "Mindset",
    accentClass: "slate",
    avatar: null,
    size: "normal",
    year: "1989",
  },
  {
    id: 10,
    text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
    author: "Philip Fisher",
    role: "Author & Father of Growth Investing",
    source: "Common Stocks and Uncommon Profits, 1958",
    category: "Contrarian",
    accentClass: "sky",
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
    accentClass: "gold",
    avatar: "/psychology/author_warren_buffett.png",
    size: "small",
    year: "1993",
  },
  {
    id: 12,
    text: "Markets are never wrong — opinions often are.",
    author: "Jesse Livermore",
    role: "Legendary Speculator & Market Pioneer",
    source: "How to Trade in Stocks, 1940",
    category: "Discipline",
    accentClass: "gold",
    avatar: "/psychology/author_jesse_livermore.png",
    size: "small",
    year: "1940",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Articles
// ─────────────────────────────────────────────────────────────────────────────

interface ArticleItem {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  image: string;
  author: string;
  content: string;
}

const articles: ArticleItem[] = [
  {
    id: 1,
    title: "The Neurobiology of Fear and Greed in Modern Markets",
    excerpt: "Two primal survival circuits dictate every market cycle. Deconstructing amygdala hijacking and dopamine fatigue is the only durable edge an active trader can cultivate.",
    category: "Emotion Control",
    readTime: "6 min read",
    author: "PaperProfit Research",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    content: `Fear and greed are the twin engines that power every market cycle. When fear dominates, prices disconnect below intrinsic value. When greed takes hold, they soar far past reasonable expectations. The institutional trader's edge lies not in predicting the future, but in diagnosing crowd emotion while maintaining absolute composure.

**The Fear Cycle & Amygdala Hijack:**
When a position turns negative, the brain's amygdala — the biological seat of fight-or-flight — activates. Cortisol surges into the bloodstream, restricting blood flow to the prefrontal cortex where probabilistic reasoning occurs. The instinctual urge is to freeze or hold the loss in the irrational hope that price returns to break-even. Kahneman and Tversky documented this as loss aversion: the emotional agony of a ₹10,000 loss is felt twice as acutely as the satisfaction of a ₹10,000 gain.

**The Greed Trap & Dopamine Depletion:**
A series of winning trades floods the nucleus accumbens with dopamine. This creates a state of psychological euphoria where risk sensitivity collapses. Traders oversize positions, widen stop-losses, and abandon execution criteria, falsely attributing market generosity to personal genius. Almost every catastrophic account drawdown begins immediately after an all-time equity high.

**The Professional Antidote:**
1. Hard stop-loss placement at the instant of order entry, entered into the broker system rather than kept as a 'mental' stop.
2. The 30-Minute Tilt Protocol: If two consecutive stop-outs occur in the same morning session, step away from trading terminals entirely.
3. Quantified position sizing: never risk more than 1% to 1.5% of total liquid equity on any individual options or stock execution.`,
  },
  {
    id: 2,
    title: "The Sunk Cost Fallacy: Why Traders Marry Losing Positions",
    excerpt: "Why the human ego finds it nearly impossible to accept being wrong, and how shifting from 'right vs wrong' to 'expectancy' liberates capital and mental energy.",
    category: "Cognitive Bias",
    readTime: "5 min read",
    author: "PaperProfit Research",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    content: `The sunk cost fallacy is the cognitive glitch where past expenditures of money, time, or emotional energy justify continuing a failed commitment. In trading, it is the root cause of every blown-up account.

**The Psychological Anatomy of Sunk Cost:**
When an option contract loses 40% of its value, holding it requires acknowledging a mistake. Selling locks in that admission to your ego. To avoid that psychological wound, the brain rationalizes: "It's only a paper loss," or "Earnings are in three weeks, it could bounce." You begin scouring Twitter and news feeds for bullish confirmation bias while disregarding the deteriorating tape.

**The Clean Slate Exercise:**
Every morning, look at your open positions and ask one ruthless question: "If I held 100% cash right now, would I buy this position at current prices with fresh money?" If the answer is anything less than an emphatic yes, liquidate immediately. What was paid for the asset has zero influence on where the market goes next. The market does not know your purchase price, nor does it care.

**Practical Framework:**
Capital preservation is your primary job description. Profit generation is merely a secondary byproduct. A small loss is an operational cost of doing business; an unattended loss is a terminal risk.`,
  },
  {
    id: 3,
    title: "Process Over Outcome: The Professional Probabilistic Mindset",
    excerpt: "Amateurs judge decisions strictly by their outcome; master operators judge decisions solely by the rigor of their process. Here is how to make that paradigm shift.",
    category: "Trading Mindset",
    readTime: "7 min read",
    author: "PaperProfit Research",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    content: `Annie Duke, professional poker champion and cognitive decision scientist, terms the tendency to judge decision quality by its immediate result "resulting." In stochastic environments like options trading, good decisions frequently produce losses, and reckless decisions occasionally produce windfalls.

**The Fatal Resulting Trap:**
Imagine buying zero-day-to-expiry Out-of-the-Money calls 10 minutes before market close without any quantifiable edge. A sudden news headline spikes the index and you make 300%. If you celebrate this as a "great trade," your subconscious mind reinforces a destructive behavior that will eventually wipe out your portfolio on the next ten attempts.

Conversely, executing a textbook high-probability breakout with defined 1:2 risk-reward that gets stopped out by an unexpected macroeconomic headline is a flawless trade. You executed your edge perfectly.

**Developing Process Conviction:**
- Evaluate your performance across batches of 30 trades rather than on a trade-by-trade emotional roller coaster.
- Grade yourself not on daily P&L, but on Execution Discipline: Did you honor your stop? Did you size correctly? Did you wait for confirmation?
- Consistency is not the absence of losing trades; it is the presence of an unbreakable operational system.`,
  },
  {
    id: 4,
    title: "The Art of Inaction: Why Sitting on Cash is an Active Position",
    excerpt: "Patience is not the absence of trading; it is the disciplined preservation of ammunition for asymmetrical opportunities. Master the virtue of doing nothing.",
    category: "Patience",
    readTime: "4 min read",
    author: "PaperProfit Research",
    image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80",
    content: `Jesse Livermore's most famous axiom remains his most ignored: "It was never my thinking that made the big money for me. It was always my sitting." Modern trading terminals with real-time flashing ticks and instant mobile order entry create an overwhelming bias toward action.

**The Hyperactivity Hazard:**
Retail traders treat market hours like an arcade game, believing that if they are sitting before a screen, they must execute trades to generate a return. In reality, high-probability asymmetrical trades occur only a fraction of the time. Forcing trades during chop and low-volume consolidation simply subsidizes broker commissions and pays bid-ask spreads.

**Cash as an Asymmetric Call Option:**
Holding 30% to 50% cash during volatile, directionless, or overextended markets gives you immense psychological tranquility. Cash is not dead money; it is a perpetual call option on every future market dislocation without an expiration date.

**The Punch-Card Mental Model:**
Warren Buffett suggests imagining you hold a punch card with only 20 holes for your entire investing career. Each trade punches a hole. When your opportunities are finite, you wait patiently for the fat pitches. Waiting is active discipline, and it remains the single highest-paying skill in financial markets.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

interface BookItem {
  id: number;
  title: string;
  author: string;
  year: string;
  genre: string;
  rating: number;
  coverImage: string;
  authorImage: string | null;
  description: string;
  keyLesson: string;
  importantLessons: string[];
  theme: {
    accentText: string;
    badgeBg: string;
    border: string;
    spineColor: string;
    coverGradient: string;
  };
}

const books: BookItem[] = [
  {
    id: 1,
    title: "Trading in the Zone",
    author: "Mark Douglas",
    year: "2000",
    genre: "Psychology",
    rating: 5,
    coverImage: "/psychology/book_trading_zone.png",
    authorImage: "/psychology/author_mark_douglas.png",
    description: "The universally acknowledged holy grail of market psychology. Douglas meticulously explains why technical knowledge never guarantees consistent results, and outlines the probabilistic framework required to master risk without fear.",
    keyLesson: "Think in probabilities, never certainties. Any individual trade is just one random sample from a large distribution.",
    importantLessons: [
      "The market is a probabilistic environment; no single trade determines your ultimate career trajectory.",
      "Accept the risk completely before you enter any trade to eliminate emotional distress and anxiety.",
      "Build a sample size of at least 20 trades to judge your edge, rather than reacting to individual trade outcomes.",
      "An edge is nothing more than an indication of a higher probability of one outcome occurring over another.",
      "If you can create a state of mind that is impervious to market fluctuation, internal struggle ceases.",
      "Elite operators stay in the flow of the tape because they do not perceive market movement as a personal threat.",
      "You do not need to know what will happen next in order to consistently make money.",
      "There is a random distribution between wins and losses for any set of technical variables.",
      "When you genuinely accept the financial risk, you remain entirely at peace with whichever outcome unfolds.",
      "Consistency requires accepting 100% responsibility for your decisions without blaming the market, news, or algorithms."
    ],
    theme: {
      accentText: "text-amber-300",
      badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/25",
      border: "border-amber-500/30",
      spineColor: "bg-gradient-to-b from-amber-700 to-amber-900",
      coverGradient: "from-amber-950/80 via-[#0e1422] to-[#070b13]",
    },
  },
  {
    id: 2,
    title: "Reminiscences of a Stock Operator",
    author: "Edwin Lefèvre",
    year: "1923",
    genre: "Biography",
    rating: 5,
    coverImage: "/psychology/book_reminiscences.png",
    authorImage: "/psychology/author_jesse_livermore.png",
    description: "A thinly veiled biography of Jesse Livermore. Over a century old, every psychological lesson on crowd psychology, patience, leverage, and hubris remains completely unchanged in modern electronic markets.",
    keyLesson: "Human nature does not change. Therefore, price action and market cycles repeat in every generation.",
    importantLessons: [
      "It was never my thinking that made the big money for me. It was always my sitting. Patience is ultimate power.",
      "Markets are never wrong; human opinions and personal convictions frequently are.",
      "Never average losing positions. Averaging down is the universal hallmark of an amateur gambler.",
      "The true trend reveals itself well before macroeconomic headlines justify it.",
      "There is nothing new on Wall Street. Whatever happens today has occurred in past cycles and will happen again.",
      "A disciplined loss taken promptly never bothers me. But hesitating and nursing a loss destroys capital and spirit.",
      "The game of speculation is the most fascinating game on earth, but it has no forgiveness for lack of discipline.",
      "Watch the leading stocks—those exhibiting greatest relative strength will dictate the broad market trajectory.",
      "Do not try to capture every minor fluctuation. Wait patiently for the major structural shifts.",
      "Losing money is the least of my troubles; failing to adhere to my system is what causes irreversible damage."
    ],
    theme: {
      accentText: "text-amber-400",
      badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      border: "border-amber-500/30",
      spineColor: "bg-gradient-to-b from-amber-800 to-stone-900",
      coverGradient: "from-amber-900/40 via-[#101726] to-[#070b13]",
    },
  },
  {
    id: 3,
    title: "Market Wizards",
    author: "Jack D. Schwager",
    year: "1989",
    genre: "Interviews",
    rating: 5,
    coverImage: "/psychology/book_market_wizards.png",
    authorImage: null,
    description: "Schwager's legendary interviews with Ed Seykota, Paul Tudor Jones, Michael Marcus, and Bruce Kovner. Demonstrates that while trading styles vary radically, strict risk management and self-awareness are universal.",
    keyLesson: "There is no single winning style. There is only disciplined, unwavering application of a personalized edge.",
    importantLessons: [
      "You must know when you are wrong and accept it quickly, without ego or pride.",
      "Position sizing and capital preservation matter ten times more than entry point precision.",
      "The greatest traders adapt themselves to the market rather than stubbornly waiting for the market to adapt to them.",
      "Everyone gets exactly what they want out of the market. Some seek discipline and profits; others seek excitement.",
      "Never risk more than 1% or 2% of total account equity on any individual trade.",
      "Cut losses ruthlessly short and allow profitable trends to run as far as momentum carries them.",
      "Focus primarily on protecting downside capital; upside returns will take care of themselves.",
      "Professional trading is fundamentally methodical and calm. If you desire thrills, visit a casino.",
      "A trading system is only as sound as the emotional stability of the operator executing it.",
      "The market has zero interest in where your mortgage payment or personal expenses sit."
    ],
    theme: {
      accentText: "text-emerald-300",
      badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
      border: "border-emerald-500/30",
      spineColor: "bg-gradient-to-b from-emerald-800 to-emerald-950",
      coverGradient: "from-emerald-950/60 via-[#0e1624] to-[#070b13]",
    },
  },
  {
    id: 4,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    year: "2020",
    genre: "Behavioral Finance",
    rating: 5,
    coverImage: "/psychology/book_psychology_money.png",
    authorImage: null,
    description: "Housel explores why financial outcomes are overwhelmingly governed by behavioral temperament rather than intellectual genius. Nineteen timeless essays on humility, risk, and compounding.",
    keyLesson: "Compounding requires enduring survival. Avoiding ruinous errors matters far more than optimizing peak returns.",
    importantLessons: [
      "True wealth is what you do not see—it is the options not exercised and the extravagant purchases forgone.",
      "The highest dividend money pays is sovereign control over your own time and daily schedule.",
      "Accumulating money requires taking calculated risks; keeping money requires humble conservatism and fear of ruin.",
      "Compounding is an exponential miracle that only rewards those who allow investments uninterrupted years to grow.",
      "Nobody is crazy. Everyone makes financial choices based on their personal lived experience of scarcity or abundance.",
      "You can be mistaken half the time and still accumulate extraordinary wealth through asymmetric payoffs.",
      "Financial success has little to do with raw intellect and everything to do with behavioral self-control.",
      "The most vital component of any plan is having room for error when circumstances deviate from expectations.",
      "Humility prevents you from confusing an exceptional bull market wave with personal analytical brilliance.",
      "Reasonable decision-making often beats purely rational mathematical optimization in preserving sanity."
    ],
    theme: {
      accentText: "text-sky-300",
      badgeBg: "bg-sky-500/10 text-sky-300 border-sky-500/25",
      border: "border-sky-500/30",
      spineColor: "bg-gradient-to-b from-sky-800 to-sky-950",
      coverGradient: "from-sky-950/60 via-[#0e1624] to-[#070b13]",
    },
  },
  {
    id: 5,
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    year: "2011",
    genre: "Behavioral Science",
    rating: 5,
    coverImage: "/psychology/book_thinking_fast_slow.png",
    authorImage: null,
    description: "Nobel laureate Kahneman synthesizes five decades of research on cognitive biases. System 1 (instinctive, emotional) vs System 2 (deliberate, analytical) explains every psychological error traders make.",
    keyLesson: "Intuitions about financial probabilities are almost universally flawed. Deliberate checklists are the only remedy.",
    importantLessons: [
      "Loss Aversion: The psychological agony of taking a ₹5,000 loss is felt twice as intensely as the joy of a ₹5,000 profit.",
      "Confirmation Bias: The human mind actively hunts for evidence that supports existing positions while filtering out contradictory signals.",
      "The Illusion of Validity: High subjective confidence reflects a coherent narrative rather than genuine predictive accuracy.",
      "Sunk Cost Trap: Factoring past unrecoverable losses into current strategic decisions is an irrational cognitive error.",
      "System 1 operates automatically and swiftly; System 2 allocates attention to complex effortful mental calculations.",
      "Anchoring Effect: Traders disproportionately anchor on recent high prices or purchase prices instead of current realities.",
      "Hindsight Bias: In retrospect, past events appear far more predictable than they actually were at the moment of execution.",
      "Overconfidence is the most insidious driver of excessive risk-taking and leverage in financial markets.",
      "We consistently overestimate our comprehension of market dynamics and severely underestimate the role of pure randomness.",
      "Checklists and systematic rules protect deliberate System 2 thinking from being overwhelmed by emotional System 1 impulses."
    ],
    theme: {
      accentText: "text-rose-300",
      badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/25",
      border: "border-rose-500/30",
      spineColor: "bg-gradient-to-b from-rose-800 to-rose-950",
      coverGradient: "from-rose-950/60 via-[#0e1624] to-[#070b13]",
    },
  },
  {
    id: 6,
    title: "The Disciplined Trader",
    author: "Mark Douglas",
    year: "1990",
    genre: "Psychology",
    rating: 4,
    coverImage: "/psychology/book_disciplined_trader.png",
    authorImage: "/psychology/author_mark_douglas.png",
    description: "Mark Douglas's groundbreaking first treatise. Explains why conventional social conditioning actively works against market success and how to construct internal boundaries where none exist externally.",
    keyLesson: "The market offers unlimited freedom without external boundaries. You must construct your own internal discipline.",
    importantLessons: [
      "Success in financial markets demands acquiring mental frameworks completely detached from standard social conditioning.",
      "A trading rule that you violate even occasionally is not a rule; it is merely an optional suggestion.",
      "The more desperately you attempt to control market direction, the more erratic and frustrating trading becomes.",
      "The fear of being proven wrong is the primary driver behind hesitation, early exits, and catastrophic loss accumulation.",
      "You must develop unconditional self-trust to execute predetermined plans without second-guessing.",
      "Consistent trading is an ongoing discipline in emotional self-mastery, not an exercise in market prediction.",
      "The market tape serves as an unvarnished mirror reflecting your internal psychological vulnerabilities.",
      "To thrive as an operator, you must embrace uncertainty and accept that any given setup can fail.",
      "Objective market analysis is directly proportional to how thoroughly you release rigid price expectations.",
      "Professional mastery is not about controlling price action; it is about absolute control over your own execution."
    ],
    theme: {
      accentText: "text-indigo-300",
      badgeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
      border: "border-indigo-500/30",
      spineColor: "bg-gradient-to-b from-indigo-800 to-indigo-950",
      coverGradient: "from-indigo-950/60 via-[#0e1624] to-[#070b13]",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Biases (Mental Models)
// ─────────────────────────────────────────────────────────────────────────────

interface BiasItem {
  id: number;
  title: string;
  tag: string;
  description: string;
  trigger: string;
  antidote: string;
  marketExample: string;
}

const biases: BiasItem[] = [
  {
    id: 1,
    title: "FOMO (Fear of Missing Out)",
    tag: "Impulse Error",
    description: "The overwhelming psychological urge that a huge market run is passing you by, compelling you to abandon risk rules and buy at the absolute top.",
    trigger: "Watching explosive green candles or peers bragging about outsized morning profits on social media.",
    antidote: "Infinite Opportunity Rule: The market creates high-probability setups daily. Missing one train simply means waiting comfortably on the platform for the next scheduled arrival.",
    marketExample: "Chasing a +15% gapper 45 minutes after open without any defined base or pullback.",
  },
  {
    id: 2,
    title: "The Sunk Cost Fallacy",
    tag: "Loss Aversion",
    description: "Refusing to close a broken trade because you have already invested so much money or pride. 'I'll get out the moment it bounces back to cost.'",
    trigger: "A position dropping through critical technical support while you scour news feeds to validate your original thesis.",
    antidote: "The Clean Slate Query: 'If I held 100% cash right this second, would I buy this specific ticker at current price?' If no, exit unconditionally.",
    marketExample: "Holding out-of-the-money options down 70% as theta decay evaporates the remaining premium.",
  },
  {
    id: 3,
    title: "Confirmation Bias",
    tag: "Intellectual Trap",
    description: "Actively seeking out information and analysis that confirms your directional bias while deliberately ignoring clear contrary signals.",
    trigger: "Holding a large long position and exclusively watching hyper-bullish YouTube analysts or reading bullish commentary.",
    antidote: "Devil's Advocate Protocol: Before sizing up, force yourself to write down the three most compelling reasons why this trade could fail.",
    marketExample: "Dismissing an index break below the 200 EMA as 'just institutional stop-hunting' because you are heavily long.",
  },
  {
    id: 4,
    title: "Revenge Trading & Tilt",
    tag: "Catastrophic Risk",
    description: "Immediately initiating an oversized, aggressive new trade right after suffering a painful stop-out to forcibly 'win it back' from the market.",
    trigger: "Getting stopped out of a high-conviction trade followed by immediate market reversal in your original direction.",
    antidote: "The 30-Minute Screen Lockout: Walk away from screens immediately after two consecutive losses. The market cannot be punished; it can only punish you.",
    marketExample: "Doubling position size on expiry day 0DTE options immediately following a ₹25,000 loss.",
  },
  {
    id: 5,
    title: "Recency Bias",
    tag: "Perception Error",
    description: "Believing that whatever market behavior has prevailed over the past three days will persist indefinitely into the future.",
    trigger: "A smooth four-day trend that lures you into believing range-bound chop or sharp mean reversion is impossible.",
    antidote: "Regime Recognition: Markets alternate continuously between trend and mean reversion. Constantly zoom out to higher timeframe structural levels.",
    marketExample: "Selling unhedged strangles during ultra-low VIX complacency right before an explosive volatility spike.",
  },
  {
    id: 6,
    title: "Endowment Effect",
    tag: "Ego Attachment",
    description: "Overvaluing an asset simply because it resides in your portfolio. You wouldn't purchase it today, yet you stubbornly refuse to let it go.",
    trigger: "Holding stagnant, underperforming stocks for months because 'the company fundamentals are solid.'",
    antidote: "Opportunity Cost Audit: Every rupee locked in a stagnant loser is capital unable to participate in high-momentum market leaders.",
    marketExample: "Refusing to trim a dead sideways stock while high-relative-strength sector leaders print new 52-week highs.",
  },
];

const CATEGORIES = ["All", "Contrarian", "Risk", "Patience", "Discipline", "Mindset", "Strategy"];

const IRON_RULES = [
  "Never average down a losing options position. Averaging losers turns small mistakes into terminal disasters.",
  "Process over outcome; judge your trades by how strictly you executed the plan, not by individual P&L.",
  "Your primary duty is managing downside risk; market profits will manage themselves.",
  "Cut your losses quickly without ego; let your winning runners compound as long as trend structure holds.",
  "If you cannot accept the exact financial loss of a stop-out before entry, do not place the order.",
  "Boredom is never a valid setup. Preserving cash during chop is the highest form of active discipline.",
  "A single trade should never possess the power to threaten your trading career or mental peace.",
  "The market can remain irrational far longer than you can remain solvent. Never fight persistent flow.",
  "Hope is not a risk management framework. When the thesis is invalidated, exit immediately."
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components: Avatar with resilient fallback & seal
// ─────────────────────────────────────────────────────────────────────────────

const AuthorAvatar: React.FC<{ src: string | null; name: string; size?: 'sm' | 'md' | 'lg' }> = ({
  src,
  name,
  size = 'md',
}) => {
  const [imageError, setImageError] = useState(false);
  const szClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm md:w-16 md:h-16 md:text-base',
  }[size];

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src && !imageError) {
    return (
      <div className={`relative ${szClasses} shrink-0`}>
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className={`${szClasses} rounded-full object-cover border border-amber-400/40 shadow-md ring-2 ring-black/40`}
        />
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 pointer-events-none" />
      </div>
    );
  }

  // Refined Monogram Seal fallback
  return (
    <div
      className={`${szClasses} rounded-full bg-gradient-to-br from-amber-900/60 via-slate-900 to-[#070b13] border border-amber-500/30 flex items-center justify-center font-serif font-bold text-amber-200/90 shadow-md ring-2 ring-black/40 shrink-0 tracking-wider select-none`}
    >
      {initials}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components: Leather / Cloth Book Cover with Fallback
// ─────────────────────────────────────────────────────────────────────────────

const BookCoverVisual: React.FC<{ book: BookItem }> = ({ book }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-full h-full shadow-[12px_14px_30px_rgba(0,0,0,0.85)] rounded-md overflow-hidden transform perspective-1000 group-hover:scale-[1.03] transition-transform duration-500 border border-white/10">
      {/* Book spine lighting */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 md:w-2.5 ${book.theme.spineColor} z-20 brightness-90 border-r border-black/50 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.7)]`}
      />
      {/* Front edge gloss */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-white/10 z-10 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />

      {!imgError && book.coverImage ? (
        <img
          src={book.coverImage}
          alt={book.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-sm block"
          style={{ minHeight: '210px' }}
        />
      ) : (
        /* Bespoke Leather-Bound Fallback Cover */
        <div
          className={`w-full h-full min-h-[210px] bg-gradient-to-br ${book.theme.coverGradient} p-4 pl-5 flex flex-col justify-between rounded-sm border border-amber-500/20`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase tracking-widest text-amber-400/80 font-mono">
              {book.year}
            </span>
            <div className="w-4 h-4 rounded-full border border-amber-400/30 flex items-center justify-center">
              <span className="text-[8px] text-amber-400">★</span>
            </div>
          </div>

          <div className="my-auto py-2">
            <h4
              className="text-white font-serif font-bold text-sm md:text-base leading-tight tracking-tight drop-shadow-md"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {book.title}
            </h4>
            <div className="w-8 h-px bg-amber-400/40 my-2" />
            <p className="text-[11px] text-amber-200/70 font-sans tracking-wide">
              {book.author}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono">
              Classic Folio
            </span>
            <BookOpen className="w-3 h-3 text-amber-400/60" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const TradingPsychology: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'quotes' | 'articles' | 'books' | 'biases' | 'radar'>('quotes');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [expandedBook, setExpandedBook] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ruleIndex, setRuleIndex] = useState(() => new Date().getDate() % IRON_RULES.length);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [flippedBiases, setFlippedBiases] = useState<Record<number, boolean>>({});

  // Tilt radar assessment state
  const [radarAnswers, setRadarAnswers] = useState<Record<number, boolean | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
  });

  const ruleOfTheDay = IRON_RULES[ruleIndex];

  const handleCopyQuote = (id: number | string, text: string, author: string) => {
    navigator.clipboard.writeText(`"${text}" — ${author}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNextRule = () => {
    setRuleIndex((prev) => (prev + 1) % IRON_RULES.length);
  };

  const toggleBiasFlip = (id: number) => {
    setFlippedBiases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered lists
  const filteredQuotes = quotes.filter((q) => {
    const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const heroQuote = filteredQuotes.find((q) => q.size === 'hero') || filteredQuotes[0];
  const gridQuotes = filteredQuotes.filter((q) => q.id !== heroQuote?.id);

  const filteredArticles = articles.filter((a) => {
    const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredBooks = books.filter(
    (b) =>
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.keyLesson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBiases = biases.filter(
    (b) =>
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.antidote.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Radar score calculation
  const answeredCount = Object.values(radarAnswers).filter((v) => v !== null).length;
  const goodAnswersCount = [
    radarAnswers[1] === false, // not revenge trading
    radarAnswers[2] === true,  // stop loss defined
    radarAnswers[3] === true,  // setup verified
    radarAnswers[4] === true,  // sized properly
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-200">
      
      {/* ──────────────────────────────────────────────────────────────────────────
          1. EXECUTIVE DESK PLAQUE: Iron Rule of the Day
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-amber-500/25 bg-gradient-to-r from-[#0c121e] via-[#121929] to-[#0c121e] shadow-[0_4px_24px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Subtle top gold foil hairline */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700" />
        
        <div className="px-5 py-4 md:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
            <div className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/90 font-mono">
                  Trading Axiom #{ruleIndex + 1}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <p
                className="text-base md:text-lg font-serif text-slate-100 font-medium leading-snug tracking-wide italic"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                "{ruleOfTheDay}"
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => handleCopyQuote(`rule-${ruleIndex}`, ruleOfTheDay, 'PaperProfit Axiom')}
              title="Copy Axiom"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {copiedId === `rule-${ruleIndex}` ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleNextRule}
              title="Next Axiom"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. EDITORIAL MASTHEAD: Header & Institutional Overview
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0e1422] to-[#090d16] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Subtle background ambient warmth */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-36 bg-sky-500/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono font-semibold uppercase tracking-widest">
                Behavioral Edge & Capital Preservation
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 text-xs font-mono">Curated Library</span>
            </div>
            
            <h1
              className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Trading Psychology <span className="text-amber-300 font-normal italic">& Mental Discipline</span>
            </h1>
            
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
              Technical analysis identifies opportunities; psychology dictates execution. Explore canonical treatises, cognitive bias models, and timeless axioms to eliminate emotional tilt.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:w-[480px] shrink-0">
            {[
              { label: "Sourced Axioms", count: quotes.length, icon: Quote, color: "text-amber-300" },
              { label: "Essays & Guides", count: articles.length, icon: BookOpen, color: "text-sky-300" },
              { label: "Classic Treatises", count: books.length, icon: Bookmark, color: "text-emerald-300" },
              { label: "Cognitive Models", count: biases.length, icon: BrainCircuit, color: "text-rose-300" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-800 bg-[#0c121e]/80 p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-slate-400">{stat.label}</span>
                    <Icon className={`w-3.5 h-3.5 ${stat.color} opacity-80`} />
                  </div>
                  <span className={`text-xl font-mono font-bold ${stat.color}`}>{stat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. NAVIGATION CONTROLS: Tabs, Search & Category Filters
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c121e] border border-slate-800 shrink-0 overflow-x-auto">
          {[
            { id: 'quotes', label: 'Wisdom Axioms', icon: Quote },
            { id: 'articles', label: 'Masterclass Essays', icon: BookOpen },
            { id: 'books', label: 'Classic Bookshelf', icon: Bookmark },
            { id: 'biases', label: 'Cognitive Biases', icon: BrainCircuit },
            { id: 'radar', label: 'Pre-Trade Tilt Check', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id as any);
                  setExpandedArticle(null);
                  setExpandedBook(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${activeSection}...`}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#0c121e] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Quotes & Articles) */}
      {(activeSection === 'quotes' || activeSection === 'articles') && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Filter className="w-3 h-3 text-slate-500" /> Filter:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-400/15 border border-amber-400/40 text-amber-200 shadow-sm'
                  : 'bg-white/[0.02] border border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 1: WISDOM AXIOMS (Front-Page Literary Presentation)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'quotes' && (
        <div className="space-y-6">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-slate-800/80 bg-[#0c121e]/50">
              <Quote className="w-10 h-10 mx-auto text-slate-600 mb-3 opacity-30" />
              <p className="text-slate-400 font-serif text-lg">No quotes matching your filter criteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-amber-400 hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <>
              {/* HERO FEATURED QUOTE CARD */}
              {heroQuote && (
                <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0f1624] via-[#0c121e] to-[#080d16] p-7 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
                  {/* Subtle corner watermark quotation mark */}
                  <div
                    className="absolute -top-6 right-6 font-serif text-[140px] md:text-[180px] leading-none text-amber-400/[0.04] pointer-events-none select-none"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    “
                  </div>
                  <div className="absolute left-0 top-8 bottom-8 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase tracking-widest font-semibold">
                          {heroQuote.category}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">• Featured Axiom</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono bg-white/[0.04] px-3 py-1 rounded-full border border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{heroQuote.year}</span>
                      </div>
                    </div>

                    {/* The Quote Text */}
                    <blockquote className="mb-8 pr-4 md:pr-12">
                      <p
                        className="text-2xl md:text-3xl lg:text-4xl font-serif text-white font-normal leading-snug tracking-tight"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        "{heroQuote.text}"
                      </p>
                    </blockquote>

                    {/* Author & Footer Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <AuthorAvatar src={heroQuote.avatar} name={heroQuote.author} size="lg" />
                        <div>
                          <h4 className="text-base md:text-lg font-serif font-bold text-white tracking-wide">
                            {heroQuote.author}
                          </h4>
                          <p className="text-xs text-amber-400/90 font-mono">{heroQuote.role}</p>
                          <p className="text-[11px] text-slate-400 italic mt-0.5">{heroQuote.source}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyQuote(heroQuote.id, heroQuote.text, heroQuote.author)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all self-start sm:self-auto cursor-pointer"
                      >
                        {copiedId === heroQuote.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied to Clipboard</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Axiom</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* GRID OF COMPLEMENTARY QUOTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gridQuotes.map((q) => {
                  return (
                    <div
                      key={q.id}
                      className="group relative rounded-xl border border-slate-800/80 bg-[#0c121e]/85 hover:bg-[#0f1624] p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                    >
                      {/* Top border hairline */}
                      <div className="absolute top-0 inset-x-4 h-px bg-transparent group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-amber-400/40 group-hover:to-transparent transition-all" />

                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-semibold bg-white/[0.03] border border-white/10 text-slate-300 group-hover:text-amber-300 group-hover:border-amber-500/30 transition-colors">
                            {q.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{q.year}</span>
                        </div>

                        <blockquote className="mb-5">
                          <p
                            className="text-base text-slate-100 font-serif leading-relaxed"
                            style={{ fontFamily: 'var(--font-serif)' }}
                          >
                            "{q.text}"
                          </p>
                        </blockquote>
                      </div>

                      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AuthorAvatar src={q.avatar} name={q.author} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{q.author}</p>
                            <p className="text-[10px] text-slate-400 truncate">{q.source}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopyQuote(q.id, q.text, q.author)}
                          title="Copy Quote"
                          className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          {copiedId === q.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 2: MASTERCLASS ARTICLES (Deep Editorial Experience)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'articles' && (
        <div className="space-y-6">
          {expandedArticle !== null ? (
            /* READER VIEW */
            (() => {
              const article = articles.find((a) => a.id === expandedArticle)!;
              return (
                <div className="rounded-2xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-2xl animate-in fade-in duration-300">
                  {/* Reader Top Action Bar */}
                  <div className="px-6 py-4 border-b border-slate-800 bg-[#090d16] flex items-center justify-between">
                    <button
                      onClick={() => setExpandedArticle(null)}
                      className="flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span>Back to Masterclass Articles</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400">{article.readTime}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-mono text-slate-400">{article.category}</span>
                    </div>
                  </div>

                  {/* Header Cover Banner */}
                  <div className="relative h-64 md:h-80 w-full overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover brightness-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c121e] via-[#0c121e]/60 to-transparent" />
                    
                    <div className="absolute bottom-6 inset-x-6 md:inset-x-12">
                      <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase tracking-widest font-semibold inline-block mb-3">
                        {article.category}
                      </span>
                      <h2
                        className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight drop-shadow-md"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        {article.title}
                      </h2>
                    </div>
                  </div>

                  {/* Body Prose */}
                  <div className="px-6 md:px-16 py-10 max-w-4xl mx-auto">
                    {/* Pull Quote Excerpt */}
                    <div className="mb-10 p-5 rounded-xl border-l-4 border-amber-400 bg-amber-500/[0.04]">
                      <p
                        className="text-lg md:text-xl font-serif italic text-amber-200/90 leading-relaxed"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        "{article.excerpt}"
                      </p>
                    </div>

                    <div className="space-y-6">
                      {article.content.split('\n\n').map((block, idx) => {
                        if (block.startsWith('**') && block.endsWith('**')) {
                          return (
                            <h3
                              key={idx}
                              className="text-xl md:text-2xl font-serif font-bold text-white pt-6 pb-1 border-b border-white/5 tracking-wide flex items-center gap-2.5"
                              style={{ fontFamily: 'var(--font-serif)' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {block.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }

                        // Numbered list item check
                        if (/^\d+\./.test(block)) {
                          return (
                            <div key={idx} className="space-y-3 pl-2">
                              {block.split('\n').map((line, liIdx) => (
                                <div key={liIdx} className="flex items-start gap-3">
                                  <div className="shrink-0 w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-mono font-bold text-amber-300 mt-0.5">
                                    {liIdx + 1}
                                  </div>
                                  <p
                                    className="text-base text-slate-300 leading-relaxed font-serif"
                                    style={{ fontFamily: 'var(--font-serif)' }}
                                  >
                                    {line.replace(/^\d+\.\s*/, '')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <p
                            key={idx}
                            className="text-base md:text-lg text-slate-300 font-serif leading-[1.8] font-normal"
                            style={{ fontFamily: 'var(--font-serif)' }}
                          >
                            {block}
                          </p>
                        );
                      })}
                    </div>

                    {/* Bottom Back Button */}
                    <div className="mt-12 pt-8 border-t border-slate-800 flex justify-center">
                      <button
                        onClick={() => setExpandedArticle(null)}
                        className="px-6 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        <span>Return to Masterclass Articles</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* ARTICLE CARDS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setExpandedArticle(article.id)}
                  className="group rounded-2xl border border-slate-800/80 bg-[#0c121e]/90 hover:bg-[#0f1624] overflow-hidden shadow-lg hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="relative h-48 w-full overflow-hidden shrink-0">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 brightness-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c121e] via-[#0c121e]/30 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-amber-300 text-[10px] font-mono uppercase tracking-widest font-semibold">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="text-xl font-serif font-bold text-white mb-2.5 group-hover:text-amber-300 transition-colors leading-snug"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        {article.title}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-400 font-serif leading-relaxed line-clamp-3 mb-4">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500 text-[11px]">{article.readTime}</span>
                      <span className="font-semibold text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read Full Essay <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 3: CLASSIC BOOKSHELF (3D Folio & Deep Study)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'books' && (
        <div className="space-y-6">
          {expandedBook !== null ? (
            /* EXPANDED BOOK DOSSIER */
            (() => {
              const book = books.find((b) => b.id === expandedBook)!;
              return (
                <div className="rounded-2xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-2xl animate-in fade-in duration-300">
                  <div className="px-6 py-4 border-b border-slate-800 bg-[#090d16] flex items-center justify-between">
                    <button
                      onClick={() => setExpandedBook(null)}
                      className="flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span>Back to Bookshelf</span>
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Executive Summary & Key Axioms
                    </span>
                  </div>

                  <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Left: Book Cover Presentation */}
                    <div className="w-full lg:w-72 shrink-0 flex flex-col items-center text-center">
                      <div className="w-44 md:w-52 h-64 md:h-76 mb-6">
                        <BookCoverVisual book={book} />
                      </div>
                      
                      <h3
                        className="text-xl font-serif font-bold text-white mb-1"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs text-amber-400 font-mono mb-2">By {book.author}</p>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Published {book.year}</span>
                        <span>•</span>
                        <span>{book.genre}</span>
                      </div>

                      <div className="flex items-center gap-1 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= book.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-mono text-slate-300 ml-1.5 font-bold">5.0</span>
                      </div>
                    </div>

                    {/* Right: Core Thesis & 10 Key Lessons */}
                    <div className="flex-1 min-w-0">
                      {/* Core thesis box */}
                      <div className="mb-6 p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block mb-1.5">
                          Core Philosophical Thesis
                        </span>
                        <p
                          className="text-base md:text-lg font-serif italic text-amber-200 leading-relaxed"
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          "{book.keyLesson}"
                        </p>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed mb-8 font-serif">
                        {book.description}
                      </p>

                      <h4 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        Ten Foundational Lessons for Active Traders
                      </h4>

                      <div className="space-y-3.5">
                        {book.importantLessons.map((lesson, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/20 transition-colors flex items-start gap-3.5"
                          >
                            <span className="shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300 mt-0.5">
                              {idx + 1}
                            </span>
                            <p
                              className="text-sm md:text-base text-slate-200 font-serif leading-relaxed"
                              style={{ fontFamily: 'var(--font-serif)' }}
                            >
                              {lesson}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* BOOKSHELF GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setExpandedBook(book.id)}
                  className="group rounded-2xl border border-slate-800/80 bg-[#0c121e]/90 hover:bg-[#0f1624] p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex gap-4 mb-4">
                    {/* 3D Cover */}
                    <div className="w-28 sm:w-32 h-40 shrink-0">
                      <BookCoverVisual book={book} />
                    </div>

                    {/* Book Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-slate-300">
                            {book.genre}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{book.year}</span>
                        </div>

                        <h3
                          className="text-base font-serif font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2"
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {book.title}
                        </h3>

                        <p className="text-xs text-amber-400/90 font-mono mt-0.5 truncate">{book.author}</p>
                      </div>

                      <div className="flex items-center gap-1 pt-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= book.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Core Takeaway Snippet */}
                  <div className="pt-3 border-t border-white/[0.06]">
                    <p
                      className="text-xs text-slate-400 font-serif italic line-clamp-2"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      "{book.keyLesson}"
                    </p>
                    
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500">10 Master Lessons</span>
                      <span className="text-amber-300 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore Book <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 4: COGNITIVE BIASES (Tactical Mental Models)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'biases' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0c121e]/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              Click any card to flip between the Psychological Trigger and the Tactical Antidote.
            </span>
            <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
              6 Cognitive Models Loaded
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBiases.map((bias) => {
              const isFlipped = !!flippedBiases[bias.id];
              return (
                <div
                  key={bias.id}
                  onClick={() => toggleBiasFlip(bias.id)}
                  className="rounded-2xl border border-slate-800/80 bg-[#0c121e] hover:border-amber-500/30 p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer min-h-[340px]"
                >
                  {!isFlipped ? (
                    /* FRONT: BIAS & TRIGGER */
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-300">
                            {bias.tag}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">Tap to Flip ↻</span>
                        </div>

                        <h3
                          className="text-xl font-serif font-bold text-white mb-2.5"
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {bias.title}
                        </h3>

                        <p className="text-xs md:text-sm text-slate-400 font-serif leading-relaxed mb-4">
                          {bias.description}
                        </p>
                      </div>

                      <div>
                        {/* Trigger Box */}
                        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 mb-3">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> The Trigger
                          </span>
                          <p className="text-xs text-rose-200/90 italic font-serif">
                            "{bias.trigger}"
                          </p>
                        </div>

                        <div className="pt-2 text-center">
                          <span className="text-[11px] font-semibold text-amber-300 hover:text-amber-200">
                            Reveal Tactical Antidote →
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BACK: ANTIDOTE & MARKET EXAMPLE */
                    <div className="flex flex-col justify-between h-full animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Antidote Active
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">Tap to Flip ↻</span>
                        </div>

                        <h3
                          className="text-lg font-serif font-bold text-emerald-300 mb-2"
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {bias.title}
                        </h3>

                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25 mb-4">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                            Prescribed Mental Antidote
                          </span>
                          <p
                            className="text-xs md:text-sm text-emerald-100 font-serif leading-relaxed font-medium"
                            style={{ fontFamily: 'var(--font-serif)' }}
                          >
                            {bias.antidote}
                          </p>
                        </div>
                      </div>

                      <div>
                        {/* Real market example */}
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-3">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                            Real Market Example
                          </span>
                          <p className="text-[11px] text-slate-300 italic">{bias.marketExample}</p>
                        </div>

                        <div className="pt-2 text-center">
                          <span className="text-[11px] font-semibold text-slate-400 hover:text-slate-300">
                            ← Return to Trigger
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 5: PRE-TRADE TILT RADAR (Interactive Daily Tool)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'radar' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 md:p-8 shadow-xl">
            <div className="max-w-2xl mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Daily Execution Pre-Flight Checklist
                </span>
              </div>
              <h2
                className="text-2xl md:text-3xl font-serif font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Pre-Trade Emotional Temperature & Tilt Audit
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-serif">
                Answer these 4 objective questions honestly before placing any options or equities order. Professional operators eliminate impulsive risk before risking a single rupee.
              </p>
            </div>

            {/* Assessment Checklist */}
            <div className="space-y-4 max-w-3xl">
              {[
                {
                  id: 1,
                  question: "1. Am I seeking to recover a recent loss or prove the market wrong today?",
                  dangerAnswer: true,
                  hint: "If yes, you are experiencing tilt. Stepping away for 30 minutes prevents irreversible account damage.",
                },
                {
                  id: 2,
                  question: "2. Is my maximum stop-loss defined in advance and entered into the terminal?",
                  dangerAnswer: false,
                  hint: "Mental stops fail under market stress. Hard stops guarantee you live to trade another day.",
                },
                {
                  id: 3,
                  question: "3. Does this trade satisfy all predetermined criteria of my written trading plan?",
                  dangerAnswer: false,
                  hint: "Trading outside your edge produces random outcomes. Only execute high-expectancy setups.",
                },
                {
                  id: 4,
                  question: "4. Is my position size small enough that a total loss will cause zero emotional distress?",
                  dangerAnswer: false,
                  hint: "Oversizing triggers fight-or-flight cortisol. If a stop-out hurts your sleep, reduce size by 50%.",
                },
              ].map((item) => {
                const answer = radarAnswers[item.id];
                return (
                  <div
                    key={item.id}
                    className="p-4 md:p-5 rounded-xl border border-slate-800/80 bg-[#090d16] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p
                        className="text-sm md:text-base font-serif font-medium text-slate-200"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        {item.question}
                      </p>
                      <p className="text-[11px] text-slate-500 font-sans mt-1">{item.hint}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        onClick={() =>
                          setRadarAnswers((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                          answer === true
                            ? 'bg-amber-400 text-black shadow-sm'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() =>
                          setRadarAnswers((prev) => ({ ...prev, [item.id]: false }))
                        }
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                          answer === false
                            ? 'bg-amber-400 text-black shadow-sm'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assessment Score Card */}
            {answeredCount === 4 && (
              <div className="mt-8 max-w-3xl rounded-xl border border-slate-700 bg-gradient-to-r from-[#0c121e] to-[#090d16] p-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    Tilt Radar Assessment Result
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Score: {goodAnswersCount} / 4
                  </span>
                </div>

                {goodAnswersCount === 4 ? (
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-serif font-bold text-emerald-300">
                        Green Light: Peak Disciplined State
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Your risk is quantified, your plan is verified, and your psychological state is calm. You are operating from probabilistic rationality. Execute cleanly.
                      </p>
                    </div>
                  </div>
                ) : goodAnswersCount >= 2 ? (
                  <div className="flex items-start gap-3.5">
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-serif font-bold text-amber-300">
                        Yellow Caution: Potential Emotional Leak
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        You have flagged risk vulnerability in your setup or sizing. Do not place this trade until your stop is entered and position size is strictly halved.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3.5">
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-serif font-bold text-rose-300">
                        Red Light: Tilt Warning — Do Not Enter Orders
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        High psychological vulnerability detected. Revenge trading or improper sizing will destroy your capital today. Lock your screens and step away until tomorrow morning.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          6. COLOPHON / FOOTER QUOTE STRIP
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0c121e] to-[#070b13] p-6 md:p-8 text-center shadow-lg">
        <div className="w-12 h-px bg-amber-400/40 mx-auto mb-4" />
        <p
          className="text-slate-300 text-sm md:text-base max-w-3xl mx-auto leading-relaxed italic font-serif"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          "The game of speculation is the most uniformly fascinating game in the world. But it is not a game for the stupid, the mentally lazy, the person of inferior emotional balance, or the get-rich-quick adventurer."
        </p>
        <p className="text-xs text-amber-400/80 mt-3 font-mono uppercase tracking-widest">
          — Jesse Livermore, Reminiscences of a Stock Operator (1923)
        </p>
      </div>

    </div>
  );
};

export default TradingPsychology;
