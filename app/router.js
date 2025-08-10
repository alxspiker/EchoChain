(function(){
  function encodeState(state){
    const p = new URLSearchParams();
    if(state.query) p.set('q', state.query);
    if(state.selectedType && state.selectedType !== 'all') p.set('type', state.selectedType);
    if(state.dateFrom) p.set('from', state.dateFrom);
    if(state.dateTo) p.set('to', state.dateTo);
    if(state.liveMode) p.set('live', '1');
    return '#' + p.toString();
  }

  function parseState(){
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const p = new URLSearchParams(hash);
    return {
      query: p.get('q') || '',
      selectedType: p.get('type') || 'all',
      dateFrom: p.get('from') || '',
      dateTo: p.get('to') || '',
      liveMode: p.get('live') === '1'
    };
  }

  function pushState(state){
    const h = encodeState(state);
    if(window.location.hash !== h){
      window.history.pushState(null, '', h);
    }
  }

  window.ECRouter = { encodeState, parseState, pushState };
})();
