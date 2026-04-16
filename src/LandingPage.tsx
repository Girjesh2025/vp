import { useState, useEffect } from 'react';
import { TrendingUp, Shield, BarChart3, ChevronRight, Sparkles, LineChart, PieChart, Wallet, ArrowUpRight, Zap, Star, Target, Users, BookOpen, Brain, IndianRupee } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '₹0', label: 'Real Money at Risk' },
    { value: 'NSE + BSE', label: 'Indian Stock Markets' },
    { value: 'Real-time', label: 'Live Market Data' },
    { value: '100%', label: 'Free to Use' },
  ];

  const features = [
    {
      icon: IndianRupee,
      title: 'Unlimited Virtual Capital',
      description: 'Start with unlimited virtual money. Build and test portfolios with NSE & BSE stocks without ever worrying about running out of funds.',
    },
    {
      icon: Target,
      title: 'Guru Scan (Pro Setup)',
      description: 'Discover stocks matching the exact criteria of legendary investors like Mark Minervini, Warren Buffett, and Peter Lynch.',
    },
    {
      icon: Zap,
      title: 'Options Trading Suite',
      description: 'Master F&O with our advanced Options Player, Options Watch, and Options Decode tools without any financial risk.',
    },
    {
      icon: TrendingUp,
      title: 'Swing Player',
      description: 'Identify and practice swing trading setups with real-time momentum tracking and technical analysis indicators.',
    },
    {
      icon: Brain,
      title: 'Trading Psychology',
      description: 'Improve your mental game with dedicated tools to track your trading emotions, discipline, and rule adherence.',
    },
    {
      icon: Shield,
      title: 'Zero Financial Risk',
      description: 'This is 100% paper trading. Practice advanced F&O and equity strategies freely — your real money is never touched.',
    },
    {
      icon: LineChart,
      title: 'Live NSE / BSE Prices',
      description: 'Track real-time prices of Nifty 50, Bank Nifty, Sensex, midcap, and smallcap stocks with live market data.',
    },
    {
      icon: PieChart,
      title: 'Position Calculator',
      description: 'Calculate ideal quantity, stop loss, and target for any trade based on your virtual capital and risk appetite.',
    },
    {
      icon: Wallet,
      title: 'Multiple Portfolios',
      description: 'Create separate portfolios — one for long-term, one for swing trading — and compare their performance.',
    },
  ];

  const howItWorks = [
    { step: '01', title: 'Sign Up Free', desc: 'Create your account in seconds. No KYC, no demat account needed.' },
    { step: '02', title: 'Search NSE / BSE Stocks', desc: 'Search any Indian stock — Reliance, TCS, Infosys, HDFC Bank, and thousands more.' },
    { step: '03', title: 'Add to Paper Portfolio', desc: 'Enter quantity and price. Your virtual capital is debited just like a real trade.' },
    { step: '04', title: 'Track & Learn', desc: 'Monitor P&L, get AI signals, and learn what works — without any financial risk.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"
          style={{ top: '10%', left: '10%', transform: `translateY(${scrollY * 0.3}px)`, transition: 'transform 0.1s ease-out' }} />
        <div className="absolute w-96 h-96 bg-green-500/15 rounded-full blur-3xl animate-pulse"
          style={{ top: '60%', right: '10%', animationDelay: '1s', transform: `translateY(${scrollY * -0.2}px)`, transition: 'transform 0.1s ease-out' }} />
        <div className="absolute w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"
          style={{ top: '40%', left: '50%', animationDelay: '2s', transform: `translateY(${scrollY * 0.15}px)`, transition: 'transform 0.1s ease-out' }} />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-slate-950/80 backdrop-blur-lg shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Paper
              </span>
              <span className="text-xl font-black text-white">Profit</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-300 hover:text-white transition-colors hidden md:block">Features</button>
            <button className="text-slate-300 hover:text-white transition-colors hidden md:block">How It Works</button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
            >
              Start Paper Trading
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">🇮🇳 India's Paper Trading Platform — NSE & BSE</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
              Trade Indian{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Stocks
                </span>
                <span className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 blur-xl opacity-30 animate-pulse"></span>
              </span>
              <br />
              <span className="text-5xl md:text-7xl">Without Losing Money</span>
            </h1>

            <p className="text-xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              <span className="text-emerald-400 font-bold">PaperProfit</span> is a free paper trading simulator for the Indian stock market.
              Practice buying and selling NSE & BSE stocks with <span className="text-emerald-400 font-semibold">unlimited virtual capital</span> — <span className="text-white font-semibold">zero real money at risk.</span>
            </p>
            <p className="text-base text-slate-500 mb-10 max-w-2xl mx-auto">
              Perfect for beginners, students, and experienced traders who want to test strategies before committing real capital.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Start Paper Trading — Free
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                No demat account · No KYC · 100% free
              </div>
            </div>
          </div>

          {/* Mock Dashboard Preview */}
          <div className={`mt-20 relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 blur-3xl" />
            <div className="relative bg-gradient-to-br from-slate-900/80 via-emerald-900/20 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-t-3xl"></div>
              
              {/* Paper trading badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">PaperProfit</span>
                  </div>
                  <span>·</span>
                  <span>Paper Portfolio Dashboard</span>
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-bold">
                  📄 PAPER TRADING
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:scale-105 hover:border-green-400/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-300 font-medium">Virtual Portfolio</span>
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <ArrowUpRight className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-green-400 mb-1">₹50,47,830</div>
                    <div className="text-sm text-green-400 font-medium">+24.78% Lifetime</div>
                    <div className="text-xs text-slate-500 mt-1">Virtual money only</div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6 hover:scale-105 hover:border-blue-400/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-300 font-medium">Today's P&L</span>
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-blue-400 mb-1">+₹3,240</div>
                    <div className="text-sm text-blue-400 font-medium">+0.26% Today</div>
                    <div className="text-xs text-slate-500 mt-1">Nifty up 0.4% today</div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 hover:scale-105 hover:border-emerald-400/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-300 font-medium">Holdings</span>
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <PieChart className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-emerald-400 mb-1">12</div>
                    <div className="text-sm text-emerald-400 font-medium">NSE / BSE Stocks</div>
                    <div className="text-xs text-slate-500 mt-1">TCS, INFY, RELIANCE…</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-slate-800/50 bg-gradient-to-r from-emerald-950/30 via-slate-950/50 to-emerald-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="group relative text-center transform hover:scale-110 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                <div className="relative">
                  <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-300 font-medium text-sm">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Simple & Fast</span>
            </div>
            <h2 className="text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">Get started in under 2 minutes — no broker account needed</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300">
                <div className="text-5xl font-black text-emerald-500/20 mb-3">{item.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-emerald-950/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
              <Star className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Everything You Need</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              Built for{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                Indian Traders
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              All the tools you need to practice and master the Indian stock market
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-slate-900/80 via-emerald-900/10 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-7 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transform hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Icon className="w-7 h-7 text-emerald-400 group-hover:text-green-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
            <div className="relative">
              <div className="text-6xl mb-6">📈</div>
              <h2 className="text-5xl font-bold mb-4">
                Start Your{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                  Paper Trading
                </span>{' '}
                Journey
              </h2>
              <p className="text-xl text-slate-300 mb-3 max-w-2xl mx-auto">
                Practice with <span className="text-emerald-400 font-bold">unlimited virtual money</span> on real NSE & BSE stocks and F&O.
                No risk. No losses. Pure learning.
              </p>
              <p className="text-slate-500 text-sm mb-8">No demat account needed. No real money. Just practice.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={onGetStarted}
                  className="group relative px-10 py-5 bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 flex items-center gap-2 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Create Free Account
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400 flex-wrap">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>NSE & BSE Stocks</span>
                </div>
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Zero Real Money Risk</span>
                </div>
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <span>AI-Powered Signals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-black">
                <span className="text-emerald-400">Paper</span>
                <span className="text-white">Profit</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              © {new Date().getFullYear()} PaperProfit · Paper trading simulator for Indian stock markets (NSE & BSE)
            </p>
            <p className="text-slate-600 text-xs text-center">
              ⚠️ This is a paper trading platform. No real money is involved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
