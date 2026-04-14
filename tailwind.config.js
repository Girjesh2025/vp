/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'slideIn': 'slideIn 0.5s ease-out',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient 15s ease infinite',
        'border-flow': 'border-flow 3s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      boxShadow: {
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)',
        'aurora': 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
      },
    },
  },
  plugins: [],
};