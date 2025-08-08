// Initialize Chart.js
let priceChart;
const ctx = document.getElementById('priceChart').getContext('2d');

// Set default dates
document.addEventListener('DOMContentLoaded', function() {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  document.getElementById('startDate').valueAsDate = oneYearAgo;
  document.getElementById('endDate').valueAsDate = today;

  // Event listeners
  document.getElementById('searchBtn').addEventListener('click', searchStocks);
  document.getElementById('getHistoricalBtn').addEventListener('click', getHistoricalData);
  document.getElementById('getQuoteBtn').addEventListener('click', getQuote);

  // ✅ Handle symbol and name from URL
  const params = new URLSearchParams(window.location.search);
  const symbolFromUrl = params.get('symbol');
  const nameFromUrl = params.get('name'); // Get stock name from URL

  // Prioritize name over symbol for search
  if (nameFromUrl || symbolFromUrl) {
    const searchValue = nameFromUrl || symbolFromUrl;
    document.getElementById('searchQuery').value = searchValue;

    // Auto search and load stock details using the name
    fetch(`/api/search?q=${encodeURIComponent(searchValue)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const match = data.find(item => 
            item.symbol === symbolFromUrl || 
            item.shortname.toLowerCase().includes(nameFromUrl.toLowerCase())
          ) || data[0];
          
          // Fill Stock Data block
          document.getElementById('symbol').value = match.symbol;
          
          // Auto-load details
          getQuote();
          fetchStockNews(match.symbol);
          getHistoricalData();
        }
      })
      .catch(err => console.error("Auto-search error:", err));
  }
});

// Search for stocks
function searchStocks() {
  const query = document.getElementById('searchQuery').value.trim();
  if (!query) return;
  
  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  
  fetch(`/api/search?q=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(data => {
      displaySearchResults(data);
    })
    .catch(error => {
      resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    });
}

// Display search results
function displaySearchResults(results) {
  const resultsContainer = document.getElementById('searchResults');
  
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
    return;
  }
  
  let html = '';
  results.forEach(stock => {
    if (!stock.symbol || !stock.shortname) return;
    
    html += `
      <div class="search-item" data-symbol="${stock.symbol}">
        <div class="symbol">${stock.symbol}</div>
        <div class="name">${stock.shortname}</div>
        <div class="exchange">${stock.exchDisp || 'N/A'}</div>
      </div>
    `;
  });
  
  resultsContainer.innerHTML = html || '<div class="no-results">No results found</div>';
  
  // Add event listeners to search items
  document.querySelectorAll('.search-item').forEach(item => {
    item.addEventListener('click', function() {
      const symbol = this.getAttribute('data-symbol');
      document.getElementById('symbol').value = symbol;
      document.getElementById('searchQuery').value = '';
      resultsContainer.innerHTML = '';
      fetchStockNews(symbol);
    });
  });
}

// Get historical data
function getHistoricalData() {
  const symbol = document.getElementById('symbol').value.trim();
  if (!symbol) {
    alert('Please enter a stock symbol');
    return;
  }
  
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const interval = document.getElementById('interval').value;
  
  const resultsContainer = document.getElementById('historicalResults');
  resultsContainer.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  
  fetch(`/api/historical?symbol=${symbol}&startDate=${startDate}&endDate=${endDate}&interval=${interval}`)
    .then(response => response.json())
    .then(data => {
      displayHistoricalData(data, symbol);
    })
    .catch(error => {
      resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    });
}

// Display historical data
function displayHistoricalData(data, symbol) {
  const resultsContainer = document.getElementById('historicalResults');
  
  if (!data || data.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results">No historical data found</div>';
    return;
  }
  
  // Extract data for chart
  const labels = data.map(item => new Date(item.date).toLocaleDateString());
  const prices = data.map(item => item.close);
  
  // Create chart
  if (priceChart) {
    priceChart.destroy();
  }
  
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${symbol} Closing Price`,
        data: prices,
        borderColor: '#4fc3f7',
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#fff'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
  
  // Create table with first 5 results
  let tableHtml = `
    <div class="stock-info">
      <div class="stock-icon">
        ${symbol.substring(0, 1)}
      </div>
      <div class="stock-details">
        <div>
          <span class="stock-name">${symbol}</span>
          <span class="stock-symbol">Historical Data</span>
        </div>
        <div class="stock-price">
          ${prices[prices.length - 1].toFixed(2)}
          <span class="price-change">
            (${((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
    <p>Showing ${data.length} data points from ${new Date(data[data.length - 1].date).toLocaleDateString()} to ${new Date(data[0].date).toLocaleDateString()}</p>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Open</th>
            <th>High</th>
            <th>Low</th>
            <th>Close</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Show first 5 and last 5 results
  const displayData = [...data.slice(0, 5), ...data.slice(-5)];
  
  displayData.forEach(item => {
    tableHtml += `
      <tr>
        <td>${new Date(item.date).toLocaleDateString()}</td>
        <td>${item.open.toFixed(2)}</td>
        <td>${item.high.toFixed(2)}</td>
        <td>${item.low.toFixed(2)}</td>
        <td>${item.close.toFixed(2)}</td>
        <td>${item.volume.toLocaleString()}</td>
      </tr>
    `;
  });
  
  tableHtml += `
        </tbody>
      </table>
    </div>
  `;
  
  resultsContainer.innerHTML = tableHtml;
}

// Get current quote
function getQuote() {
  const symbol = document.getElementById('symbol').value.trim();
  if (!symbol) {
    alert('Please enter a stock symbol');
    return;
  }
  
  const resultsContainer = document.getElementById('historicalResults');
  resultsContainer.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  
  fetch(`/api/quote?symbol=${symbol}`)
    .then(response => response.json())
    .then(quote => {
      displayQuote(quote);
    })
    .catch(error => {
      resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    });
}

// Display quote
function displayQuote(quote) {
  const resultsContainer = document.getElementById('historicalResults');
  
  if (!quote || !quote.symbol) {
    resultsContainer.innerHTML = '<div class="no-results">No quote data found</div>';
    return;
  }
  
  const change = quote.regularMarketChange || 0;
  const changePercent = quote.regularMarketChangePercent || 0;
  const changeClass = change >= 0 ? 'positive' : 'negative';
  
  const html = `
    <div class="stock-info">
      <div class="stock-icon">
        ${quote.symbol.substring(0, 1)}
      </div>
      <div class="stock-details">
        <div>
          <span class="stock-name">${quote.shortName || quote.longName || 'N/A'}</span>
          <span class="stock-symbol">${quote.symbol}</span>
        </div>
        <div class="stock-price ${changeClass}">
          ${quote.regularMarketPrice?.toFixed(2) || 'N/A'}
          <span class="price-change">
            ${change >= 0 ? '+' : ''}${change?.toFixed(2) || 'N/A'} 
            (${changePercent >= 0 ? '+' : ''}${changePercent?.toFixed(2) || 'N/A'}%)
          </span>
        </div>
      </div>
    </div>
    
    <div class="quote-details">
      <table class="data-table">
        <tr>
          <td>Previous Close</td>
          <td>${quote.regularMarketPreviousClose?.toFixed(2) || 'N/A'}</td>
        </tr>
        <tr>
          <td>Open</td>
          <td>${quote.regularMarketOpen?.toFixed(2) || 'N/A'}</td>
        </tr>
        <tr>
          <td>Day Range</td>
          <td>${quote.regularMarketDayLow?.toFixed(2) || 'N/A'} - ${quote.regularMarketDayHigh?.toFixed(2) || 'N/A'}</td>
        </tr>
        <tr>
          <td>52 Week Range</td>
          <td>${quote.fiftyTwoWeekLow?.toFixed(2) || 'N/A'} - ${quote.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</td>
        </tr>
        <tr>
          <td>Volume</td>
          <td>${quote.regularMarketVolume?.toLocaleString() || 'N/A'}</td>
        </tr>
        <tr>
          <td>Market Cap</td>
          <td>${formatMarketCap(quote.marketCap)}</td>
        </tr>
      </table>
    </div>
  `;
  
  resultsContainer.innerHTML = html;
}

// Format market cap for display
function formatMarketCap(value) {
  if (!value) return 'N/A';
  
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

// ... [all previous code remains the same] ...

// FIXED: Fetch stock news
async function fetchStockNews(symbol) {
  const newsContainer = document.getElementById('newsResults');
  newsContainer.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  
  try {
    const response = await fetch(`/api/news?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const news = await response.json();
    displayNews(news);
  } catch (error) {
    console.error('News fetch error:', error);
    newsContainer.innerHTML = `
      <div class="error">
        Failed to load news: ${error.message}
        <div class="retry" onclick="fetchStockNews('${symbol}')">Retry</div>
      </div>
    `;
  }
}

// FIXED: Display news articles
function displayNews(news) {
  const newsContainer = document.getElementById('newsResults');
  
  // Ensure news is always treated as array
  if (!Array.isArray(news)) {
    news = [];
  }
  
  if (news.length === 0) {
    newsContainer.innerHTML = '<div class="no-results">No recent news found</div>';
    return;
  }
  
  const html = news.slice(0, 5).map(article => `
    <a href="${article.link}" target="_blank" class="news-item">
      <div class="news-source">${article.source} • ${new Date(article.date).toLocaleDateString()}</div>
      <div class="news-headline">${article.title}</div>
      <div class="news-summary">${article.description}</div>
    </a>
  `).join('');
  
  newsContainer.innerHTML = html;
}