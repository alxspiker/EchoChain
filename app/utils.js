(function(){
  function debounce(fn, wait){
    let t; return function(){
      const ctx=this, args=arguments; clearTimeout(t);
      t = setTimeout(()=>fn.apply(ctx,args), wait);
    }
  }

  function escapeHTML(str){
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function normalize(str){
    return (str||'').toLowerCase();
  }

  function tokenize(query){
    return normalize(query).split(/\s+/).filter(Boolean);
  }

  function highlightText(text, tokens){
    if(!text) return '';
    let safe = escapeHTML(text);
    tokens.forEach(tok => {
      if(!tok) return;
      const re = new RegExp(`(${tok.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi');
      safe = safe.replace(re, '<mark>$1</mark>');
    });
    return safe;
  }

  function detectContentType(item){
    if(item.contentTypeHint) return item.contentTypeHint;
    const data = (item.data||'').trim();
    const starts = data.slice(0, 200).toLowerCase();
    if(/^\s*\{[\s\S]*\}|^\s*\[[\s\S]*\]/.test(data)) return 'json';
    if(/<\s*html|<\s*body|<\s*div|<\s*p|<\s*h[1-6]/.test(starts)) return 'html';
    if(/^\s{0,3}(#{1,6}\s|[-*+]\s|```|>\s|\|)/m.test(starts)) return 'markdown';
    if(/pragma solidity|contract\s+|function\s+|class\s+|#include\s+|import\s+/.test(starts)) return 'code';
    if(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data.replace(/\n|\r/g,'')) && data.length>64) return 'binary';
    return 'text';
  }

  function formatDate(iso){
    if(!iso) return '';
    const d = new Date(iso);
    if(!isFinite(d)) return '';
    return d.toISOString().slice(0,19).replace('T',' ');
  }

  function clamp(num, min, max){ return Math.max(min, Math.min(max, num)); }

  function extractPreview(data, tokens, maxLen=320){
    const lower = (data||'').toLowerCase();
    let idx = -1;
    for(const t of tokens){
      const i = lower.indexOf(t);
      if(i !== -1){ idx = i; break; }
    }
    if(idx === -1){
      return (data||'').slice(0, maxLen);
    }
    const start = clamp(idx - Math.floor(maxLen/2), 0, Math.max(0, (data||'').length - maxLen));
    return (data||'').slice(start, start + maxLen);
  }

  window.ECUtils = {
    debounce, escapeHTML, normalize, tokenize, highlightText, detectContentType, formatDate, extractPreview
  };
})();
