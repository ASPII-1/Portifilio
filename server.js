const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3050;

app.use(express.static(path.join(__dirname, 'public')));

// API: Search stock symbols
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await yahooFinance.search(q);
    res.json(results.quotes.filter(item => item.quoteType === 'EQUITY'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get quote details
app.get('/api/quote', async (req, res) => {
  try {
    const { symbol } = req.query;
    const quote = await yahooFinance.quote(symbol);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Historical data
app.get('/api/historical', async (req, res) => {
  try {
    const { symbol, startDate, endDate, interval } = req.query;
    const data = await yahooFinance.historical(symbol, {
      period1: new Date(startDate),
      period2: new Date(endDate),
      interval
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Stock news (FIXED)
app.get('/api/news', async (req, res) => {
  try {
    const { symbol } = req.query;
    const newsResult = await yahooFinance.search(symbol, { 
      newsCount: 10,
      quotesCount: 0
    });
    
    // Properly handle news array
    const newsItems = newsResult.news || [];
    
    const formattedNews = newsItems.map(({ title, publisher, date, link, content }) => ({
      title: title || 'No title',
      source: publisher || 'Unknown source',
      date: date ? new Date(date * 1000).toISOString() : new Date().toISOString(),
      link: link || '#',
      description: content ? content.substring(0, 200) + '...' : 'No description available'
    }));
    
    res.json(formattedNews);
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});