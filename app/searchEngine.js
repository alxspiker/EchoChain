(function(){
  const sameOrigin = '';
  const localDev = `${window.location.protocol}//${window.location.hostname}:8787`;
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? localDev : sameOrigin;

  async function search(query, filters){
    const started = performance.now();
    const params = new URLSearchParams();
    if(query) params.set('q', query);
    if(filters.selectedType && filters.selectedType !== 'all') params.set('type', filters.selectedType);
    if(filters.dateFrom) params.set('from', filters.dateFrom);
    if(filters.dateTo) params.set('to', filters.dateTo);

    const res = await fetch(`${API_BASE}/api/search?${params.toString()}`, { headers: { 'Accept': 'application/json' } });
    if(!res.ok) throw new Error('Search failed');
    const json = await res.json();

    const elapsed = performance.now() - started;
    return { results: json.results || [], elapsedMs: Math.round(elapsed), tokens: ECUtils.tokenize(query) };
  }

  function paginate(results, page, pageSize){
    const start = (page-1) * pageSize; const end = start + pageSize;
    return results.slice(start, end);
  }

  window.ECSearch = { search, paginate };
})();
