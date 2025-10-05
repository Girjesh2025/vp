const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for EODHD API
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const apiToken = '68ded7adeebd01.04469623';
    
    const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${apiToken}&fmt=json`;
    
    console.log(`Fetching data for ${symbol} from EODHD...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Stock Portfolio App/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`EODHD API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate the response
    if (!data || typeof data.close !== 'number') {
      throw new Error('Invalid data received from EODHD API');
    }
    
    console.log(`Successfully fetched ${symbol}: ${data.close}`);
    res.json(data);
    
  } catch (error) {
    console.error(`Error fetching ${req.params.symbol}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Stock API endpoint: http://localhost:${PORT}/api/stock/{symbol}`);
});