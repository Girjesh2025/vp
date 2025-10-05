# 📈 Stock Portfolio App

A comprehensive React-based stock portfolio tracker with real-time market data, notifications, and market news from Indian stock exchanges (NSE/BSE).

## ✨ Features

### Core Portfolio Management
- 📈 Real-time stock price tracking
- 💼 Portfolio management (add/remove stocks)
- 📊 Live price updates with change indicators
- 🎯 Popular Indian stocks displayed by default
- 🔄 Automatic price refresh every 30 seconds
- 💰 Transaction history and P&L tracking

### Advanced Features (New!)
- 🔔 **Browser Notifications**: Price alerts, portfolio updates
- 📰 **Market News Panel**: Real-time market news with sentiment analysis
- ⚙️ **Smart Settings**: Configurable notifications and data refresh
- 📱 **Responsive Design**: Works on desktop and mobile
- 🔒 **Security Features**: Password management, 2FA options
- 📊 **Performance Analytics**: Portfolio performance tracking

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Girjesh2025/vp)

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Important Note About Real Market Data

**Indian Stock Market Data**: The free tier of Twelve Data API does not include Indian stock exchanges (NSE/BSE). Indian stocks require a paid subscription. Therefore:

- **Indian stocks** (RELIANCE, TCS, INFY, etc.) will show **realistic mock data**
- **US stocks** (AAPL, GOOGL, MSFT, etc.) will show **real market data** if you have an API key
- The app gracefully falls back to mock data when real data isn't available

To get real Indian stock data, you would need to upgrade to a paid Twelve Data plan or use a different API provider that offers free Indian market data.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Key (Optional but Recommended):**
   
   For real market data, get a free API key from [Twelve Data](https://twelvedata.com/pricing):
   
   - Create account at https://twelvedata.com/pricing
   - Get your free API key (800 requests/day)
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Add your API key to `.env`:
     ```
     VITE_TWELVEDATA_API_KEY=your_actual_api_key_here
     ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Usage

- **Add stocks:** Use the input field to add Indian stock symbols (e.g., RELIANCE, TCS, INFY)
- **Remove stocks:** Click the "×" button next to any stock
- **View prices:** Real-time prices update automatically
- **Popular stocks:** When portfolio is empty, popular Indian stocks are shown by default

## Supported Stock Symbols

The app supports NSE-listed stocks. Use standard symbols like:
- RELIANCE (Reliance Industries)
- TCS (Tata Consultancy Services)
- INFY (Infosys)
- HDFCBANK (HDFC Bank)
- ITC (ITC Limited)

## Technical Details

- **Frontend:** React + TypeScript + Vite
- **API:** Twelve Data for real market prices
- **Fallback:** Mock data when API is unavailable
- **Refresh:** Automatic updates every 30 seconds
- **CORS:** Handled via Vite dev proxy

## API Limits

- **Free Tier:** 800 requests per day
- **Rate Limiting:** Graceful fallback to mock data
- **Timeout:** 5-second request timeout with retry logic

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
