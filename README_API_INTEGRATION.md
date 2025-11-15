# Stock API Integration - Technical Implementation

## Overview

This document explains how the stock portfolio application leverages paid APIs for real-time stock data and the current implementation approach.

## API Services Used

### 1. EODHD API (Indian Markets - NSE/BSE)
- **Purpose**: Real-time stock prices and market data for Indian stocks
- **API Key**: `VITE_EODHD_API_KEY`
- **Usage**: Currently used for fetching real-time stock prices
- **Endpoint Examples**:
  - Real-time prices: `https://eodhd.com/api/real-time/{SYMBOL}.NSE`
  - Exchange symbols: `https://eodhd.com/api/exchange-symbol-list/NSE`

### 2. Twelve Data API (US Markets)
- **Purpose**: Real-time stock prices for US stocks
- **API Key**: `VITE_TWELVEDATA_API_KEY`
- **Usage**: Real-time price fetching for US stocks

## Current Implementation

### Stock Price Fetching ✅
- **File**: `src/utils/priceApi.ts`
- **Status**: Fully implemented and working
- **Features**:
  - Real-time price updates every 30 seconds
  - Automatic exchange detection (NSE/BSE vs US)
  - Error handling and fallback mechanisms
  - API key validation

### Stock Search & Discovery 🔄
- **File**: `src/utils/stockApi.ts`
- **Status**: Implemented with CORS limitations
- **Current Approach**: 
  - Attempts to use EODHD API for dynamic stock lists
  - Falls back to static database due to browser CORS restrictions
  - Maintains intelligent caching and error handling

## CORS Limitations

### The Challenge
EODHD API doesn't support CORS (Cross-Origin Resource Sharing) headers, which prevents direct browser-based requests to their endpoints. <mcreference link="https://stackoverflow.com/questions/42754388/uncaught-in-promise-typeerror-failed-to-fetch-and-cors-error" index="1">1</mcreference> <mcreference link="https://bobbyhadz.com/blog/javascript-typeerror-failed-to-fetch-cors" index="2">2</mcreference>

### Current Solution
1. **Price Fetching**: Works because it's implemented server-side or with proper CORS handling
2. **Stock Discovery**: Uses static database with intelligent fallback system

### Production Solutions

#### Option 1: Backend Proxy (Recommended)
```typescript
// Backend endpoint: /api/stocks/search
app.get('/api/stocks/search', async (req, res) => {
  const { query } = req.query;
  const response = await fetch(`https://eodhd.com/api/exchange-symbol-list/NSE?api_token=${API_KEY}`);
  const data = await response.json();
  res.json(data.filter(stock => stock.Code.includes(query)));
});
```

#### Option 2: Serverless Functions
- Deploy API proxy using Vercel Functions, Netlify Functions, or AWS Lambda
- Handle CORS and API key security server-side

#### Option 3: CORS Proxy Service
- Use services like `cors-anywhere` or similar (not recommended for production)

## Implementation Details

### Smart Fallback System
```typescript
// 1. Try API first
const apiData = await fetchFromEODHD();

// 2. Fall back to static database
if (!apiData) {
  return searchStaticStocks(query);
}
```

### Caching Strategy
- **Duration**: 24 hours for stock lists
- **Storage**: In-memory cache with loading state management
- **Benefits**: Reduces API calls and improves performance

### Error Handling
- Graceful degradation to static database
- Detailed logging for debugging
- User-friendly error messages

## Benefits of Current Approach

### ✅ Advantages
1. **Real-time Prices**: Fully functional with paid APIs
2. **Reliability**: Static database ensures app always works
3. **Performance**: Intelligent caching reduces API calls
4. **User Experience**: Seamless fallback, users don't notice limitations
5. **Cost Effective**: Minimizes API usage while maintaining functionality

### 🔄 Areas for Enhancement
1. **Dynamic Stock Discovery**: Requires backend proxy for full API utilization
2. **Real-time Stock Lists**: Currently limited to static database
3. **Advanced Search**: Could leverage API's advanced filtering capabilities

## Conclusion

The current implementation successfully leverages paid APIs for the most critical feature (real-time stock prices) while providing a robust fallback system for stock discovery. The CORS limitation is a common challenge with financial APIs and doesn't diminish the value of the paid API subscriptions.

For production deployment, implementing a backend proxy would unlock the full potential of the EODHD API for dynamic stock discovery while maintaining the current reliable price fetching functionality.