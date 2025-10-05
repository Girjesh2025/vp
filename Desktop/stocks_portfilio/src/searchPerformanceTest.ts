// Performance test for optimized search functions
import { 
  searchStocks, 
  searchStocksFast, 
  searchStocksOptimized, 
  searchStocksFuzzy,
  searchStocksAdvanced,
  getSearchPerformanceStats,
  clearSearchCache
} from './stockDatabase';

interface PerformanceResult {
  function: string;
  query: string;
  executionTime: number;
  resultCount: number;
  results: any[];
}

export function runSearchPerformanceTests(): PerformanceResult[] {
  const testQueries = [
    'REL',      // Short prefix
    'RELIANCE', // Exact match
    'Tata',     // Company name
    'Bank',     // Common word
    'IT',       // Sector
    'xyz123',   // Non-existent
    'HDFC',     // Popular prefix
    'Infosys',  // Full name
    'Oil',      // Sector partial
    'ICICI'     // Banking stock
  ];

  const results: PerformanceResult[] = [];

  // Clear cache before testing
  clearSearchCache();

  console.log('🚀 Starting Search Performance Tests...\n');

  testQueries.forEach(query => {
    console.log(`Testing query: "${query}"`);

    // Test original searchStocks
    const start1 = performance.now();
    const results1 = searchStocks(query);
    const end1 = performance.now();
    results.push({
      function: 'searchStocks (original)',
      query,
      executionTime: end1 - start1,
      resultCount: results1.length,
      results: results1.slice(0, 5) // Store first 5 results for comparison
    });

    // Test searchStocksFast
    const start2 = performance.now();
    const results2 = searchStocksFast(query);
    const end2 = performance.now();
    results.push({
      function: 'searchStocksFast',
      query,
      executionTime: end2 - start2,
      resultCount: results2.length,
      results: results2.slice(0, 5)
    });

    // Test optimized search
    const start3 = performance.now();
    const results3 = searchStocksOptimized(query);
    const end3 = performance.now();
    results.push({
      function: 'searchStocksOptimized',
      query,
      executionTime: end3 - start3,
      resultCount: results3.length,
      results: results3.slice(0, 5)
    });

    // Test fuzzy search
    const start4 = performance.now();
    const results4 = searchStocksFuzzy(query);
    const end4 = performance.now();
    results.push({
      function: 'searchStocksFuzzy',
      query,
      executionTime: end4 - start4,
      resultCount: results4.length,
      results: results4.slice(0, 5)
    });

    // Test advanced search with filters
    const start5 = performance.now();
    const results5 = searchStocksAdvanced(query, { 
      limit: 20, 
      exchange: 'NSE',
      fuzzy: true 
    });
    const end5 = performance.now();
    results.push({
      function: 'searchStocksAdvanced (NSE + fuzzy)',
      query,
      executionTime: end5 - start5,
      resultCount: results5.length,
      results: results5.slice(0, 5)
    });

    console.log(`  ✓ Completed tests for "${query}"\n`);
  });

  return results;
}

export function analyzePerformanceResults(results: PerformanceResult[]): void {
  console.log('\n📊 Performance Analysis Results:\n');

  // Group results by function
  const functionGroups = results.reduce((acc, result) => {
    if (!acc[result.function]) {
      acc[result.function] = [];
    }
    acc[result.function].push(result);
    return acc;
  }, {} as Record<string, PerformanceResult[]>);

  // Calculate average execution times
  Object.entries(functionGroups).forEach(([functionName, functionResults]) => {
    const avgTime = functionResults.reduce((sum, r) => sum + r.executionTime, 0) / functionResults.length;
    const avgResults = functionResults.reduce((sum, r) => sum + r.resultCount, 0) / functionResults.length;
    const minTime = Math.min(...functionResults.map(r => r.executionTime));
    const maxTime = Math.max(...functionResults.map(r => r.executionTime));

    console.log(`${functionName}:`);
    console.log(`  Average execution time: ${avgTime.toFixed(3)}ms`);
    console.log(`  Min/Max execution time: ${minTime.toFixed(3)}ms / ${maxTime.toFixed(3)}ms`);
    console.log(`  Average results returned: ${avgResults.toFixed(1)}`);
    console.log('');
  });

  // Performance stats
  const stats = getSearchPerformanceStats();
  console.log('🔍 Search System Statistics:');
  console.log(`  Total stocks in database: ${stats.totalStocks}`);
  console.log(`  Search cache size: ${stats.cacheStats.size}/${stats.cacheStats.maxSize}`);
  console.log(`  Index sizes:`);
  console.log(`    Symbol index: ${stats.indexSizes.symbols} entries`);
  console.log(`    Name index: ${stats.indexSizes.names} entries`);
  console.log(`    Sector index: ${stats.indexSizes.sectors} entries`);
  console.log('');

  // Find fastest function for each query
  const queryGroups = results.reduce((acc, result) => {
    if (!acc[result.query]) {
      acc[result.query] = [];
    }
    acc[result.query].push(result);
    return acc;
  }, {} as Record<string, PerformanceResult[]>);

  console.log('🏆 Fastest Function by Query:');
  Object.entries(queryGroups).forEach(([query, queryResults]) => {
    const fastest = queryResults.reduce((min, current) => 
      current.executionTime < min.executionTime ? current : min
    );
    console.log(`  "${query}": ${fastest.function} (${fastest.executionTime.toFixed(3)}ms, ${fastest.resultCount} results)`);
  });
}

export function runFullPerformanceTest(): void {
  console.log('🧪 Running comprehensive search performance test...\n');
  
  const results = runSearchPerformanceTests();
  analyzePerformanceResults(results);
  
  console.log('\n✅ Performance testing completed!');
  console.log('\n💡 Key Optimizations Implemented:');
  console.log('  • Pre-built search indexes for O(1) symbol lookups');
  console.log('  • Prefix-based indexing for fast partial matches');
  console.log('  • LRU cache with 5-minute TTL for frequent queries');
  console.log('  • Fuzzy search with Levenshtein distance');
  console.log('  • Debounced search to reduce API calls');
  console.log('  • Advanced filtering by exchange, market cap, and sector');
  console.log('  • Score-based result ranking for relevance');
}

// Export for console testing
(window as any).runSearchPerformanceTest = runFullPerformanceTest;
(window as any).searchPerformanceStats = getSearchPerformanceStats;