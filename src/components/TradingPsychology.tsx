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
    sm: 'w-8 h-8 text-xs',
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
          className={`${szClasses} rounded-full object-cover border border-amber-400/40 shadow-sm`}
        />
      </div>
    );
  }

  // Refined Monogram Seal fallback
  return (
    <div
      className={`${szClasses} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 shrink-0 select-none`}
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
    <div className="relative w-full h-full shadow-md rounded-md overflow-hidden border border-slate-800 bg-[#0e131d]">
      {!imgError && book.coverImage ? (
        <img
          src={book.coverImage}
          alt={book.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-sm block"
          style={{ minHeight: '150px' }}
        />
      ) : (
        /* Bespoke Minimalist Editorial Fallback Cover */
        <div
          className={`w-full h-full min-h-[150px] bg-gradient-to-br ${book.theme.coverGradient} p-3.5 flex flex-col justify-between rounded-sm border border-slate-700/60`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              {book.year}
            </span>
            <div className="w-4 h-4 rounded-full border border-amber-400/40 flex items-center justify-center">
              <span className="text-[10px] text-amber-400">★</span>
            </div>
          </div>

          <div className="my-auto py-1.5">
            <h4 className="text-white font-bold text-xs sm:text-sm leading-snug">
              {book.title}
            </h4>
            <div className="w-6 h-px bg-slate-600 my-1.5" />
            <p className="text-[11px] text-slate-300">
              {book.author}
            </p>
          </div>

          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
              Folio Edition
            </span>
            <BookOpen className="w-3 h-3 text-slate-400" />
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
  const [activeSection, setActiveSection] = useState<'quotes' | 'biases' | 'radar' | 'books' | 'articles'>('quotes');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [expandedBook, setExpandedBook] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ruleIndex, setRuleIndex] = useState(() => new Date().getDate() % IRON_RULES.length);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

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
      b.antidote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.trigger.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Radar score calculation
  const answeredCount = Object.values(radarAnswers).filter((v) => v !== null).length;
  // Good answers: Q1 is false (not revenge trading), Q2 is true (stop loss defined), Q3 is true (plan followed), Q4 is true (sized properly)
  const disciplinedAnswersCount = [
    radarAnswers[1] === false,
    radarAnswers[2] === true,
    radarAnswers[3] === true,
    radarAnswers[4] === true,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 w-full max-w-[1440px] mx-auto pb-16 px-4 sm:px-6 lg:px-8 text-slate-200">
      
      {/* ──────────────────────────────────────────────────────────────────────────
          1. COMPACT EDITORIAL HEADER & WORKSPACE OVERVIEW
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Behavioral Edge
              </span>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-slate-400 text-xs font-mono">Execution Discipline</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Trading Psychology &amp; Mindset
            </h1>
            
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Technical tools locate setups; probabilistic mindset determines execution. Canonical wisdom, cognitive bias frameworks, and pre-trade composure checks.
            </p>
          </div>

          {/* Direct Interactive Section Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'quotes', label: 'Axioms', count: quotes.length },
              { id: 'biases', label: 'Biases', count: biases.length },
              { id: 'radar', label: 'Tilt Radar', count: 'Audit' },
              { id: 'books', label: 'Treatises', count: books.length },
              { id: 'articles', label: 'Essays', count: articles.length },
            ].map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSection(tab.id as any);
                    setExpandedArticle(null);
                    setExpandedBook(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-[#101520] border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. COMPACT EDITORIAL CALLOUT: IRON RULE OF THE DAY
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0e131d] px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-xs font-mono font-bold">
            #{ruleIndex + 1}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-bold block mb-0.5">
              Iron Rule of the Day
            </span>
            <p className="text-sm text-slate-200 font-medium leading-snug truncate md:whitespace-normal">
              "{ruleOfTheDay}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => handleCopyQuote(`rule-${ruleIndex}`, ruleOfTheDay, 'Iron Rule')}
            title="Copy Rule"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
          >
            {copiedId === `rule-${ruleIndex}` ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleNextRule}
            title="Next Rule"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700/60 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Next</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. NAVIGATION CONTROLS: Section Tabs & Contextual Search
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Clean Segmented Tab Bar */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0c1017] border border-slate-800 shrink-0 overflow-x-auto [scrollbar-width:none]">
          {[
            { id: 'quotes', label: 'Wisdom Axioms', icon: Quote },
            { id: 'biases', label: 'Cognitive Biases', icon: BrainCircuit },
            { id: 'radar', label: 'Pre-Trade Tilt Check', icon: Compass },
            { id: 'books', label: 'Classic Bookshelf', icon: Bookmark },
            { id: 'articles', label: 'Masterclass Essays', icon: BookOpen },
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px] sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSection}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#0c1017] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Quotes & Articles) */}
      {(activeSection === 'quotes' || activeSection === 'articles') && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-500" /> Filter:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 font-semibold'
                  : 'bg-[#0c1017] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 1: WISDOM AXIOMS (Editorial Product Grid)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'quotes' && (
        <div className="space-y-4">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-slate-800 bg-[#0c1017]">
              <Quote className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-40" />
              <p className="text-slate-400 text-sm">No quotes matching your search criteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {/* HERO FEATURED AXIOM */}
              {heroQuote && (
                <div className="relative rounded-xl border border-slate-800 bg-[#0c1017] p-5 md:p-6 shadow-sm overflow-hidden">
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-amber-400" />
                  
                  <div className="pl-2">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {heroQuote.category}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">Featured Axiom</span>
                      </div>
                      <span className="text-slate-500 text-xs font-mono">{heroQuote.year}</span>
                    </div>

                    <blockquote className="mb-4">
                      <p className="text-lg md:text-xl text-white font-medium leading-snug tracking-tight">
                        "{heroQuote.text}"
                      </p>
                    </blockquote>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <AuthorAvatar src={heroQuote.avatar} name={heroQuote.author} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{heroQuote.author}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{heroQuote.role} · <span className="text-slate-500">{heroQuote.source}</span></p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyQuote(heroQuote.id, heroQuote.text, heroQuote.author)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer self-start sm:self-auto"
                      >
                        {copiedId === heroQuote.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs">Copy Axiom</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3-COLUMN EDITORIAL QUOTE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {gridQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-800 bg-[#0c1017] hover:border-slate-700 p-4 flex flex-col justify-between transition-colors shadow-sm relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60">
                          {q.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{q.year}</span>
                      </div>

                      <blockquote className="mb-3">
                        <p className="text-sm text-slate-100 leading-relaxed font-normal">
                          "{q.text}"
                        </p>
                      </blockquote>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AuthorAvatar src={q.avatar} name={q.author} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{q.author}</p>
                          <p className="text-[11px] text-slate-400 truncate">{q.source}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyQuote(q.id, q.text, q.author)}
                        title="Copy Quote"
                        className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiedId === q.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 2: COGNITIVE BIASES (Direct Dual-Pane Trigger ➔ Antidote)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'biases' && (
        <div className="space-y-4">
          <div className="p-3.5 px-4 rounded-xl border border-slate-800 bg-[#0c1017] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              <span>Comparative cognitive model library: Mental triggers paired directly with tactical execution antidotes.</span>
            </span>
            <span className="font-mono text-xs text-slate-500 hidden sm:inline">
              {filteredBiases.length} Cognitive Models
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredBiases.map((bias) => (
              <div
                key={bias.id}
                className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white">{bias.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/25">
                      {bias.tag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {bias.description}
                  </p>

                  {/* Dual-Pane Comparative Layout (Both visible immediately, no clicking needed!) */}
                  <div className="space-y-2.5">
                    {/* TRIGGER PANE */}
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>Cognitive Trigger</span>
                      </div>
                      <p className="text-xs text-rose-200/90 leading-snug">
                        "{bias.trigger}"
                      </p>
                    </div>

                    {/* ANTIDOTE PANE */}
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Tactical Antidote</span>
                      </div>
                      <p className="text-xs text-emerald-200/95 leading-snug font-medium">
                        {bias.antidote}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-slate-400">Market Context:</span>
                  <span className="text-slate-400 text-right truncate max-w-[340px]">{bias.marketExample}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 3: PRE-TRADE TILT RADAR (Functional Self-Reflection Audit)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'radar' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 md:p-6 shadow-sm">
            <div className="max-w-2xl mb-6">
              <div className="flex items-center gap-2 mb-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Pre-Flight Self-Reflection Audit
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1.5">
                Pre-Trade Emotional Temperature &amp; Tilt Radar
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Objective 4-point composure check. Run through this questionnaire before committing capital to options or equities orders.
              </p>
            </div>

            {/* Assessment Checklist with explicit semantic buttons */}
            <div className="space-y-3 max-w-3xl">
              {[
                {
                  id: 1,
                  question: "1. Am I seeking to recover a recent loss or prove the market wrong today?",
                  hint: "Loss recovery mode induces impulsive over-trading. Taking a 30-minute break resets prefrontal cortex composure.",
                  safeOption: false,
                  safeLabel: "Disciplined (No)",
                  tiltLabel: "Potential Tilt (Yes)",
                },
                {
                  id: 2,
                  question: "2. Is my maximum stop-loss defined in advance and entered into the terminal?",
                  hint: "Mental stops collapse during market volatility. Hard stop orders prevent emotional hesitation.",
                  safeOption: true,
                  safeLabel: "Disciplined (Yes)",
                  tiltLabel: "Potential Tilt (No)",
                },
                {
                  id: 3,
                  question: "3. Does this trade satisfy all predetermined criteria of my written trading plan?",
                  hint: "Trades executed outside your systematic edge generate random outcomes. Only trade high-expectancy setups.",
                  safeOption: true,
                  safeLabel: "Disciplined (Yes)",
                  tiltLabel: "Potential Tilt (No)",
                },
                {
                  id: 4,
                  question: "4. Is my position size small enough that a total loss will cause zero emotional distress?",
                  hint: "Oversizing triggers cortisol spikes. If a stop-out disrupts your peace of mind, reduce position size by 50%.",
                  safeOption: true,
                  safeLabel: "Disciplined (Yes)",
                  tiltLabel: "Potential Tilt (No)",
                },
              ].map((item) => {
                const answer = radarAnswers[item.id];
                const isSafeSelected = answer === item.safeOption;
                const isTiltSelected = answer === !item.safeOption;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-slate-800 bg-[#0e131d] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-slate-100">
                        {item.question}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.hint}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      {/* Disciplined Button */}
                      <button
                        onClick={() =>
                          setRadarAnswers((prev) => ({ ...prev, [item.id]: item.safeOption }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                          isSafeSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.safeLabel}</span>
                      </button>

                      {/* Potential Tilt Button */}
                      <button
                        onClick={() =>
                          setRadarAnswers((prev) => ({ ...prev, [item.id]: !item.safeOption }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                          isTiltSelected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{item.tiltLabel}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assessment Result Panel */}
            {answeredCount === 4 && (
              <div className="mt-6 max-w-3xl rounded-xl border border-slate-700 bg-[#0e131d] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Self-Reflection Indicator
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Disciplined Criteria: {disciplinedAnswersCount} / 4
                  </span>
                </div>

                {disciplinedAnswersCount === 4 ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">
                        Low Emotional-Risk Indicators
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        Pre-trade parameters are quantified, risk limits are respected, and composure is verified. Operating under probabilistic discipline.
                      </p>
                    </div>
                  </div>
                ) : disciplinedAnswersCount >= 2 ? (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-300">
                        Moderate Emotional-Risk Indicators
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        One or more risk factors flagged. Review position sizing and confirm predefined stop-loss order before executing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-300">
                        High Emotional-Risk Indicators
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        Elevated tilt or revenge tendencies detected. Step away from order entry screens until emotional baseline normalizes.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-sans">
                  * Note: This is a self-reflection composure tool and should not be treated as financial advice.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 4: CLASSIC BOOKSHELF (Editorial Treatises & Foundational Lessons)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'books' && (
        <div className="space-y-4">
          {expandedBook !== null ? (
            /* EXPANDED BOOK DOSSIER */
            (() => {
              const book = books.find((b) => b.id === expandedBook)!;
              return (
                <div className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 md:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                    <button
                      onClick={() => setExpandedBook(null)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span>Back to Bookshelf</span>
                    </button>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                      Executive Summary &amp; Key Lessons
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-7">
                    {/* Left: Book Cover Presentation */}
                    <div className="w-full lg:w-64 shrink-0 flex flex-col items-center text-center">
                      <div className="w-40 h-56 mb-4">
                        <BookCoverVisual book={book} />
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-0.5">{book.title}</h3>
                      <p className="text-xs text-slate-400 font-mono mb-2">By {book.author}</p>
                      
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <span>{book.year}</span>
                        <span>·</span>
                        <span>{book.genre}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= book.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Right: Core Thesis & 10 Foundational Lessons */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4 p-4 rounded-lg border border-slate-800 bg-[#0e131d]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                          Core Principle
                        </span>
                        <p className="text-sm font-medium text-slate-200 leading-snug">
                          "{book.keyLesson}"
                        </p>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-6">
                        {book.description}
                      </p>

                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 pb-1.5 border-b border-slate-800 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        Key Practical Lessons for Traders
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {book.importantLessons.map((lesson, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-[#0e131d] border border-slate-800/80 flex items-start gap-2.5"
                          >
                            <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setExpandedBook(book.id)}
                  className="rounded-xl border border-slate-800 bg-[#0c1017] hover:border-slate-700 p-4 flex flex-col justify-between transition shadow-sm cursor-pointer"
                >
                  <div className="flex gap-4 mb-3">
                    <div className="w-24 h-36 shrink-0">
                      <BookCoverVisual book={book} />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {book.genre}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{book.year}</span>
                        </div>

                        <h3 className="text-sm font-bold text-white hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                          {book.title}
                        </h3>

                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{book.author}</p>
                      </div>

                      <div className="flex items-center gap-1 pt-1">
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

                  <div className="pt-2.5 border-t border-slate-800/80">
                    <p className="text-xs text-slate-400 italic line-clamp-2">
                      "{book.keyLesson}"
                    </p>
                    
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500 text-[11px]">10 Master Lessons</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                        Explore <ArrowRight className="w-3 h-3" />
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
          SECTION 5: MASTERCLASS ESSAYS (Research Guides & Editorial Depth)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeSection === 'articles' && (
        <div className="space-y-4">
          {expandedArticle !== null ? (
            /* READER VIEW */
            (() => {
              const article = articles.find((a) => a.id === expandedArticle)!;
              return (
                <div className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                    <button
                      onClick={() => setExpandedArticle(null)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span>Back to Masterclass Essays</span>
                    </button>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>{article.readTime}</span>
                      <span>·</span>
                      <span>{article.category}</span>
                    </div>
                  </div>

                  <div className="max-w-3xl mx-auto">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 inline-block mb-2">
                      {article.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                      {article.title}
                    </h2>

                    <div className="mb-6 p-4 rounded-lg border-l-2 border-amber-400 bg-amber-500/[0.04]">
                      <p className="text-sm italic text-amber-200/90 leading-relaxed">
                        "{article.excerpt}"
                      </p>
                    </div>

                    <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                      {article.content.split('\n\n').map((block, idx) => {
                        if (block.startsWith('**') && block.endsWith('**')) {
                          return (
                            <h3 key={idx} className="text-base font-bold text-white pt-4 pb-1 border-b border-slate-800">
                              {block.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }

                        if (/^\d+\./.test(block)) {
                          return (
                            <div key={idx} className="space-y-2 pl-2">
                              {block.split('\n').map((line, liIdx) => (
                                <div key={liIdx} className="flex items-start gap-2.5">
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300 mt-0.5">
                                    {liIdx + 1}
                                  </span>
                                  <p className="text-sm text-slate-200">
                                    {line.replace(/^\d+\.\s*/, '')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <p key={idx} className="text-sm text-slate-300 leading-relaxed">
                            {block}
                          </p>
                        );
                      })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
                      <button
                        onClick={() => setExpandedArticle(null)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        <span>Return to Essays</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* ARTICLES GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setExpandedArticle(article.id)}
                  className="rounded-xl border border-slate-800 bg-[#0c1017] hover:border-slate-700 p-5 flex flex-col justify-between transition shadow-sm cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                        {article.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{article.readTime}</span>
                    </div>

                    <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors mb-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">{article.author}</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1 hover:underline">
                      Read Essay <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          6. COLOPHON / FOOTER AXIOM STRIP
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 text-center shadow-sm">
        <p className="text-slate-300 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed italic">
          "The game of speculation is the most uniformly fascinating game in the world. But it is not a game for the stupid, the mentally lazy, the person of inferior emotional balance, or the get-rich-quick adventurer."
        </p>
        <p className="text-[11px] text-amber-400/90 mt-2 font-mono uppercase tracking-wider">
          — Jesse Livermore, Reminiscences of a Stock Operator (1923)
        </p>
      </div>

    </div>
  );
};

export default TradingPsychology;
