(function(){
  window.AppState = {
    query: '',
    selectedType: 'all',
    dateFrom: '', // YYYY-MM-DD
    dateTo: '',   // YYYY-MM-DD
    liveMode: false,
    pageSize: 10,
    currentPage: 1,
    totalResults: 0,
    results: [],
    lastSearchMs: 0,
  };
})();
