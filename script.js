(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Storage keys
  const USERS_KEY = 'reviewhub.users';
  const CURRENT_USER_KEY = 'reviewhub.currentUser';
  const REVIEWS_KEY = 'reviewhub.reviews';
  
  // Global shared storage simulation (works across browsers via URL sharing)
  let globalSharedReviews = {};
  
  // Try to load any existing global data from a special storage key
  try {
    const saved = localStorage.getItem('reviewhub.global.shared');
    if (saved) {
      globalSharedReviews = JSON.parse(saved);
    }
  } catch(_e) {
    globalSharedReviews = {};
  }

  // Elements
  const els = {
    // Modals
    loginModal: $('#loginModal'),
    shareModal: $('#shareModal'),
    closeLoginModal: $('#closeLoginModal'),
    closeShareModal: $('#closeShareModal'),
    
    // Login form
    loginUsername: $('#loginUsername'),
    loginPassword: $('#loginPassword'),
    loginBtn: $('#loginBtn'),
    registerBtn: $('#registerBtn'),
    loginError: $('#loginError'),
    showLoginBtn: $('#showLoginBtn'),
    
    // User interface
    userBar: $('#userBar'),
    currentUser: $('#currentUser'),
    logoutBtn: $('#logoutBtn'),
    loginPrompt: $('#loginPrompt'),
    mainContent: $('#mainContent'),
    shareReviewsBtn: $('#shareReviewsBtn'),
    shareLink: $('#shareLink'),
    copyLinkBtn: $('#copyLinkBtn'),
    
    // Public view
    publicView: $('#publicView'),
    publicUsername: $('#publicUsername'),
    publicList: $('#publicList'),
    publicEmpty: $('#publicEmpty'),

    // Tabs
    tabs: $$('.tab'),
    tabAdd: $('#tab-add'),
    tabBrowse: $('#tab-browse'),
    tabAbout: $('#tab-about'),

    // Form elements
    type: $('#type'),
    otherTitleWrap: $('#otherTitleWrap'),
    otherTitle: $('#otherTitle'),
    spotifyInputWrap: $('#spotifyInputWrap'),
    spotifyUrl: $('#spotifyUrl'),
    otherFields: $('#otherFields'),
    otherSubtitle: $('#otherSubtitle'),
    otherImage: $('#otherImage'),
    score: $('#score'),
    scoreOut: $('#scoreOut'),
    manualScore: $('#manualScore'),
    review: $('#review'),
    previewBtn: $('#previewBtn'),
    previewPane: $('#previewPane'),
    saveBtn: $('#saveBtn'),
    clearFormBtn: $('#clearFormBtn'),
    statsPill: $('#statsPill'),

    // Browse elements
    q: $('#q'),
    filterType: $('#filterType'),
    sortBy: $('#sortBy'),
    list: $('#list'),
    emptyList: $('#emptyList'),
    exportBtn: $('#exportBtn'),
    importInput: $('#importInput'),
    wipeBtn: $('#wipeBtn')
  };

  let currentUser = null;

  // Initialize
  init();

  function init() {
    setupEventListeners();
    loadCurrentUser();
    
    // Check if we're viewing a shared review collection
    const urlParams = new URLSearchParams(globalThis.location.search);
    const shareData = urlParams.get('share');
    const publicUser = urlParams.get('user');
    
    if (shareData) {
      const decodedData = loadSharedDataFromUrl(shareData);
      if (decodedData) {
        showSharedView(decodedData);
        return;
      } else {
        console.error('Invalid share data');
        // Continue to normal flow
      }
    }
    
    if (publicUser) {
      showPublicView(publicUser);
    } else if (currentUser) {
      showMainApp();
    } else {
      showLoginPrompt();
    }
  }

  function setupEventListeners() {
    // Login/Register
    els.showLoginBtn.addEventListener('click', showLoginModal);
    els.closeLoginModal.addEventListener('click', hideLoginModal);
    els.closeShareModal.addEventListener('click', hideShareModal);
    els.loginBtn.addEventListener('click', handleLogin);
    els.registerBtn.addEventListener('click', handleRegister);
    els.logoutBtn.addEventListener('click', handleLogout);
    
    // Share
    els.shareReviewsBtn.addEventListener('click', showShareModal);
    els.copyLinkBtn.addEventListener('click', copyShareLink);

    // Close modals on outside click
    els.loginModal.addEventListener('click', (e) => {
      if (e.target === els.loginModal) hideLoginModal();
    });
    els.shareModal.addEventListener('click', (e) => {
      if (e.target === els.shareModal) hideShareModal();
    });

    // Tabs
    els.tabs.forEach(t => t.addEventListener('click', () => {
      els.tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      
      els.tabAdd.style.display = 'none';
      els.tabBrowse.style.display = 'none';
      els.tabAbout.style.display = 'none';
      
      const id = t.dataset.tab;
      if (id === 'add') els.tabAdd.style.display = '';
      else if (id === 'browse') {
        els.tabBrowse.style.display = '';
        renderList();
      }
      else if (id === 'about') els.tabAbout.style.display = '';
    }));

    // Form
    els.type.addEventListener('change', handleTypeChange);
    els.score.addEventListener('input', updateScoreDisplay);
    els.manualScore.addEventListener('input', handleManualScoreInput);
    els.previewBtn.addEventListener('click', handlePreview);
    els.saveBtn.addEventListener('click', handleSave);
    els.clearFormBtn.addEventListener('click', clearForm);

    // Search/filter
    ['input', 'change'].forEach(evt => {
      els.q.addEventListener(evt, renderList);
      els.filterType.addEventListener(evt, renderList);
      els.sortBy.addEventListener(evt, renderList);
    });

    // Import/Export/Wipe
    els.exportBtn.addEventListener('click', exportData);
    els.importInput.addEventListener('change', importData);
    els.wipeBtn.addEventListener('click', wipeData);
  }

  // User Management
  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch(_e) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function loadCurrentUser() {
    const username = localStorage.getItem(CURRENT_USER_KEY);
    if (username) {
      const users = loadUsers();
      if (users[username]) {
        currentUser = username;
        els.currentUser.textContent = username;
        return true;
      }
    }
    return false;
  }

  function setCurrentUser(username) {
    currentUser = username;
    localStorage.setItem(CURRENT_USER_KEY, username);
    els.currentUser.textContent = username;
  }

  function clearCurrentUser() {
    currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // UI State Management
  function showLoginPrompt() {
    els.loginPrompt.style.display = '';
    els.mainContent.style.display = 'none';
    els.userBar.style.display = 'none';
    els.publicView.style.display = 'none';
  }

  function showMainApp() {
    els.loginPrompt.style.display = 'none';
    els.mainContent.style.display = '';
    els.userBar.style.display = '';
    els.publicView.style.display = 'none';
    updateStats();
  }

  function showSharedView(shareData) {
    els.loginPrompt.style.display = 'none';
    els.mainContent.style.display = 'none';
    els.userBar.style.display = 'none';
    els.publicView.style.display = '';
    els.publicUsername.textContent = shareData.username;
    
    // Render the shared reviews
    const reviews = shareData.reviews || [];
    
    if (reviews.length === 0) {
      els.publicEmpty.style.display = '';
      els.publicList.innerHTML = '';
      return;
    }
    
    els.publicEmpty.style.display = 'none';
    els.publicList.innerHTML = '';
    
    const sortedReviews = [...reviews].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    const frag = document.createDocumentFragment();
    sortedReviews.forEach(r => frag.appendChild(reviewCard(r, true)));
    els.publicList.appendChild(frag);
  }

  function showPublicView(username) {
    els.loginPrompt.style.display = 'none';
    els.mainContent.style.display = 'none';
    els.userBar.style.display = 'none';
    els.publicView.style.display = '';
    els.publicUsername.textContent = username;
    renderPublicList(username);
  }

  function showLoginModal() {
    els.loginModal.classList.add('show');
    els.loginUsername.value = '';
    els.loginPassword.value = '';
    els.loginError.style.display = 'none';
  }

  function hideLoginModal() {
    els.loginModal.classList.remove('show');
  }

  function showShareModal() {
    els.shareModal.classList.add('show');
    
    // Create a comprehensive shareable data package
    const reviews = loadReviews();
    const shareId = generateShareId(currentUser);
    
    const shareData = {
      username: currentUser,
      reviews: reviews,
      timestamp: new Date().toISOString(),
      shareId: shareId,
      version: '1.0'
    };
    
    // Create the share URL with all data embedded
    const encodedData = encodeURIComponent(btoa(JSON.stringify(shareData)));
    const shareUrl = `${globalThis.location.origin}${globalThis.location.pathname}?share=${encodedData}`;
    
    // Also create a simple fallback URL
    const simpleUrl = `${globalThis.location.origin}${globalThis.location.pathname}?user=${encodeURIComponent(currentUser)}`;
    
    // Use the comprehensive share URL
    els.shareLink.value = shareUrl;
  }

  function hideShareModal() {
    els.shareModal.classList.remove('show');
  }

  function copyShareLink() {
    els.shareLink.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
  }

  // Authentication
  function handleLogin() {
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value.trim();

    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }

    const users = loadUsers();
    if (!users[username]) {
      showError('User not found');
      return;
    }

    if (users[username].password !== password) {
      showError('Invalid password');
      return;
    }

    setCurrentUser(username);
    hideLoginModal();
    showMainApp();
  }

  function handleRegister() {
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value.trim();

    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }

    if (username.length < 3) {
      showError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 3) {
      showError('Password must be at least 3 characters');
      return;
    }

    const users = loadUsers();
    if (users[username]) {
      showError('Username already exists');
      return;
    }

    users[username] = { password, createdAt: new Date().toISOString() };
    saveUsers(users);
    setCurrentUser(username);
    hideLoginModal();
    showMainApp();
  }

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      clearCurrentUser();
      showLoginPrompt();
    }
  }

  function showError(message) {
    els.loginError.textContent = message;
    els.loginError.style.display = 'block';
  }

  // Review Management
  function loadReviews() {
    if (!currentUser) return [];
    try {
      const allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {};
      return allReviews[currentUser] || [];
    } catch(_e) {
      return [];
    }
  }

  function saveToGlobalShared(username, reviews) {
    // Save to global shared storage
    globalSharedReviews[username] = {
      reviews: reviews,
      lastUpdated: new Date().toISOString(),
      shareId: generateShareId(username)
    };
    
    // Persist to localStorage as backup
    try {
      localStorage.setItem('reviewhub.global.shared', JSON.stringify(globalSharedReviews));
    } catch(_e) {
      // Ignore storage errors
    }
  }
  
  function generateShareId(username) {
    // Create a unique share ID based on username and timestamp
    const timestamp = Date.now().toString(36);
    const hash = btoa(username + timestamp).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    return hash;
  }

  function saveReviews(reviews) {
    if (!currentUser) return;
    try {
      // Save to user's private reviews
      const allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {};
      allReviews[currentUser] = reviews;
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
      
      // Also save to global shared storage for universal access
      saveToGlobalShared(currentUser, reviews);
      
      updateStats();
    } catch(_e) {
      console.error('Failed to save reviews:', _e);
    }
  }

  function loadPublicReviews(username) {
    // First check global shared storage
    if (globalSharedReviews[username] && globalSharedReviews[username].reviews) {
      return globalSharedReviews[username].reviews;
    }
    
    try {
      // Fallback to localStorage
      const allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {};
      return allReviews[username] || [];
    } catch(_e) {
      return [];
    }
  }
  
  function loadSharedDataFromUrl(shareData) {
    try {
      // Decode the share data from URL
      const decodedData = JSON.parse(atob(decodeURIComponent(shareData)));
      
      // Store this data in global shared storage for future access
      if (decodedData.username && decodedData.reviews) {
        globalSharedReviews[decodedData.username] = {
          reviews: decodedData.reviews,
          lastUpdated: decodedData.timestamp || new Date().toISOString(),
          shareId: decodedData.shareId || generateShareId(decodedData.username)
        };
        
        // Persist to localStorage
        try {
          localStorage.setItem('reviewhub.global.shared', JSON.stringify(globalSharedReviews));
        } catch(_e) {
          // Ignore storage errors
        }
      }
      
      return decodedData;
    } catch(_e) {
      return null;
    }
  }

  function updateStats() {
    const reviews = loadReviews();
    const n = reviews.length;
    els.statsPill.textContent = `${n} review${n === 1 ? '' : 's'}`;
  }

  // Form Handling
  function handleTypeChange() {
    const isOther = els.type.value === 'other';
    els.otherTitleWrap.style.display = isOther ? '' : 'none';
    els.otherFields.style.display = isOther ? '' : 'none';
    els.spotifyInputWrap.style.display = isOther ? 'none' : '';
  }

  function updateScoreDisplay() {
    const value = parseFloat(els.score.value);
    els.scoreOut.textContent = value.toFixed(1);
    els.manualScore.value = '';
  }

  function handleManualScoreInput() {
    const value = parseFloat(els.manualScore.value);
    if (!isNaN(value) && value >= 0.5 && value <= 10) {
      els.score.value = value;
      els.scoreOut.textContent = value.toFixed(1);
    }
  }

  async function handlePreview() {
    const data = await buildEntry(false);
    if (!data) return;
    renderPreview(data);
  }

  async function handleSave() {
    const data = await buildEntry(true);
    if (!data) return;
    
    const reviews = loadReviews();
    reviews.unshift(data);
    saveReviews(reviews);
    
    clearForm();
    renderPreview(null);
    alert('Review saved! Check the Browse tab.');
  }

  function clearForm() {
    if (els.type.value === 'spotify') {
      els.spotifyUrl.value = '';
    } else {
      els.otherTitle.value = '';
      els.otherSubtitle.value = '';
      els.otherImage.value = '';
    }
    els.score.value = 7;
    els.scoreOut.textContent = '7.0';
    els.manualScore.value = '';
    els.review.value = '';
  }

  // Entry Building
  function buildBase() {
    const score = els.manualScore.value ? 
      parseFloat(els.manualScore.value) : 
      parseFloat(els.score.value);
      
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type: els.type.value,
      score: Math.round(score * 10) / 10, // Round to 1 decimal
      text: els.review.value.trim(),
      user: currentUser
    };
  }

  async function buildEntry(requirePreview) {
    const base = buildBase();
    
    if (base.score < 0.5 || base.score > 10) {
      showFormError(els.manualScore, 'Score must be between 0.5 and 10.0');
      return null;
    }
    
    if (base.type === 'spotify') {
      const raw = normalizeUrl(els.spotifyUrl.value.trim());
      if (!isSpotifyAlbumUrl(raw)) {
        showFormError(els.spotifyUrl, 'Please paste a valid Spotify ALBUM link');
        return null;
      }
      
      try {
        const oe = await fetchSpotifyOEmbed(raw);
        return {
          ...base,
          title: decodeHtml(oe.title || 'Unknown album'),
          subtitle: 'Spotify Album',
          cover: oe.thumbnail_url || '',
          link: raw
        };
      } catch(e) {
        if (requirePreview) {
          showFormError(els.spotifyUrl, 'Could not fetch album info');
        }
        return null;
      }
    } else {
      const title = els.otherTitle.value.trim();
      if (!title) {
        showFormError(els.otherTitle, 'Please enter a title');
        return null;
      }
      
      return {
        ...base,
        title,
        subtitle: els.otherSubtitle.value.trim(),
        cover: els.otherImage.value.trim(),
        link: ''
      };
    }
  }

  // Utility Functions
  function showFormError(target, msg) {
    target.style.borderColor = 'rgba(255,93,108,.6)';
    setTimeout(() => target.style.borderColor = 'rgba(255,255,255,.08)', 1500);
    alert(msg);
  }

  function normalizeUrl(u) {
    try {
      return new URL(u).toString();
    } catch(_e) {
      return '';
    }
  }

  function isSpotifyAlbumUrl(u) {
    if (!u) return false;
    try {
      const url = new URL(u);
      return url.hostname.includes('open.spotify.com') && url.pathname.startsWith('/album/');
    } catch(_e) {
      return false;
    }
  }

  async function fetchSpotifyOEmbed(url) {
    const api = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(api);
    if (!res.ok) throw new Error('Failed to fetch Spotify info');
    return await res.json();
  }

  function decodeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  // Rendering
  function reviewCard(entry, isPublic = false) {
    const tpl = document.getElementById(isPublic ? 'publicReviewCardTpl' : 'reviewCardTpl');
    const node = tpl.content.firstElementChild.cloneNode(true);
    
    const img = $('.r-cover', node);
    const title = $('.r-title', node);
    const sub = $('.r-sub', node);
    const score = $('.score', node);
    const tag = $('.tag', node);
    const time = $('.time', node);
    const text = $('.r-text', node);

    // Set cover image
    img.src = entry.cover || generatePlaceholderImage();
    img.alt = entry.title || 'Cover';

    // Set title with optional link
    title.innerHTML = entry.link ? 
      `<a href="${entry.link}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.title)}</a>` : 
      escapeHtml(entry.title);
      
    sub.textContent = entry.subtitle || '';
    score.textContent = `${entry.score}/10`;
    tag.textContent = entry.type === 'spotify' ? 'Spotify Album' : 'Other';
    time.textContent = new Date(entry.createdAt).toLocaleString();
    text.textContent = entry.text || '';

    // Add action handlers for non-public cards
    if (!isPublic) {
      $('[data-action="edit"]', node).addEventListener('click', () => editEntry(entry.id));
      $('[data-action="dup"]', node).addEventListener('click', () => duplicateEntry(entry.id));
      $('[data-action="del"]', node).addEventListener('click', () => deleteEntry(entry.id));
    }

    return node;
  }

  function generatePlaceholderImage() {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" fill="#0a0f17"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" 
              font-family="sans-serif" font-size="12" fill="#7e94b1">no image</text>
      </svg>
    `);
  }

  function renderPreview(entry) {
    els.previewPane.innerHTML = '';
    if (!entry) {
      els.previewPane.innerHTML = '<div class="empty">No preview.</div>';
      return;
    }
    els.previewPane.appendChild(reviewCard(entry));
  }

  function renderList() {
    const reviews = loadReviews();
    const q = els.q.value.trim().toLowerCase();
    const t = els.filterType.value;
    const sort = els.sortBy.value;

    const list = reviews.filter(r => {
      const okType = t === 'all' || r.type === t;
      const blob = [r.title, r.subtitle, r.text].join(' ').toLowerCase();
      const okQ = !q || blob.includes(q);
      return okType && okQ;
    });

    list.sort((a, b) => {
      switch(sort) {
        case 'date-asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date-desc': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'score-asc': return a.score - b.score;
        case 'score-desc': return b.score - a.score;
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        default: return 0;
      }
    });

    els.list.innerHTML = '';
    if (list.length === 0) {
      els.emptyList.style.display = '';
      return;
    }
    
    els.emptyList.style.display = 'none';
    const frag = document.createDocumentFragment();
    list.forEach(r => frag.appendChild(reviewCard(r)));
    els.list.appendChild(frag);
  }

  function renderPublicList(username) {
    const reviews = loadPublicReviews(username);
    
    if (reviews.length === 0) {
      els.publicEmpty.style.display = '';
      els.publicList.innerHTML = '';
      return;
    }
    
    els.publicEmpty.style.display = 'none';
    els.publicList.innerHTML = '';
    
    const sortedReviews = [...reviews].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    const frag = document.createDocumentFragment();
    sortedReviews.forEach(r => frag.appendChild(reviewCard(r, true)));
    els.publicList.appendChild(frag);
  }

  // CRUD Operations
  function editEntry(id) {
    const reviews = loadReviews();
    const item = reviews.find(x => x.id === id);
    if (!item) {
      alert('Review not found');
      return;
    }

    // Load into form
    els.type.value = item.type;
    els.type.dispatchEvent(new Event('change'));
    
    if (item.type === 'spotify') {
      els.spotifyUrl.value = item.link || '';
    } else {
      els.otherTitle.value = item.title || '';
      els.otherSubtitle.value = item.subtitle || '';
      els.otherImage.value = item.cover || '';
    }
    
    els.score.value = item.score;
    els.scoreOut.textContent = item.score.toFixed(1);
    els.manualScore.value = '';
    els.review.value = item.text || '';

    // Remove original
    const rest = reviews.filter(x => x.id !== id);
    saveReviews(rest);

    // Switch to add tab
    els.tabs.forEach(x => x.classList.remove('active'));
    $('[data-tab="add"]').classList.add('active');
    els.tabAdd.style.display = '';
    els.tabBrowse.style.display = 'none';
    els.tabAbout.style.display = 'none';
    
    renderPreview(item);
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function duplicateEntry(id) {
    const reviews = loadReviews();
    const item = reviews.find(x => x.id === id);
    if (!item) {
      alert('Review not found');
      return;
    }

    const copy = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    reviews.unshift(copy);
    saveReviews(reviews);
    renderList();
  }

  function deleteEntry(id) {
    if (!confirm('Delete this review?')) return;
    
    const reviews = loadReviews();
    const filtered = reviews.filter(x => x.id !== id);
    saveReviews(filtered);
    renderList();
  }

  // Import/Export/Wipe
  function exportData() {
    const reviews = loadReviews();
    const data = JSON.stringify(reviews, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviewhub-${currentUser}-export.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      
      if (!Array.isArray(arr)) {
        throw new Error('Invalid JSON format');
      }

      // Update user property for imported reviews
      const updatedReviews = arr.map(review => ({
        ...review,
        user: currentUser,
        id: review.id || crypto.randomUUID()
      }));

      saveReviews(updatedReviews);
      renderList();
      alert('Import complete!');
    } catch(err) {
      alert('Import failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  }

  function wipeData() {
    if (!confirm('Delete ALL your reviews? This cannot be undone.')) return;
    
    // Clear private reviews
    saveReviews([]);
    
    // Also remove from global shared storage
    if (globalSharedReviews[currentUser]) {
      delete globalSharedReviews[currentUser];
      try {
        localStorage.setItem('reviewhub.global.shared', JSON.stringify(globalSharedReviews));
      } catch(_e) {
        // Ignore errors
      }
    }
    
    renderList();
    alert('All reviews deleted.');
  }

})();
