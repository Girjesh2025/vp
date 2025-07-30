import React, { useState, useEffect } from 'react';
import { Mail, Twitter, Linkedin, Github, Rocket, Clock, Users, Zap, Star, Sparkles, Heart } from 'lucide-react';

function App() {
  const [email, setEmail] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 45,
    hours: 12,
    minutes: 30,
    seconds: 15
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Simulate successful submission
        console.log('Email submitted:', email);
        setSubmitStatus('success');
        setSubmitMessage('🎉 Thank you! You\'ll be the first to know when we launch!');
        setEmail('');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitMessage('');
          setSubmitStatus(null);
        }, 5000);
      } catch (error) {
        setSubmitStatus('error');
        setSubmitMessage('Oops! Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 via-indigo-800 to-pink-900 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-500 to-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-6000"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-8000"></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-float-random opacity-20 ${
              i % 4 === 0 ? 'w-4 h-4 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full' :
              i % 4 === 1 ? 'w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-500 rotate-45' :
              i % 4 === 2 ? 'w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full' :
              'w-2 h-6 bg-gradient-to-br from-green-400 to-emerald-500'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-random ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Sparkle Effects */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`
            }}
          >
            <Star size={8 + Math.random() * 8} className="text-white opacity-60" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-white">
        {/* Animated Logo */}
        <div className="mb-8 animate-float-up">
          <div className="relative group">
            <div className="w-32 h-32 bg-gradient-to-br from-pink-400 via-purple-500 via-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-rainbow-glow transform hover:scale-110 transition-all duration-500">
              <div className="relative">
                <Rocket size={50} className="text-white animate-rocket-bounce" />
                <div className="absolute -top-2 -right-2">
                  <Sparkles size={16} className="text-yellow-300 animate-sparkle-rotate" />
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 bg-gradient-to-r from-pink-600 via-purple-600 via-blue-600 to-cyan-600 rounded-3xl blur-lg opacity-30 animate-pulse-rainbow group-hover:opacity-50 transition-opacity duration-500"></div>
            
            {/* Orbiting Elements */}
            <div className="absolute inset-0 animate-orbit">
              <div className="absolute -top-4 left-1/2 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"></div>
            </div>
            <div className="absolute inset-0 animate-orbit-reverse">
              <div className="absolute top-1/2 -right-4 w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
            </div>
          </div>
        </div>

        {/* Main Heading with Rainbow Text */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 via-cyan-400 via-green-400 to-yellow-400 bg-clip-text text-transparent mb-4 animate-rainbow-text bg-300% hover:scale-105 transition-transform duration-500">
            Coming Soon
          </h1>
          <div className="relative">
            <p className="text-xl md:text-3xl text-gray-200 max-w-3xl mx-auto leading-relaxed animate-text-glow">
              We're crafting something <span className="text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text font-semibold animate-pulse">extraordinary</span>. 
              A revolutionary platform that will <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text font-semibold animate-pulse">transform</span> the way you work.
            </p>
            <div className="absolute -top-4 -right-4">
              <Heart size={20} className="text-pink-400 animate-heartbeat" />
            </div>
          </div>
        </div>

        {/* Enhanced Countdown Timer */}
        <div className="mb-12 animate-fade-in-up animation-delay-500">
          <div className="grid grid-cols-4 gap-4 md:gap-8">
            {Object.entries(timeLeft).map(([unit, value], index) => (
              <div key={unit} className="text-center animate-scale-in-bounce" style={{animationDelay: `${index * 200}ms`}}>
                <div className="relative group">
                  <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-lg rounded-2xl p-4 md:p-8 border border-white/30 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-110 hover:rotate-1 transform-gpu">
                    <div className="text-4xl md:text-6xl font-bold text-transparent bg-gradient-to-br from-white via-cyan-200 to-purple-200 bg-clip-text mb-2 font-mono animate-number-pulse">
                      {value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm md:text-base text-gray-300 uppercase tracking-wider font-semibold">
                      {unit}
                    </div>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse-slow"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Features Preview */}
        <div className="mb-12 animate-fade-in-up animation-delay-1000">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Optimized for speed and performance', color: 'from-yellow-400 to-orange-500', bg: 'from-yellow-500/20 to-orange-500/20' },
              { icon: Users, title: 'Team Collaboration', desc: 'Built for modern teams', color: 'from-blue-400 to-cyan-500', bg: 'from-blue-500/20 to-cyan-500/20' },
              { icon: Clock, title: '24/7 Support', desc: 'Always here when you need us', color: 'from-green-400 to-emerald-500', bg: 'from-green-500/20 to-emerald-500/20' }
            ].map(({ icon: Icon, title, desc, color, bg }, index) => (
              <div key={title} className="relative group animate-slide-in-up" style={{animationDelay: `${1200 + index * 200}ms`}}>
                <div className={`text-center p-8 bg-gradient-to-br ${bg} backdrop-blur-lg rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 transform-gpu shadow-xl hover:shadow-2xl`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 transition-transform duration-500 animate-icon-float`}>
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-transparent bg-gradient-to-r from-white to-gray-200 bg-clip-text">{title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
                </div>
                <div className={`absolute -inset-2 bg-gradient-to-r ${color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Email Subscription */}
        <div className="mb-8 animate-fade-in-up animation-delay-1800">
          <div className="relative group">
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/30 shadow-2xl max-w-lg mx-auto hover:scale-105 transition-all duration-500 transform-gpu">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4 text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text animate-text-shimmer">Get Notified</h3>
                <p className="text-gray-300 text-lg">Be the first to experience the magic ✨</p>
              </div>
              
              {/* Status Message */}
              {submitMessage && (
                <div className={`mb-6 p-4 rounded-2xl text-center font-medium animate-fade-in-up ${
                  submitStatus === 'success' 
                    ? 'bg-green-500/20 border border-green-400/30 text-green-300' 
                    : 'bg-red-500/20 border border-red-400/30 text-red-300'
                }`}>
                  {submitMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors duration-300" size={24} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full pl-14 pr-6 py-4 bg-white/10 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-300 text-lg backdrop-blur-sm hover:bg-white/15 ${
                      submitStatus === 'error' 
                        ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' 
                        : 'border-white/30 focus:border-purple-400 focus:ring-purple-400/20'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 px-8 rounded-2xl transition-all duration-500 transform shadow-lg text-lg hover:-translate-y-1 ${
                    isSubmitting 
                      ? 'bg-gray-600 cursor-not-allowed opacity-70' 
                      : 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 hover:scale-105 hover:shadow-2xl animate-button-glow'
                  } text-white`}
                >
                  <span className="flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        Subscribing...
                        <div className="ml-2 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </>
                    ) : (
                      <>
                        Notify Me 
                        <Sparkles className="ml-2 animate-spin-slow" size={20} />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse-rainbow"></div>
          </div>
        </div>

        {/* Enhanced Social Links */}
        <div className="animate-fade-in-up animation-delay-2000">
          <div className="flex space-x-8">
            {[
              { icon: Twitter, href: '#', label: 'Twitter', color: 'from-blue-400 to-cyan-500' },
              { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'from-blue-600 to-blue-700' },
              { icon: Github, href: '#', label: 'GitHub', color: 'from-gray-600 to-gray-800' }
            ].map(({ icon: Icon, href, label, color }) => (
              <a
                key={label}
                href={href}
                className={`relative group w-16 h-16 bg-gradient-to-br ${color} backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 hover:border-white/50 hover:scale-125 hover:rotate-12 transition-all duration-500 shadow-lg hover:shadow-2xl transform-gpu animate-social-float`}
                aria-label={label}
              >
                <Icon size={28} className="text-white group-hover:scale-110 transition-transform duration-300" />
                <div className={`absolute -inset-2 bg-gradient-to-r ${color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes float-random {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
          50% { transform: translateY(-40px) translateX(-10px) rotate(180deg); }
          75% { transform: translateY(-20px) translateX(15px) rotate(270deg); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        
        @keyframes rainbow-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(147, 51, 234, 0.3); }
          25% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.5), 0 0 60px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(6, 182, 212, 0.3); }
          75% { box-shadow: 0 0 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(236, 72, 153, 0.3); }
        }
        
        @keyframes rainbow-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes rocket-bounce {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes sparkle-rotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }
        
        @keyframes orbit-reverse {
          0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(60px) rotate(360deg); }
        }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
          50% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(147, 51, 234, 0.3); }
        }
        
        @keyframes number-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes icon-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes text-shimmer {
          0%, 100% { background-position: -200% center; }
          50% { background-position: 200% center; }
        }
        
        @keyframes button-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.4); }
          50% { box-shadow: 0 0 40px rgba(147, 51, 234, 0.8), 0 0 60px rgba(236, 72, 153, 0.4); }
        }
        
        @keyframes social-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse-rainbow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(80px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in-bounce {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes float-up {
          from { opacity: 0; transform: translateY(100px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .animate-blob { animation: blob 7s infinite; }
        .animate-float-random { animation: float-random 6s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
        .animate-rainbow-glow { animation: rainbow-glow 3s ease-in-out infinite; }
        .animate-rainbow-text { animation: rainbow-text 4s ease infinite; }
        .animate-rocket-bounce { animation: rocket-bounce 2s ease-in-out infinite; }
        .animate-sparkle-rotate { animation: sparkle-rotate 3s linear infinite; }
        .animate-orbit { animation: orbit 8s linear infinite; }
        .animate-orbit-reverse { animation: orbit-reverse 6s linear infinite; }
        .animate-heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
        .animate-text-glow { animation: text-glow 2s ease-in-out infinite; }
        .animate-number-pulse { animation: number-pulse 1s ease-in-out infinite; }
        .animate-icon-float { animation: icon-float 3s ease-in-out infinite; }
        .animate-text-shimmer { animation: text-shimmer 3s ease-in-out infinite; background-size: 200% auto; }
        .animate-button-glow { animation: button-glow 2s ease-in-out infinite; }
        .animate-social-float { animation: social-float 4s ease-in-out infinite; }
        .animate-pulse-rainbow { animation: pulse-rainbow 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        
        .animate-fade-in-up { animation: fade-in-up 1s ease-out forwards; opacity: 0; }
        .animate-slide-in-up { animation: slide-in-up 1s ease-out forwards; opacity: 0; }
        .animate-scale-in-bounce { animation: scale-in-bounce 0.8s ease-out forwards; opacity: 0; }
        .animate-float-up { animation: float-up 1.2s ease-out forwards; opacity: 0; }
        
        .bg-300% { background-size: 300% 300%; }
        
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1800 { animation-delay: 1.8s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-6000 { animation-delay: 6s; }
        .animation-delay-8000 { animation-delay: 8s; }
      `}</style>
    </div>
  );
}

export default App;