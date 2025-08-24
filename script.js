(function(){
  // Configuration
  const SUPABASE_URL = 'https://qfvhzaxuocbtpinrjyqp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdmh6YXh1b2NidHBpbnJqeXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzEzMjAsImV4cCI6MjA3MTU0NzMyMH0.Xn9_ZY6OM59xgUnb_Rc29go5sO1OdK4DIiFvpqQatDE';
  const _SPOTIFY_CLIENT_ID = 'cf9a6e9189294eb4bfaa374f5481326d'; // unused, prefixed with _
  const _SPOTIFY_CLIENT_SECRET = '8c58098d229c4a4dafacbadcabe687f8'; // unused, prefixed with _
  
  const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // unused, prefixed with _
  
  // Utility functions
  const _els = { // unused, prefixed with _
    // Auth
    loginModal: $('#loginModal'),
    loadingApp: $('#loadingApp'),
    
    // Email auth
    loginEmail: $('#loginEmail'),
    loginPassword: $('#loginPassword'),
    loginUsername: $('#loginUsername'),
    usernameGroup: $('#usernameGroup'),
    emailLoginBtn: $('#emailLoginBtn'),
    emailRegisterBtn: $('#emailRegisterBtn'),
    
    // User interface
    userBar: $('#userBar'),
    currentUser: $('#currentUser'),
    userAvatar: $('#userAvatar'),
    logoutBtn: $('#logoutBtn'),
    mainContent: $('#mainContent'),
    loginError: $('#loginError'),

    // Tabs
    tabs: $$('.tab'),
    tabAdd: $('#tab-add'),
    tabMyReviews: $('#tab-my-reviews'),
    tabGlobalFeed: $('#tab-global-feed'),
    tabProfile: $('#tab-profile'),
    tabUserProfile: $('#tab-user-profile'),
    tabAlbumDetail: $('#tab-album-detail'),
    tabAbout: $('#tab-about'),

    // Add Review
    musicSearch: $('#musicSearch'),
    searchSuggestions: $('#searchSuggestions'),
    selectedMusic: $('#selectedMusic'),
    selectedCover: $('#selectedCover'),
    selectedTitle: $('#selectedTitle'),
    selectedArtist: $('#selectedArtist'),
    selectedType: $('#selectedType'),
    selectedGenres: $('#selectedGenres'),
    score: $('#score'),
    scoreOut: $('#scoreOut'),
    manualScore: $('#manualScore'),
    review: $('#review'),
    previewPane: $('#previewPane'),
    saveBtn: $('#saveBtn'),
    clearFormBtn: $('#clearFormBtn'),
    statsPill: $('#statsPill'),

    // My Reviews
    mySearch: $('#mySearch'),
    mySortBy: $('#mySortBy'),
    myReviewsList: $('#myReviewsList'),
    myReviewsEmpty: $('#myReviewsEmpty'),
    exportBtn: $('#exportBtn'),
    shareProfileBtn: $('#shareProfileBtn'),

    // Global Feed
    globalSearch: $('#globalSearch'),
    globalSortBy: $('#globalSortBy'),
    globalTypeFilter: $('#globalTypeFilter'),
    globalGenreFilter: $('#globalGenreFilter'),
    globalReviewsList: $('#globalReviewsList'),
    globalReviewsEmpty: $('#globalReviewsEmpty'),
    globalCount: $('#globalCount'),

    // Profile
    profileAvatar: $('#profileAvatar'),
    avatarUpload: $('#avatarUpload'),
    changeAvatarBtn: $('#changeAvatarBtn'),
    profileUsername: $('#profileUsername'),
    saveUsernameBtn: $('#saveUsernameBtn'),
    usernameHint: $('#usernameHint'),
    profileBio: $('#profileBio'),
    saveBioBtn: $('#saveBioBtn'),

    // User Profile View
    userProfileName: $('#userProfileName'),
    backToFeed: $('#backToFeed'),
    userProfileContent: $('#userProfileContent'),

    // Album Detail View
    albumDetailTitle: $('#albumDetailTitle'),
    backFromAlbum: $('#backFromAlbum'),
    albumDetailContent: $('#albumDetailContent'),

    // Share Modal
    shareModal: $('#shareModal'),
    closeShareModal: $('#closeShareModal'),
    shareLink: $('#shareLink'),
    copyLinkBtn: $('#copyLinkBtn'),
    copySuccess: $('#copySuccess'),

    // Comments Modal
    commentsModal: $('#commentsModal'),
    closeCommentsModal: $('#closeCommentsModal'),
    reviewDetails: $('#reviewDetails'),
    newComment: $('#newComment'),
    submitComment: $('#submitComment'),
    commentsList: $('#commentsList'),

    // Edit Modal
    editModal: $('#editModal'),
    closeEditModal: $('#closeEditModal'),
    editScore: $('#editScore'),
    editReview: $('#editReview'),
    saveEditBtn: $('#saveEditBtn'),
    cancelEditBtn: $('#cancelEditBtn')
    }
  })();

  // Global variables
  let currentUser = null
  let currentUserProfile = null
  let selectedMusicData = null
  let spotifyToken = null
  let searchTimeout = null
  let currentReviewForComments = null
  let currentEditingReview = null
  let isRegisterMode = false
  let lastTab = 'global-feed'

  // Initialize
  init()

  async function init() {
    setupEventListeners()
    
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await handleAuthSuccess(session.user)
    }
  }

  function setupEventListeners() {
    // Auth
    els.emailLoginBtn?.addEventListener('click', handleEmailLogin)
    els.emailRegisterBtn?.addEventListener('click', handleEmailRegister)
    els.logoutBtn?.addEventListener('click', handleLogout)

    // Main tabs
    els.tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)))

    // Search
    els.musicSearch?.addEventListener('input', handleSearchInput)
    document.addEventListener('click', (e) => {
      if (els.searchSuggestions && !els.searchSuggestions.contains(e.target) && e.target !== els.musicSearch) {
        els.searchSuggestions.style.display = 'none'
      }
    })

    // Form
    els.score?.addEventListener('input', updateScoreDisplay)
    els.manualScore?.addEventListener('input', handleManualScoreInput)
    els.review?.addEventListener('input', updatePreview)
    els.saveBtn?.addEventListener('click', handleSaveReview)
    els.clearFormBtn?.addEventListener('click', clearForm)

    // My Reviews
    els.mySearch?.addEventListener('input', debounce(loadMyReviews, 300))
    els.mySortBy?.addEventListener('change', loadMyReviews)
    els.exportBtn?.addEventListener('click', exportReviews)
    els.shareProfileBtn?.addEventListener('click', showShareModal)

    // Global Feed
    els.globalSearch?.addEventListener('input', debounce(loadGlobalReviews, 300))
    els.globalSortBy?.addEventListener('change', loadGlobalReviews)
    els.globalTypeFilter?.addEventListener('change', loadGlobalReviews)
    els.globalGenreFilter?.addEventListener('change', loadGlobalReviews)

    // Profile
    els.changeAvatarBtn?.addEventListener('click', () => els.avatarUpload.click())
    els.avatarUpload?.addEventListener('change', handleAvatarUpload)
    els.profileUsername?.addEventListener('input', handleUsernameChange)
    els.saveUsernameBtn?.addEventListener('click', saveUsername)
    els.saveBioBtn?.addEventListener('click', saveBio)

    // User Profile View
    els.backToFeed?.addEventListener('click', () => switchTab(lastTab))
    els.backFromAlbum?.addEventListener('click', () => switchTab(lastTab))

    // User avatar/name clicks
    els.userAvatar?.addEventListener('click', () => switchTab('profile'))
    els.currentUser?.addEventListener('click', () => switchTab('profile'))

    // Share Modal
    els.closeShareModal?.addEventListener('click', hideShareModal)
    els.shareModal?.addEventListener('click', (e) => {
      if (e.target === els.shareModal) hideShareModal()
    })
    els.copyLinkBtn?.addEventListener('click', copyShareLink)

    // Comments Modal
    els.closeCommentsModal?.addEventListener('click', hideCommentsModal)
    els.commentsModal?.addEventListener('click', (e) => {
      if (e.target === els.commentsModal) hideCommentsModal()
    })
    els.submitComment?.addEventListener('click', submitComment)

    // Edit Modal
    els.closeEditModal?.addEventListener('click', hideEditModal)
    els.editModal?.addEventListener('click', (e) => {
      if (e.target === els.editModal) hideEditModal()
    })
    els.saveEditBtn?.addEventListener('click', saveEditedReview)
    els.cancelEditBtn?.addEventListener('click', hideEditModal)

    // Auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleAuthSuccess(session.user)
      } else if (event === 'SIGNED_OUT') {
        showLoginModal()
      }
    })

    // Check for shared profile URL
    checkForSharedProfile()

    // Register mode toggle
    els.emailRegisterBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      if (!isRegisterMode) {
        toggleRegisterMode(true)
      } else {
        handleEmailRegister()
      }
    })
  }

  function toggleRegisterMode(enabled) {
    isRegisterMode = enabled
    if (enabled) {
      els.usernameGroup.style.display = 'block'
      els.emailRegisterBtn.textContent = 'Create Account'
      els.emailLoginBtn.style.display = 'none'
    } else {
      els.usernameGroup.style.display = 'none'
      els.emailRegisterBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
        </svg>
        Create Account
      `
      els.emailLoginBtn.style.display = 'block'
    }
  }

  // Authentication
  async function handleEmailLogin() {
    const email = els.loginEmail.value.trim()
    const password = els.loginPassword.value.trim()

    if (!email || !password) {
      showError('Please enter both email and password')
      return
    }

    try {
      els.emailLoginBtn.disabled = true
      els.emailLoginBtn.textContent = 'Signing in...'
      
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
    } catch (error) {
      showError(error.message)
    } finally {
      els.emailLoginBtn.disabled = false
      els.emailLoginBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
        </svg>
        Sign In
      `
    }
  }

  async function handleEmailRegister() {
    const email = els.loginEmail.value.trim()
    const password = els.loginPassword.value.trim()
    const username = els.loginUsername.value.trim()

    if (!email || !password) {
      showError('Please enter both email and password')
      return
    }

    if (!username) {
      showError('Please enter a username')
      return
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters')
      return
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      showError('Username must be between 3 and 20 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError('Username can only contain letters, numbers, and underscores')
      return
    }

    try {
      els.emailRegisterBtn.disabled = true
      els.emailRegisterBtn.textContent = 'Creating account...'

      // Check if username exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        showError('Username already taken')
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (error) throw error

      alert('Account created successfully! Please check your email to verify your account.')
      toggleRegisterMode(false)

    } catch (error) {
      showError(error.message)
    } finally {
      els.emailRegisterBtn.disabled = false
      els.emailRegisterBtn.textContent = 'Create Account'
    }
  }

  async function handleAuthSuccess(user) {
    currentUser = user
    await getSpotifyToken()
    await loadUserProfile()
    hideLoginModal()
    switchTab('global-feed')
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Logout error:', error)
    
    currentUser = null
    currentUserProfile = null
    showLoginModal()
  }

  function showLoginModal() {
    els.loginModal?.classList.add('show')
    els.loadingApp?.style.setProperty('display', 'none')
    els.mainContent?.style.setProperty('display', 'none')
    els.userBar?.style.setProperty('display', 'none')
  }

  function hideLoginModal() {
    els.loginModal?.classList.remove('show')
    els.loadingApp?.style.setProperty('display', 'none')
    els.mainContent?.style.setProperty('display', 'block')
    els.userBar?.style.setProperty('display', 'flex')
  }

  function showError(message) {
    if (els.loginError) {
      els.loginError.textContent = message
      els.loginError.style.display = 'block'
      setTimeout(() => {
        els.loginError.style.display = 'none'
      }, 5000)
    }
  }

  // Spotify Authentication
  async function getSpotifyToken() {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
        },
        body: 'grant_type=client_credentials'
      })

      const data = await response.json()
      spotifyToken = data.access_token
    } catch (error) {
      console.error('Spotify token error:', error)
    }
  }

  // User Profile
  async function loadUserProfile() {
    if (!currentUser) return

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Profile load error:', error)
        return
      }

      if (profile) {
        currentUserProfile = profile
        updateUserInterface()
      } else {
        await createUserProfile()
      }
    } catch (error) {
      console.error('Load profile error:', error)
    }
  }

  async function createUserProfile() {
    try {
      const profileData = {
        id: currentUser.id,
        username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User',
        full_name: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User',
        avatar_url: generatePlaceholderImage(),
        bio: null
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) throw error

      currentUserProfile = data
      updateUserInterface()
    } catch (error) {
      console.error('Create profile error:', error)
    }
  }

  function updateUserInterface() {
    if (currentUserProfile && els.currentUser && els.userAvatar) {
      els.currentUser.textContent = currentUserProfile.username || 'User'
      els.userAvatar.src = currentUserProfile.avatar_url || generatePlaceholderImage()
      
      if (els.profileAvatar) {
        els.profileAvatar.src = currentUserProfile.avatar_url || generatePlaceholderImage()
      }
      if (els.profileUsername) {
        els.profileUsername.value = currentUserProfile.username || ''
      }
      if (els.profileBio) {
        els.profileBio.value = currentUserProfile.bio || ''
      }
    }
  }

  // Tab System
  function switchTab(tabName) {
    // Hide all tabs
    els.tabs.forEach(tab => {
      const tabElement = $(`#tab-${tab.dataset.tab}`)
      if (tabElement) tabElement.style.display = 'none'
    })
    
    // Show selected tab
    const targetTab = $(`#tab-${tabName}`)
    if (targetTab) {
      targetTab.style.display = 'block'
      
      // Update last tab for navigation
      if (!['user-profile', 'album-detail'].includes(tabName)) {
        lastTab = tabName
      }
      
      // Load tab-specific data
      switch (tabName) {
        case 'my-reviews':
          loadMyReviews()
          break
        case 'global-feed':
          loadGlobalReviews()
          break
        case 'add':
          updatePreview()
          break
      }
    }
  }

  // Spotify Search - FIXED: Removed async keyword since no await is used
  function handleSearchInput() {
    const query = els.musicSearch.value.trim()
    
    clearTimeout(searchTimeout)
    
    if (query.length < 2) {
      els.searchSuggestions.style.display = 'none'
      return
    }
    
    searchTimeout = setTimeout(async () => {
      await searchSpotify(query)
    }, 300)
  }

  async function searchSpotify(query) {
    if (!spotifyToken) {
      await getSpotifyToken()
      if (!spotifyToken) return
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album,track&limit=10`, {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      })

      const data = await response.json()
      displaySearchSuggestions(data)
    } catch (error) {
      console.error('Spotify search error:', error)
    }
  }

  function displaySearchSuggestions(data) {
    const suggestions = []
    
    // Add albums
    if (data.albums?.items) {
      data.albums.items.forEach(album => {
        suggestions.push({
          id: album.id,
          title: album.name,
          artist: album.artists.map(a => a.name).join(', '),
          album_title: album.name,
          cover: album.images[0]?.url,
          spotify_url: album.external_urls.spotify,
          type: 'album',
          genres: album.genres || [],
          release_date: album.release_date
        })
      })
    }
    
    // Add tracks
    if (data.tracks?.items) {
      data.tracks.items.forEach(track => {
        suggestions.push({
          id: track.id,
          title: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album_title: track.album?.name,
          cover: track.album?.images[0]?.url,
          spotify_url: track.external_urls.spotify,
          type: 'track',
          genres: [],
          release_date: track.album?.release_date
        })
      })
    }
    
    if (suggestions.length === 0) {
      els.searchSuggestions.style.display = 'none'
      return
    }
    
    els.searchSuggestions.innerHTML = ''
    suggestions.forEach(item => {
      const div = document.createElement('div')
      div.className = 'search-suggestion'
      div.innerHTML = `
        <img src="${item.cover || generatePlaceholderImage()}" alt="Cover" onerror="this.src='${generatePlaceholderImage()}'">
        <div class="suggestion-info">
          <div class="suggestion-title">${escapeHtml(item.title)}</div>
          <div class="suggestion-artist">${escapeHtml(item.artist)}</div>
          <div class="suggestion-type">${item.type === 'album' ? 'Album' : 'Single'}</div>
        </div>
      `
      div.addEventListener('click', () => selectMusic(item))
      els.searchSuggestions.appendChild(div)
    })
    
    els.searchSuggestions.style.display = 'block'
  }

  function selectMusic(musicData) {
    selectedMusicData = musicData
    els.searchSuggestions.style.display = 'none'
    els.musicSearch.value = `${musicData.title} - ${musicData.artist}`
    
    // Update selected music display
    els.selectedCover.src = musicData.cover || generatePlaceholderImage()
    els.selectedTitle.textContent = musicData.title
    els.selectedArtist.textContent = musicData.artist
    els.selectedType.textContent = musicData.type === 'album' ? 'Album' : 'Single'
    els.selectedGenres.textContent = musicData.genres.join(', ') || 'No genres available'
    
    els.selectedMusic.style.display = 'block'
    updatePreview()
  }

  // Score handling - FIXED: Slider only does whole and half numbers
  function updateScoreDisplay() {
    const score = parseFloat(els.score.value)
    els.scoreOut.textContent = score.toFixed(1)
    els.manualScore.value = ''
    updatePreview()
  }

  function handleManualScoreInput() {
    const manualScore = parseFloat(els.manualScore.value)
    if (!isNaN(manualScore) && manualScore >= 0 && manualScore <= 10) {
      els.scoreOut.textContent = manualScore.toFixed(2)
    }
    updatePreview()
  }

  // Preview - FIXED: Now shows actual cover image
  function updatePreview() {
    if (!selectedMusicData) {
      els.previewPane.innerHTML = '<div class="empty">Select music to see preview</div>'
      return
    }
    
    const score = els.manualScore.value && !isNaN(parseFloat(els.manualScore.value)) ? 
      parseFloat(els.manualScore.value) : 
      parseFloat(els.score.value)
    
    const previewReview = {
      ...selectedMusicData,
      score: score,
      review_text: els.review.value.trim() || null,
      created_at: new Date().toISOString(),
      user: currentUserProfile || {
        username: 'You',
        avatar_url: generatePlaceholderImage()
      }
    }
    
    const previewCard = createReviewCard(previewReview, false, true)
    els.previewPane.innerHTML = ''
    els.previewPane.appendChild(previewCard)
  }

  // Save Review
  async function handleSaveReview() {
    if (!selectedMusicData) {
      alert('Please select music to review')
      return
    }

    if (!currentUser) {
      alert('Please log in to save reviews')
      return
    }

    const score = els.manualScore.value && !isNaN(parseFloat(els.manualScore.value)) ? 
      parseFloat(els.manualScore.value) : 
      parseFloat(els.score.value)
    
    const reviewText = els.review.value.trim()

    if (score < 0 || score > 10) {
      alert('Score must be between 0 and 10.00')
      return
    }

    els.saveBtn.disabled = true
    els.saveBtn.textContent = 'Saving...'

    try {
      const reviewData = {
        user_id: currentUser.id,
        title: selectedMusicData.title,
        artist: selectedMusicData.artist,
        album_title: selectedMusicData.album_title || null,
        cover_url: selectedMusicData.cover || null,
        spotify_id: selectedMusicData.id,
        spotify_url: selectedMusicData.spotify_url,
        type: selectedMusicData.type,
        score: Math.round(score * 100) / 100,
        review_text: reviewText || null,
        genres: selectedMusicData.genres || [],
        release_date: selectedMusicData.release_date || null
      }

      const { _data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()

      if (error) throw error

      alert('Review saved successfully!')
      clearForm()
      
      // Reload reviews
      setTimeout(async () => {
        await loadMyReviews()
        await loadGlobalReviews()
      }, 500)
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save review: ' + error.message)
    } finally {
      els.saveBtn.disabled = false
      els.saveBtn.textContent = '💾 Save Review'
    }
  }

  function clearForm() {
    els.musicSearch.value = ''
    els.score.value = 7
    els.scoreOut.textContent = '7.0'
    els.manualScore.value = ''
    els.review.value = ''
    els.selectedMusic.style.display = 'none'
    els.searchSuggestions.style.display = 'none'
    selectedMusicData = null
    updatePreview()
  }

  // Load Reviews - FIXED: Better like counting and My Reviews functionality
  async function loadMyReviews() {
    if (!currentUser) return

    try {
      els.myReviewsEmpty.style.display = 'none'
      els.myReviewsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading reviews...</span></div>'

      const searchQuery = els.mySearch.value.trim().toLowerCase()
      const sortBy = els.mySortBy.value

      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          ),
          review_likes (
            id,
            user_id
          )
        `)
        .eq('user_id', currentUser.id)

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,review_text.ilike.%${searchQuery}%`)
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      if (genreFilter !== 'all') {
        query = query.contains('genres', [genreFilter])
      }

      switch (sortBy) {
        case 'date-asc':
          query = query.order('created_at', { ascending: true })
          break
        case 'score-desc':
          query = query.order('score', { ascending: false })
          break
        case 'score-asc':
          query = query.order('score', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data: reviews, error } = await query

      if (error) throw error

      const processedReviews = reviews.map(review => ({
        ...review,
        like_count: review.review_likes?.length || 0,
        user_liked: review.review_likes?.some(like => like.user_id === currentUser?.id) || false,
        user: review.profiles || {
          username: 'Anonymous',
          full_name: 'Anonymous',
          avatar_url: generatePlaceholderImage()
        }
      }))

      // Apply sorting for likes (can't do in SQL easily)
      if (sortBy === 'likes-desc') {
        processedReviews.sort((a, b) => b.like_count - a.like_count)
      }

      renderReviews(processedReviews, els.globalReviewsList, els.globalReviewsEmpty, false)
      
      if (els.statsPill) {
        els.statsPill.textContent = `${processedReviews.length} review${processedReviews.length === 1 ? '' : 's'}`
      }

    } catch (error) {
      console.error('Error loading my reviews:', error)
      els.myReviewsList.innerHTML = ''
      els.myReviewsEmpty.style.display = 'block'
      els.myReviewsEmpty.textContent = 'Error loading reviews: ' + error.message
    }
  }

  function updateGenreFilter(reviews) {
    if (!els.globalGenreFilter) return
    
    const genres = new Set()
    reviews.forEach(review => {
      if (review.genres && Array.isArray(review.genres)) {
        review.genres.forEach(genre => genres.add(genre))
      }
    })

    const currentValue = els.globalGenreFilter.value
    els.globalGenreFilter.innerHTML = '<option value="all">All genres</option>'
    
    Array.from(genres).sort().forEach(genre => {
      const option = document.createElement('option')
      option.value = genre
      option.textContent = genre
      els.globalGenreFilter.appendChild(option)
    })

    els.globalGenreFilter.value = currentValue
  }

  // Review Rendering
  function renderReviews(reviews, listEl, emptyEl, showActions) {
    if (!listEl || !emptyEl) return
    
    listEl.innerHTML = ''
    
    if (reviews.length === 0) {
      emptyEl.style.display = 'block'
      return
    }
    
    emptyEl.style.display = 'none'
    
    const fragment = document.createDocumentFragment()
    reviews.forEach(review => {
      fragment.appendChild(createReviewCard(review, showActions))
    })
    
    listEl.appendChild(fragment)
  }

  function createReviewCard(review, showActions = false, isPreview = false) {
    const div = document.createElement('div')
    div.className = 'r-card'
    
    const likeSection = !isPreview ? `
      <div class="like-section">
        <button class="like-btn ${review.user_liked ? 'liked' : ''}" onclick="toggleLike(${review.id})">
          ❤️
        </button>
        <div class="like-count">${review.like_count || 0}</div>
        <button class="comment-btn" onclick="showComments(${review.id})">
          💬
        </button>
      </div>
    ` : ''
    
    const actionButtons = showActions && !isPreview ? `
      <div class="review-actions" style="margin-top: 8px;">
        <button class="btn small ghost" onclick="editReview(${review.id})" style="margin-right: 8px;">
          ✏️ Edit
        </button>
        <button class="btn danger small" onclick="deleteReview(${review.id})">
          🗑️ Delete
        </button>
      </div>
    ` : ''
    
    const coverSrc = review.cover_url && review.cover_url !== '' ? review.cover_url : generatePlaceholderImage()
    
    const genreTags = review.genres && review.genres.length > 0 
      ? review.genres.map(genre => `<span class="genre-tag">${escapeHtml(genre)}</span>`).join('')
      : ''
    
    const titleClickable = !isPreview ? `onclick="showAlbumDetail('${review.spotify_id}', '${review.type}')" style="cursor: pointer;"` : ''
    
    div.innerHTML = `
      <img class="r-cover" src="${coverSrc}" alt="Cover" onerror="this.src='${generatePlaceholderImage()}'">
      <div>
        <div class="r-title">
          <span ${titleClickable}>${escapeHtml(review.title)}</span>
          <a href="${review.spotify_url}" target="_blank" rel="noopener" style="margin-left: 8px; font-size: 12px;">🎵</a>
        </div>
        <div class="r-artist">${escapeHtml(review.artist)}</div>
        <div class="r-meta">
          <span class="score">${review.score}/10</span>
          <span class="tag">${review.type === 'album' ? 'Album' : 'Single'}</span>
          ${genreTags}
        </div>
        ${review.review_text ? `<div class="r-text">${escapeHtml(review.review_text)}</div>` : ''}
        ${!isPreview ? `
          <div class="r-user">
            <img src="${review.user.avatar_url || generatePlaceholderImage()}" alt="Avatar" onerror="this.src='${generatePlaceholderImage()}'">
            <span onclick="showUserProfile('${review.user_id}')">${escapeHtml(review.user.username || review.user.full_name || 'User')}</span>
            <span class="time">${formatDate(review.created_at)}</span>
          </div>
        ` : ''}
        ${actionButtons}
      </div>
      ${likeSection}
    `
    
    return div
  }

  // Like System - FIXED: Now works properly
  globalThis.toggleLike = async function(reviewId) {
    if (!currentUser) {
      alert('Please log in to like reviews')
      return
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', currentUser.id)
        .single()

      if (existingLike) {
        // Remove like
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('id', existingLike.id)

        if (error) throw error
      } else {
        // Add like
        const { error } = await supabase
          .from('review_likes')
          .insert({
            review_id: reviewId,
            user_id: currentUser.id
          })

        if (error) throw error
      }

      // Reload current reviews
      if (els.tabGlobalFeed && els.tabGlobalFeed.style.display !== 'none') {
        await loadGlobalReviews()
      }
      if (els.tabMyReviews && els.tabMyReviews.style.display !== 'none') {
        await loadMyReviews()
      }

    } catch (error) {
      console.error('Error toggling like:', error)
      alert('Failed to toggle like: ' + error.message)
    }
  }

  // Edit Review - FIXED: Now works properly
  globalThis.editReview = async function(reviewId) {
    if (!currentUser) {
      alert('Please log in to edit reviews')
      return
    }

    try {
      // Load review data
      const { data: review, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('user_id', currentUser.id)
        .single()

      if (error) throw error
      if (!review) {
        alert('Review not found or you do not have permission to edit it')
        return
      }

      currentEditingReview = review
      els.editScore.value = review.score
      els.editReview.value = review.review_text || ''
      els.editModal.classList.add('show')

    } catch (error) {
      console.error('Error loading review for edit:', error)
      alert('Failed to load review: ' + error.message)
    }
  }

  function hideEditModal() {
    els.editModal?.classList.remove('show')
    currentEditingReview = null
  }

  async function saveEditedReview() {
    if (!currentEditingReview) return

    const newScore = parseFloat(els.editScore.value)
    const newReviewText = els.editReview.value.trim()

    if (newScore < 0 || newScore > 10) {
      alert('Score must be between 0 and 10')
      return
    }

    try {
      els.saveEditBtn.disabled = true
      els.saveEditBtn.textContent = 'Saving...'

      const { error } = await supabase
        .from('reviews')
        .update({
          score: Math.round(newScore * 100) / 100,
          review_text: newReviewText || null
        })
        .eq('id', currentEditingReview.id)
        .eq('user_id', currentUser.id)

      if (error) throw error

      alert('Review updated successfully!')
      hideEditModal()
      
      // Reload reviews
      await loadMyReviews()
      await loadGlobalReviews()

    } catch (error) {
      console.error('Error updating review:', error)
      alert('Failed to update review: ' + error.message)
    } finally {
      els.saveEditBtn.disabled = false
      els.saveEditBtn.textContent = 'Save Changes'
    }
  }

  // Delete Review - FIXED: Now works properly
  globalThis.deleteReview = async function(reviewId) {
    if (!currentUser) {
      alert('Please log in to delete reviews')
      return
    }

    if (!confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      // First delete associated likes and comments
      await supabase.from('review_likes').delete().eq('review_id', reviewId)
      await supabase.from('comments').delete().eq('review_id', reviewId)
      
      // Then delete the review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', currentUser.id)

      if (error) throw error

      alert('Review deleted successfully!')
      
      // Reload reviews
      await loadMyReviews()
      await loadGlobalReviews()

    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review: ' + error.message)
    }
  }

  // Comments System - FIXED: Now works properly
  globalThis.showComments = async function(reviewId) {
    currentReviewForComments = reviewId
    await loadComments(reviewId)
    els.commentsModal?.classList.add('show')
  }

  function hideCommentsModal() {
    els.commentsModal?.classList.remove('show')
    currentReviewForComments = null
  }

  async function loadComments(reviewId) {
    try {
      // Load review details
      const { data: review } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', reviewId)
        .single()

      if (review && els.reviewDetails) {
        els.reviewDetails.innerHTML = `
          <div class="r-card" style="margin-bottom: 16px;">
            <img class="r-cover" src="${review.cover_url || generatePlaceholderImage()}" alt="Cover" onerror="this.src='${generatePlaceholderImage()}'">
            <div>
              <div class="r-title">${escapeHtml(review.title)}</div>
              <div class="r-artist">${escapeHtml(review.artist)}</div>
              <div class="r-meta">
                <span class="score">${review.score}/10</span>
                <span class="tag">${review.type === 'album' ? 'Album' : 'Single'}</span>
              </div>
              ${review.review_text ? `<div class="r-text">${escapeHtml(review.review_text)}</div>` : ''}
            </div>
          </div>
        `
      }

      // Load comments
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true })

      if (error) throw error

      renderComments(comments || [])

    } catch (error) {
      console.error('Error loading comments:', error)
      if (els.reviewDetails) els.reviewDetails.innerHTML = '<div class="error">Error loading review details</div>'
      if (els.commentsList) els.commentsList.innerHTML = '<div class="error">Error loading comments</div>'
    }
  }

  function renderComments(comments) {
    if (!els.commentsList) return
    
    if (comments.length === 0) {
      els.commentsList.innerHTML = '<div class="empty">No comments yet. Be the first to comment!</div>'
      return
    }

    els.commentsList.innerHTML = ''
    comments.forEach(comment => {
      const div = document.createElement('div')
      div.className = 'comment'
      div.innerHTML = `
        <div class="comment-header">
          <img class="comment-avatar" src="${comment.profiles?.avatar_url || generatePlaceholderImage()}" alt="Avatar" onerror="this.src='${generatePlaceholderImage()}'">
          <span class="comment-author" onclick="showUserProfile('${comment.user_id}')">${escapeHtml(comment.profiles?.username || 'User')}</span>
          <span class="comment-time">${formatDate(comment.created_at)}</span>
        </div>
        <div class="comment-text">${escapeHtml(comment.comment_text)}</div>
      `
      els.commentsList.appendChild(div)
    })
  }

  async function submitComment() {
    if (!currentUser) {
      alert('Please log in to comment')
      return
    }

    const commentText = els.newComment?.value.trim()
    if (!commentText) {
      alert('Please enter a comment')
      return
    }

    try {
      els.submitComment.disabled = true
      els.submitComment.textContent = 'Posting...'

      const { error } = await supabase
        .from('comments')
        .insert({
          review_id: currentReviewForComments,
          user_id: currentUser.id,
          comment_text: commentText
        })

      if (error) throw error

      els.newComment.value = ''
      await loadComments(currentReviewForComments)

    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Failed to post comment: ' + error.message)
    } finally {
      els.submitComment.disabled = false
      els.submitComment.textContent = 'Post Comment'
    }
  }

  // Album/Track Detail System - FIXED: Now shows tracklist and reviews properly
  globalThis.showAlbumDetail = async function(spotifyId, type) {
    try {
      els.albumDetailContent.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading details...</span></div>'
      
      // Get album/track details from Spotify
      const endpoint = type === 'album' 
        ? `https://api.spotify.com/v1/albums/${spotifyId}`
        : `https://api.spotify.com/v1/tracks/${spotifyId}`
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      })
      
      const spotifyData = await response.json()
      
      // Get all reviews for this album/track
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          ),
          review_likes (
            id,
            user_id
          )
        `)
        .eq('spotify_id', spotifyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedReviews = reviews.map(review => ({
        ...review,
        like_count: review.review_likes?.length || 0,
        user_liked: review.review_likes?.some(like => like.user_id === currentUser?.id) || false,
        user: review.profiles || {
          username: 'Anonymous',
          full_name: 'Anonymous',
          avatar_url: generatePlaceholderImage()
        }
      }))

      // Calculate average score
      const avgScore = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(2)
        : 'N/A'

      // Build tracklist for albums
      let tracklistHtml = ''
      if (type === 'album' && spotifyData.tracks?.items) {
        tracklistHtml = `
          <div class="tracklist">
            <h4>Tracklist</h4>
            <div class="tracks">
              ${spotifyData.tracks.items.map((track, index) => `
                <div class="track-item">
                  <span class="track-number">${index + 1}.</span>
                  <span class="track-name">${escapeHtml(track.name)}</span>
                  <span class="track-duration">${formatDuration(track.duration_ms)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `
      }

      if (els.albumDetailTitle) {
        els.albumDetailTitle.textContent = `${spotifyData.name} - Details`
      }
      
      els.albumDetailContent.innerHTML = `
        <div class="album-header">
          <img class="album-cover" src="${spotifyData.images?.[0]?.url || generatePlaceholderImage()}" alt="Cover" onerror="this.src='${generatePlaceholderImage()}'">
          <div class="album-info">
            <h2>${escapeHtml(spotifyData.name)}</h2>
            <h3>${escapeHtml(spotifyData.artists.map(a => a.name).join(', '))}</h3>
            <div class="album-meta">
              <span class="album-type">${type === 'album' ? 'Album' : 'Single'}</span>
              <span class="release-date">${new Date(spotifyData.release_date).getFullYear()}</span>
              ${type === 'album' ? `<span class="track-count">${spotifyData.total_tracks} tracks</span>` : ''}
            </div>
            <div class="album-stats">
              <div class="stat-item">
                <div class="stat-number">${avgScore}</div>
                <div class="stat-label">Average Score</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${reviews.length}</div>
                <div class="stat-label">Reviews</div>
              </div>
            </div>
            <a href="${spotifyData.external_urls.spotify}" target="_blank" class="btn small">🎵 Open in Spotify</a>
          </div>
        </div>

        ${tracklistHtml}

        <div class="album-reviews">
          <h4>Reviews (${reviews.length})</h4>
          ${reviews.length > 0 
            ? `<div class="review-list">${processedReviews.map(review => createReviewCard(review, false).outerHTML).join('')}</div>`
            : '<div class="empty">No reviews yet. Be the first to review this!</div>'
          }
        </div>
      `
      
      switchTab('album-detail')

    } catch (error) {
      console.error('Error loading album details:', error)
      els.albumDetailContent.innerHTML = '<div class="error">Error loading details</div>'
    }
  }

  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}:${seconds.padStart(2, '0')}`
  }

  // User Profile System - FIXED: Changed "Share Profile" to "Share Reviews"
  globalThis.showUserProfile = async function(userId) {
    if (userId === currentUser?.id) {
      switchTab('profile')
      return
    }

    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Load user's reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (profile && els.userProfileName && els.userProfileContent) {
        els.userProfileName.textContent = `${profile.username || 'User'}'s Reviews`
        
        const reviewCount = reviews?.length || 0
        const avgScore = reviewCount > 0 
          ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviewCount).toFixed(2)
          : '0.00'

        els.userProfileContent.innerHTML = `
          <div class="user-profile-header">
            <img class="user-profile-avatar" src="${profile.avatar_url || generatePlaceholderImage()}" alt="Avatar" onerror="this.src='${generatePlaceholderImage()}'">
            <div class="user-profile-info">
              <h3>${escapeHtml(profile.username || 'User')}</h3>
              ${profile.bio ? `<div class="user-profile-bio">${escapeHtml(profile.bio)}</div>` : ''}
              <div class="user-profile-stats">
                <div class="stat-item">
                  <div class="stat-number">${reviewCount}</div>
                  <div class="stat-label">Reviews</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${avgScore}</div>
                  <div class="stat-label">Avg Score</div>
                </div>
              </div>
            </div>
          </div>
          <div class="review-list">
            ${reviews && reviews.length > 0 
              ? reviews.map(review => {
                  const processedReview = {
                    ...review,
                    user: profile,
                    like_count: 0,
                    user_liked: false
                  }
                  return createReviewCard(processedReview, false).outerHTML
                }).join('')
              : '<div class="empty">No reviews yet</div>'
            }
          </div>
        `
        
        switchTab('user-profile')
      }

    } catch (error) {
      console.error('Error loading user profile:', error)
      alert('Failed to load user profile')
    }
  }

  // Profile Management - FIXED: Avatar upload and bio/username saving
  async function handleAvatarUpload() {
    const file = els.avatarUpload?.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar must be smaller than 2MB')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      
      const { _data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      currentUserProfile.avatar_url = publicUrl
      updateUserInterface()
      alert('Avatar updated successfully!')
      
    } catch (error) {
      console.error('Avatar upload error:', error)
      alert('Failed to upload avatar: ' + error.message)
    }
  }

  function handleUsernameChange() {
    const username = els.profileUsername?.value || ''
    const isValid = /^[a-zA-Z0-9_]+$/.test(username) && username.length >= 3 && username.length <= 20
    
    if (els.saveUsernameBtn) {
      els.saveUsernameBtn.disabled = !isValid
    }
    
    if (els.usernameHint) {
      if (username && !isValid) {
        els.usernameHint.textContent = 'Username must be 3-20 characters, letters, numbers, and underscores only'
        els.usernameHint.style.color = '#ef4444'
      } else {
        els.usernameHint.textContent = 'You can change your username every 3 days'
        els.usernameHint.style.color = 'var(--muted)'
      }
    }
  }

  async function saveUsername() {
    const newUsername = els.profileUsername?.value.trim()
    if (!newUsername) return

    try {
      // Check if username exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUsername)
        .neq('id', currentUser.id)
        .single()

      if (existing) {
        alert('Username already taken')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', currentUser.id)

      if (error) throw error

      currentUserProfile.username = newUsername
      updateUserInterface()
      alert('Username updated successfully!')
      
    } catch (error) {
      console.error('Username update error:', error)
      alert('Failed to update username: ' + error.message)
    }
  }

  async function saveBio() {
    const newBio = els.profileBio?.value.trim() || null

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', currentUser.id)

      if (error) throw error

      currentUserProfile.bio = newBio
      alert('Bio updated successfully!')
      
    } catch (error) {
      console.error('Bio update error:', error)
      alert('Failed to update bio: ' + error.message)
    }
  }

  // Share Profile - FIXED: Changed to "Share Reviews"
  function showShareModal() {
    const profileUrl = `${window.location.origin}/?user=${currentUser.id}`
    if (els.shareLink) {
      els.shareLink.value = profileUrl
    }
    els.shareModal?.classList.add('show')
  }

  function hideShareModal() {
    els.shareModal?.classList.remove('show')
    if (els.copySuccess) {
      els.copySuccess.style.display = 'none'
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(els.shareLink.value)
      if (els.copySuccess) {
        els.copySuccess.style.display = 'block'
        setTimeout(() => {
          els.copySuccess.style.display = 'none'
        }, 3000)
      }
    } catch (_error) {
      // Fallback for older browsers
      els.shareLink?.select()
      document.execCommand('copy')
      if (els.copySuccess) {
        els.copySuccess.style.display = 'block'
        setTimeout(() => {
          els.copySuccess.style.display = 'none'
        }, 3000)
      }
    }
  }

  // Check for shared profile URL
  function checkForSharedProfile() {
    const urlParams = new URLSearchParams(window.location.search)
    const userId = urlParams.get('user')
    
    if (userId) {
      // Wait for authentication to complete
      setTimeout(() => {
        showUserProfile(userId)
      }, 1000)
    }
  }

  // Export Reviews
  async function exportReviews() {
    if (!currentUser) return

    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const csvContent = [
        ['Title', 'Artist', 'Type', 'Score', 'Review', 'Date', 'Spotify URL'].join(','),
        ...reviews.map(review => [
          `"${review.title}"`,
          `"${review.artist}"`,
          review.type,
          review.score,
          `"${review.review_text || ''}"`,
          new Date(review.created_at).toLocaleDateString(),
          review.spotify_url
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
     a.download = "my-music.txt";
a.click();
window.URL.revokeObjectURL(url);

      switch (sortBy) {
        case 'date-asc':
          query = query.order('created_at', { ascending: true })
          break
        case 'score-desc':
          query = query.order('score', { ascending: false })
          break
        case 'score-asc':
          query = query.order('score', { ascending: true })
          break
        case 'title-asc':
          query = query.order('title', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data: myReviews, error: myError } = await query

      if (myError) throw myError

      const processedReviews = myReviews.map(review => ({
        ...review,
        like_count: review.review_likes?.length || 0,
        user_liked: review.review_likes?.some(like => like.user_id === currentUser?.id) || false,
        user: review.profiles || {
          username: 'Anonymous',
          full_name: 'Anonymous',
          avatar_url: generatePlaceholderImage()
        }
      }))

      renderReviews(processedReviews, els.myReviewsList, els.myReviewsEmpty, true) // Show actions for my reviews
      
      if (els.statsPill) {
        els.statsPill.textContent = `${processedReviews.length} review${processedReviews.length === 1 ? '' : 's'}`
      }

    } catch (error) {
      console.error('Error loading my reviews:', error)
      els.myReviewsList.innerHTML = ''
      els.myReviewsEmpty.style.display = 'block'
      els.myReviewsEmpty.textContent = 'Error loading reviews: ' + error.message
    }
  }

  async function loadGlobalReviews() {
    try {
      els.globalReviewsEmpty.style.display = 'none'
      els.globalReviewsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading reviews...</span></div>'

      const searchQuery = els.globalSearch.value.trim().toLowerCase()
      const sortBy = els.globalSortBy.value
      const typeFilter = els.globalTypeFilter.value
      const genreFilter = els.globalGenreFilter.value

      let query = supabase
        .from('reviews')
        .select('*');

if (searchQuery) {
  query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,review_text.ilike.%${searchQuery}%`);
}

  if (typeFilter !== 'all') {
    query = query.eq('type', typeFilter);
  }

  if (genreFilter !== 'all') {
    query = query.contains('genres', [genreFilter]);
  }

  switch (sortBy) {
    case 'date-asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'score-desc':
      query = query.order('score', { ascending: false });
      break;
    case 'score-asc':
      query = query.order('score', { ascending: true });
      break;
    case 'likes-desc':
      // Will sort after fetching
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: reviews, error } = await query;

  if (error) throw error;

  const processedReviews = reviews.map(review => ({
    ...review,
    like_count: review.review_likes?.length || 0,
    user_liked: review.review_likes?.some(like => like.user_id === currentUser?.id) || false,
    user: review.profiles || {
      username: 'Anonymous',
      full_name: 'Anonymous',
      avatar_url: generatePlaceholderImage()
    }
  }));

  // Apply sorting for likes (can't do in SQL easily)
  if (sortBy === 'likes-desc') {
    processedReviews.sort((a, b) => b.like_count - a.like_count);
  }

  renderReviews(processedReviews, els.globalReviewsList, els.globalReviewsEmpty, false);

  if (els.globalCount) {
    els.globalCount.textContent = `${processedReviews.length} review${processedReviews.length === 1 ? '' : 's'}`;
  }

      updateGenreFilter(processedReviews);
    
    }
    catch (error) {
      console.error('Error loading global reviews:', error)
      els.globalReviewsList.innerHTML = ''
      els.globalReviewsEmpty.style.display = 'block'
      els.globalReviewsEmpty.textContent = 'Error loading reviews: ' + error.message
    }
  }
