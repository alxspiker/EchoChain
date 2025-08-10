(function(){
  const containerId = 'resultsContainer';
  const statsId = 'statsBar';

  function buildTag(tag){
    const span = document.createElement('span');
    span.className = 'ec-tag';
    span.textContent = tag;
    return span;
  }

  function buildCard(item, tokens){
    const card = document.createElement('article');
    card.className = 'ec-card';

    const header = document.createElement('div');
    header.className = 'ec-card-header';

    const h = document.createElement('h3');
    h.className = 'ec-card-title';
    h.innerHTML = ECUtils.highlightText(item.title || item.id || 'Untitled', tokens);
    header.appendChild(h);

    const meta = document.createElement('div');
    meta.className = 'ec-card-meta';
    meta.textContent = `${item._type.toUpperCase()} • ${item.address || 'unknown addr'} • ${ECUtils.formatDate(item.timestamp)}`;
    header.appendChild(meta);
    card.appendChild(header);

    const preview = document.createElement('div');
    preview.className = 'ec-card-preview';

    let content = item.description || ECUtils.extractPreview(item.data || '', tokens, 300);
    preview.innerHTML = ECUtils.highlightText(content, tokens);
    card.appendChild(preview);

    if(item.tags && item.tags.length){
      const tags = document.createElement('div');
      tags.className = 'ec-card-tags';
      item.tags.slice(0,6).forEach(t => tags.appendChild(buildTag(t)));
      card.appendChild(tags);
    }

    return card;
  }

  function renderResults(results, tokens, append){
    const root = document.getElementById(containerId);
    if(!append) root.innerHTML = '';
    const frag = document.createDocumentFragment();
    results.forEach(item => frag.appendChild(buildCard(item, tokens)));
    root.appendChild(frag);
  }

  function renderStats(total, elapsedMs){
    const el = document.getElementById(statsId);
    el.textContent = `${total} result${total!==1?'s':''} • ${elapsedMs} ms`;
  }

  window.ECRender = { renderResults, renderStats };
})();
