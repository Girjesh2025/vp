import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, BookOpen, MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: "Is the money real?",
    answer: "No, PaperProfit is a paper trading simulator. All funds are 100% virtual and meant for educational purposes. It allows you to practice trading without risking real capital."
  },
  {
    question: "Are the stock prices real-time?",
    answer: "Yes! We fetch live data from authentic real-world markets like Yahoo Finance and Alpha Vantage. However, please note that free APIs may have a standard 15-minute delay depending on the exchange."
  },
  {
    question: "How do I sell a stock and book profit?",
    answer: "Navigate to your 'Portfolio' tab. You will see a 'Sell' button next to each of your holdings. Click it, enter the quantity of shares you want to sell, and the system will automatically calculate your realized P&L."
  },
  {
    question: "What does the 'Risk Score' mean in Analytics?",
    answer: "The Risk Score is calculated based on how concentrated your portfolio is in specific sectors or single stocks. A score above 70 indicates high risk (poor diversification), while a lower score indicates a well-balanced, safer portfolio."
  },
  {
    question: "How do price alerts work?",
    answer: "You can set target prices for stocks you are watching. When the live market price crosses your target (either going above or dropping below), the alert triggers and glows emerald green in your Alert History."
  }
];

const HelpAndSupport: React.FC = () => {
  const [view, setView] = useState<'main' | 'faq' | 'guide'>('main');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  if (view === 'faq') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setView('main')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Help Center</span>
        </button>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
              <p className="text-slate-400">Everything you need to know about the platform.</p>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-xl transition-all duration-300 ${
                  expandedFaq === index 
                    ? 'bg-[#172030] border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'bg-[#131b26] border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className={`font-semibold ${expandedFaq === index ? 'text-white' : 'text-slate-300'}`}>
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-5 pt-0 text-slate-400 leading-relaxed border-t border-slate-800/50 mt-2">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'guide') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setView('main')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Help Center</span>
        </button>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Trading Guide</h2>
              <p className="text-slate-400">Master the basics of stock market investing.</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300">
            <section className="bg-[#172030] p-6 rounded-xl border border-slate-800">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">1. The Basics of Paper Trading</h3>
              <p className="leading-relaxed mb-4 text-slate-400">
                Paper trading is the process of buying and selling stocks with simulated virtual money. It allows you to test your investment strategies, learn market dynamics, and build confidence without the risk of losing real capital. Treat this simulator exactly as you would a real brokerage account.
              </p>
            </section>

            <section className="bg-[#172030] p-6 rounded-xl border border-slate-800">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">2. Understanding Order Types</h3>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <div>
                    <strong className="text-white">Market Order:</strong> 
                    <span className="text-slate-400 ml-2">Executes immediately at the current market price. Use this when speed is more important than the exact price.</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 shrink-0"></div>
                  <div>
                    <strong className="text-white">Limit Order:</strong> 
                    <span className="text-slate-400 ml-2">Sets a specific maximum price you are willing to pay (or minimum to sell). It only executes if the stock reaches your specified price.</span>
                  </div>
                </li>
              </ul>
            </section>

            <section className="bg-[#172030] p-6 rounded-xl border border-slate-800">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">3. Core Risk Management</h3>
              <p className="leading-relaxed mb-4 text-slate-400">
                The most important rule of trading is capital preservation. Never invest your entire portfolio into a single stock. Aim to hold between 5 to 15 different stocks across various sectors (e.g., Technology, Banking, Energy). Use our <strong>Precision Sizer</strong> tool to determine exactly how many shares you should buy based on your risk tolerance.
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Help & Support</h2>
          <p className="text-slate-400 mt-1">Get assistance with your paper trading journey</p>
        </div>
      </div>

      {/* Contact Support Card */}
      <div className="bg-gradient-to-br from-[#172030] to-[#111827] border border-slate-700/60 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <MessageCircle className="w-12 h-12 text-indigo-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">Technical Support</h3>
            <p className="text-slate-400 mb-6 max-w-lg">
              Experiencing issues with your portfolio, API connections, or account? Our lead technical support specialist is here to help you immediately.
            </p>
            
            <div className="inline-flex flex-wrap items-center gap-4 px-6 py-4 bg-slate-900/80 rounded-xl border border-slate-700">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact Person</span>
                <span className="text-lg font-bold text-white">Mr. Rajat</span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-slate-700"></div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Direct Line</span>
                <a href="tel:9090909090" className="text-lg font-black text-indigo-400 hover:text-indigo-300 transition-colors">
                  9090909090
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div 
          onClick={() => setView('faq')}
          className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">FAQs</h4>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">Browse our frequently asked questions about paper trading, fake money, and platform features.</p>
        </div>

        <div 
          onClick={() => setView('guide')}
          className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Trading Guide</h4>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">Learn the basics of simulated trading, order types, portfolio building, and risk management.</p>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;