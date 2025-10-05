import { useState, useEffect } from 'react';
import { TrendingUp, Shield, DollarSign, BarChart3, ChevronRight, Sparkles, LineChart, PieChart, Wallet, ArrowUpRight, Zap, Star, Target, Users } from 'lucide-react';

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
    { value: '$2.5B+', label: 'Virtual Assets Traded' },
    { value: '50K+', label: 'Active Traders' },
    { value: '99.9%', label: 'Uptime' },
    { value: 'Real-time', label: 'Market Data' }
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'Real-Time Market Data',
      description: 'Track live stock prices and market movements with zero delay'
    },
    {
      icon: Shield,
      title: 'Risk-Free Trading',
      description: 'Practice trading strategies without risking your actual money'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive portfolio insights and performance tracking'
    },
    {
      icon: Wallet,
      title: 'Virtual Cash',
      description: 'Start with $100,000 virtual money to build your portfolio'
    },
    {
      icon: LineChart,
      title: 'Portfolio Tracking',
      description: 'Monitor your investments with beautiful, intuitive dashboards'
    },
    {
      icon: PieChart,
      title: 'Diversification Tools',
      description: 'Smart suggestions to balance your investment portfolio'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: '10%',
            left: '10%',
            transform: `translateY(${scrollY * 0.3}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
        <div
          className="absolute w-96 h-96 bg-green-500/15 rounded-full blur-3xl animate-pulse"
          style={{
            top: '60%',
            right: '10%',
            animationDelay: '1s',
            transform: `translateY(${scrollY * -0.2}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
        <div
          className="absolute w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse"
          style={{
            top: '40%',
            left: '50%',
            animationDelay: '2s',
            transform: `translateY(${scrollY * 0.15}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-slate-950/80 backdrop-blur-lg shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              StockSim
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-300 hover:text-white transition-colors">Features</button>
            <button className="text-slate-300 hover:text-white transition-colors">How It Works</button>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
               onClick={() => window.location.href = '/app'}
             >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6 animate-pulse">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">Trade Stocks Without Risk</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              Master the{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Stock Market
                </span>
                <span className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 blur-xl opacity-30 animate-pulse"></span>
              </span>
              <br />
              Without Spending a Dime
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Build and test your investment strategies with virtual money.
              Experience real market conditions and learn to trade like a professional.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => window.location.href = '/app'}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl font-semibold text-lg overflow-hidden transition-all duration-300 flex items-center gap-2"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Start Trading Free
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl font-semibold text-lg hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-300">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Mock Trading Dashboard Preview */}
          <div
            className={`mt-20 relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-green-500/20 to-blue-500/20 blur-3xl" />
            <div className="relative bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-green-500 to-blue-500 rounded-t-3xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:scale-105 hover:border-green-400/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-300 font-medium">Portfolio Value</span>
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <ArrowUpRight className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-green-400 mb-2">$127,450</div>
                    <div className="text-sm text-green-400 font-medium">+27.45% All Time</div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6 hover:scale-105 hover:border-blue-400/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-300 font-medium">Today's Gain</span>
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-blue-400 mb-2">$2,340</div>
                    <div className="text-sm text-blue-400 font-medium">+1.87% Today</div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-6 hover:scale-105 hover:border-purple-400/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-300 font-medium">Holdings</span>
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <PieChart className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-purple-400 mb-2">24</div>
                    <div className="text-sm text-purple-400 font-medium">Stocks & ETFs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-y border-slate-800/50 bg-gradient-to-r from-purple-950/30 via-slate-950/50 to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative text-center transform hover:scale-110 transition-all duration-300"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                <div className="relative">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent mb-2 animate-gradient bg-[length:200%_auto]">
                    {stat.value}
                  </div>
                  <div className="text-slate-300 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
              <Star className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Premium Features</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Professional trading tools without the financial risk
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-slate-900/80 via-purple-900/10 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-3 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-green-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Icon className="w-8 h-8 text-purple-400 group-hover:text-green-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{feature.description}</p>
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
          <div className="relative bg-gradient-to-r from-purple-500/10 via-green-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-green-500/5 to-blue-500/5 animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-green-500 to-blue-500"></div>
            <div className="relative">
              <div className="relative inline-block mb-6">
                <DollarSign className="w-20 h-20 mx-auto text-green-400 animate-bounce" />
                <div className="absolute inset-0 bg-green-400/30 blur-xl animate-pulse"></div>
              </div>
              <h2 className="text-5xl font-bold mb-4">
                Ready to Start Your{' '}
                <span className="bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Trading Journey?
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Join <span className="text-green-400 font-bold">50,000+</span> traders learning to invest with confidence
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                   onClick={onGetStarted}
                   className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 flex items-center gap-2"
                 >
                  <span className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Create Your Free Portfolio
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>50K+ Users</span>
                </div>
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>100% Risk Free</span>
                </div>
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Real-Time Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>© 2025 StockSim. Practice trading without the risk.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
