(function(){
  const searchInput = () => document.getElementById('searchInput');
  const searchForm = () => document.getElementById('searchForm');
  const typeFilter = () => document.getElementById('typeFilter');
  const dateFrom = () => document.getElementById('dateFrom');
  const dateTo = () => document.getElementById('dateTo');
  const liveToggle = () => document.getElementById('liveModeToggle');
  const loadMoreBtn = () => document.getElementById('loadMoreButton');

  const piAuthButton = () => document.getElementById('piAuthButton');
  const piUserDisplay = () => document.getElementById('piUserDisplay');
  const addResultButton = () => document.getElementById('addResultButton');
  const addModal = () => document.getElementById('addModal');
  const addCancel = () => document.getElementById('addCancel');
  const addForm = () => document.getElementById('addForm');
  const addTitle = () => document.getElementById('addTitle');
  const addDescription = () => document.getElementById('addDescription');
  const addTags = () => document.getElementById('addTags');
  const addType = () => document.getElementById('addType');
  const addData = () => document.getElementById('addData');

  let currentUser = null;
  let grantedScopes = new Set();

  function setMode(isResultsMode){
    const body = document.body;
    if(isResultsMode){ body.classList.remove('landing'); body.classList.add('results-mode'); }
    else { body.classList.add('landing'); body.classList.remove('results-mode'); }
  }

  function syncUIToState(){
    searchInput().value = AppState.query || '';
    typeFilter().value = AppState.selectedType || 'all';
    dateFrom().value = AppState.dateFrom || '';
    dateTo().value = AppState.dateTo || '';
    liveToggle().checked = !!AppState.liveMode;
  }

  function syncStateToRouter(){
    ECRouter.pushState({
      query: AppState.query,
      selectedType: AppState.selectedType,
      dateFrom: AppState.dateFrom,
      dateTo: AppState.dateTo,
      liveMode: AppState.liveMode
    });
  }

  function updateAuthUI(){
    if(currentUser){
      piUserDisplay().textContent = `@${currentUser.username}`;
      piAuthButton().textContent = 'Signed in';
      piAuthButton().disabled = true;
    } else {
      piUserDisplay().textContent = '';
      piAuthButton().textContent = 'Sign in with Pi';
      piAuthButton().disabled = false;
    }
  }

  async function requirePiBrowser(){
    const isPi = await ECUtils.detectPiBrowser();
    if(!isPi){
      alert('Open this app in Pi Browser to use authentication and payments.');
      return false;
    }
    return true;
  }

  async function authenticateWithPi(requiredScopes = ['payments','username']){
    if(!window.Pi){ alert('Pi SDK not loaded'); return; }
    if(!(await requirePiBrowser())) return;
    try {
      const onIncompletePaymentFound = (payment) => { console.log('Incomplete payment found', payment); };
      const auth = await Pi.authenticate(requiredScopes, onIncompletePaymentFound);
      currentUser = auth.user; // { username, uid, credentials }
      const scopes = auth?.user?.credentials?.scopes || auth?.credentials?.scopes || requiredScopes;
      grantedScopes = new Set(scopes);
      updateAuthUI();
    } catch (e) {
      console.error('Pi auth failed', e);
      alert('Pi authentication failed.');
    }
  }

  async function ensurePaymentsScope(){
    if(!grantedScopes.has('payments')){
      await authenticateWithPi(['payments','username']);
    }
    return grantedScopes.has('payments');
  }

  function openAddModal(){ addModal().classList.remove('hidden'); }
  function closeAddModal(){ addModal().classList.add('hidden'); addForm().reset(); }

  async function startPublishPayment(payload){
    if(!window.Pi){ alert('Pi SDK not loaded'); return; }
    if(!(await requirePiBrowser())) return;
    if(!currentUser){ await authenticateWithPi(['payments','username']); if(!currentUser) return; }
    if(!(await ensurePaymentsScope())){ alert('Payments permission is required. Please grant the payments scope.'); return; }

    const memo = `EchoChain publish:${(payload.title||'').slice(0,40)}`;
    const metadata = { kind: 'echomain_publish_v1', title: payload.title, description: payload.description, tags: payload.tags, contentTypeHint: payload.contentTypeHint, data: payload.data };

    const paymentData = { amount: 0.0001, memo, metadata };
    const paymentCallbacks = {
      onReadyForServerApproval: async (paymentId) => { await fetch('/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) }); },
      onReadyForServerCompletion: async (paymentId, txid) => { await fetch('/payments/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId, txid }) }); },
      onCancel: (paymentId) => { console.log('Payment cancelled', paymentId); },
      onError: (error, payment) => { console.error('Payment error', error, payment); alert('Payment error.'); },
    };

    try {
      const payment = await Pi.createPayment(paymentData, paymentCallbacks);
      console.log('Payment initiated', payment);
      alert('Publish payment sent. It may take a moment to appear in search.');
      closeAddModal();
      runSearch(true);
    } catch (e) {
      console.error('Payment initiation failed', e);
      alert('Payment initiation failed.');
    }
  }

  async function runSearch(resetPage=true){
    const hasQuery = (AppState.query || '').trim().length > 0;
    if(!hasQuery){ setMode(false); AppState.results = []; AppState.totalResults = 0; AppState.lastSearchMs = 0; ECRender.renderResults([], [], false); ECRender.renderStats(0, 0); loadMoreBtn().classList.add('hidden'); return; }

    if(resetPage){ AppState.currentPage = 1; }
    const { results, elapsedMs, tokens } = await ECSearch.search(AppState.query, { selectedType: AppState.selectedType, dateFrom: AppState.dateFrom, dateTo: AppState.dateTo });

    setMode(true);

    AppState.results = results; AppState.totalResults = results.length; AppState.lastSearchMs = elapsedMs;

    const pageItems = ECSearch.paginate(results, AppState.currentPage, AppState.pageSize);
    ECRender.renderResults(pageItems, tokens, false);
    ECRender.renderStats(AppState.totalResults, elapsedMs);

    if(AppState.totalResults > AppState.pageSize){ loadMoreBtn().classList.remove('hidden'); } else { loadMoreBtn().classList.add('hidden'); }
  }

  function attachEvents(){
    searchForm().addEventListener('submit', (e)=>{ e.preventDefault(); AppState.query = searchInput().value.trim(); syncStateToRouter(); runSearch(true); });

    const debounced = ECUtils.debounce(()=>{ /* keep landing until submit */ }, 250);
    searchInput().addEventListener('input', debounced);

    typeFilter().addEventListener('change', ()=>{ AppState.selectedType = typeFilter().value; syncStateToRouter(); runSearch(true); });
    dateFrom().addEventListener('change', ()=>{ AppState.dateFrom = dateFrom().value; syncStateToRouter(); runSearch(true); });
    dateTo().addEventListener('change', ()=>{ AppState.dateTo = dateTo().value; syncStateToRouter(); runSearch(true); });

    liveToggle().addEventListener('change', ()=>{ AppState.liveMode = liveToggle().checked; syncStateToRouter(); if(AppState.liveMode){ console.log('Live mode enabled'); } });

    loadMoreBtn().addEventListener('click', ()=>{ AppState.currentPage += 1; const { tokens } = { tokens: ECUtils.tokenize(AppState.query) }; const pageItems = ECSearch.paginate(AppState.results, AppState.currentPage, AppState.pageSize); ECRender.renderResults(pageItems, tokens, true); if(AppState.currentPage * AppState.pageSize >= AppState.totalResults){ loadMoreBtn().classList.add('hidden'); } });

    piAuthButton().addEventListener('click', ()=> authenticateWithPi(['payments','username']));

    addResultButton().addEventListener('click', async ()=>{
      if(!(await requirePiBrowser())) return;
      if(!currentUser){ await authenticateWithPi(['payments','username']); if(!currentUser) return; }
      if(!(await ensurePaymentsScope())) return;
      openAddModal();
    });
    addCancel().addEventListener('click', closeAddModal);

    addForm().addEventListener('submit', (e)=>{ e.preventDefault(); const payload = { title: addTitle().value.trim(), description: addDescription().value.trim(), tags: addTags().value.split(',').map(s=>s.trim()).filter(Boolean), contentTypeHint: addType().value, data: addData().value }; startPublishPayment(payload); });

    window.addEventListener('popstate', ()=>{ const st = ECRouter.parseState(); Object.assign(AppState, st); syncUIToState(); runSearch(true); });
  }

  async function init(){ const st = ECRouter.parseState(); Object.assign(AppState, st); syncUIToState(); attachEvents(); await runSearch(true); }

  document.addEventListener('DOMContentLoaded', init);
})();
