(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Storage keys
  const USERS_KEY = 'reviewhub.users';
  const CURRENT_USER_KEY = 'reviewhub.currentUser';
  const REVIEWS_KEY = 'reviewhub.reviews';

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
    
    // Check if we're viewing a public profile
    const urlParams = new URLSearchParams(window.location.search);
    const publicUser = urlParams.get('user');
    
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
    } catch(e) {
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
    els.userBar.style
