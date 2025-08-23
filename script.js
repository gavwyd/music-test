(function(){
  // Configuration
  const SUPABASE_URL = 'https://qfvhzaxuocbtpinrjyqp.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdmh6YXh1b2NidHBpbnJqeXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzEzMjAsImV4cCI6MjA3MTU0NzMyMH0.Xn9_ZY6OM59xgUnb_Rc29go5sO1OdK4DIiFvpqQatDE'
  const SPOTIFY_CLIENT_ID = 'cf9a6e9189294eb4bfaa374f5481326d'
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Utility functions
  const $ = (sel, root=document) => root.querySelector(sel)
  const $ = (sel, root=document) => Array.from(root.querySelectorAll(sel))

  // Elements
  const els = {
    // Auth
    loginPrompt: $('#loginPrompt'),
    loginModal: $('#loginModal'),
    loadingApp: $('#loadingApp'),
    showLoginBtn: $('#showLoginBtn'),
    closeLoginModal: $('#closeLoginModal'),
    
    // Auth tabs
    authTabs: $('.auth-tab'),
    emailAuth: $('#emailAuth'),
    spotifyAuth: $('#spotifyAuth'),
    
    // Email auth
    loginEmail: $('#loginEmail'),
    loginPassword: $('#loginPassword'),
    emailLoginBtn: $('#emailLoginBtn'),
    emailRegisterBtn: $('#emailRegisterBtn'),
    
    // Spotify auth
    spotifyLoginBtn: $('#spotifyLoginBtn'),
    
    // User interface
    userBar: $('#userBar'),
    currentUser: $('#currentUser'),
    userAvatar: $('#userAvatar'),
    logoutBtn: $('#logoutBtn'),
    mainContent: $('#mainContent'),
    loginError: $('#loginError'),

    // Tabs
    tabs: $('.tab'),
    tabAdd: $('#tab-add'),
    tabMyReviews: $('#tab-my-reviews'),
    tabGlobalFeed: $('#tab-global-feed'),
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

    // Global Feed
    globalSearch: $('#globalSearch'),
    globalSortBy: $('#globalSortBy'),
    globalTypeFilter: $('#globalTypeFilter'),
    globalGenreFilter: $('#globalGenreFilter'),
    globalReviewsList: $('#globalReviewsList'),
    globalReviewsEmpty: $('#globalReviewsEmpty'),
    globalCount: $('#globalCount')
  }

  let currentUser = null
  let selectedMusicData = null
  let spotifyToken = null
  let searchTimeout = null

  // Initialize
  init()

  async function init() {
    setupEventListeners()
    
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await handleAuthSuccess(session.user)
    } else {
      showLoginPrompt()
    }
  }

  function setupEventListeners() {
    // Auth modals
    els.showLoginBtn.addEventListener('click', showLoginModal)
    els.closeLoginModal.addEventListener('click', hideLoginModal)
    els.loginModal.addEventListener('click', (e) => {
      if (e.target === els.loginModal) hideLoginModal()
    })

    // Auth tabs
    els.authTabs.forEach(tab => {
      tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab))
    })

    // Email auth
    els.emailLoginBtn.addEventListener('click', handleEmailLogin)
    els.emailRegisterBtn.addEventListener('click', handleEmailRegister)
    
    // Spotify auth
    els.spotifyLoginBtn.addEventListener('click', handleSpotifyLogin)
    els.logoutBtn.addEventListener('click', handleLogout)

    // Main tabs
    els.tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)))

    // Search
    els.musicSearch.addEventListener('input', handleSearchInput)
    document.addEventListener('click', (e) => {
      if (!els.searchSuggestions.contains(e.target) && e.target !== els.musicSearch) {
        els.searchSuggestions.style.display = 'none'
      }
    })

    // Form
    els.score.addEventListener('input', updateScoreDisplay)
    els.manualScore.addEventListener('input', handleManualScoreInput)
    els.saveBtn.addEventListener('click', handleSaveReview)
    els.clearFormBtn.addEventListener('click', clearForm)

    // My Reviews
    els.mySearch.addEventListener('input', debounce(loadMyReviews, 300))
    els.mySortBy.addEventListener('change', loadMyReviews)
    els.exportBtn.addEventListener('click', exportReviews)

    // Global Feed
    els.globalSearch.addEventListener('input', debounce(loadGlobalReviews, 300))
    els.globalSortBy.addEventListener('change', loadGlobalReviews)
    els.globalTypeFilter.addEventListener('change', loadGlobalReviews)
    els.globalGenreFilter.addEventListener('change', loadGlobalReviews)

    // Auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleAuthSuccess(session.user)
      } else if (event === 'SIGNED_OUT') {
        showLoginPrompt()
      }
    })
  }

  // Authentication
  function showLoginModal() {
    els.loginModal.classList.add('show')
    els.loginError.style.display = 'none'
  }

  function hideLoginModal() {
    els.loginModal.classList.remove('show')
  }

  function switchAuthTab(tab) {
    els.authTabs.forEach(t => t.classList.remove('active'))
    els.authTabs.find(t => t.dataset.authTab === tab).classList.add('active')
    
    els.emailAuth.style.display = tab === 'email' ? '' : 'none'
    els.spotifyAuth.style.display = tab === 'spotify' ? '' : 'none'
  }

  async function handleEmailLogin() {
    const email = els.loginEmail.value.trim()
    const password = els.loginPassword.value.trim()

    if (!email || !password) {
      showError('Please enter both email and password')
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      hideLoginModal()
    } catch (error) {
      showError(error.message)
    }
  }

  async function handleEmailRegister() {
    const email = els.loginEmail.value.trim()
    const password = els.loginPassword.value.trim()

    if (!email || !password) {
      showError('Please enter both email and password')
      return
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters')
      return
    }

    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: email.split('@')[0]
          }
        }
      })
      if (error) throw error
      showError('Check your email to confirm your account!', 'success')
    } catch (error) {
      showError(error.message)
    }
  }

  async function handleSpotifyLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          scopes: 'user-read-email user-read-private',
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Spotify login error:', error)
      showError('Spotify login failed. Please try again.')
    }
  }

  async function handleAuthSuccess(user) {
    currentUser = user
    
    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: user.user_metadata?.full_name || user.email.split('@')[0],
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=4da3ff&color=fff`
      }, {
        onConflict: 'id'
      })

    if (profileError) console.error('Profile error:', profileError)

    // Update UI
    els.currentUser.textContent = user.user_metadata?.full_name || user.email.split('@')[0]
    els.userAvatar.src = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=4da3ff&color=fff`
    
    showMainApp()
    await getSpotifyToken()
    await loadMyReviews()
    await loadGlobalReviews()
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut()
    }
  }

  function showError(message, type = 'error') {
    els.loginError.textContent = message
    els.loginError.style.display = 'block'
    els.loginError.style.color = type === 'success' ? 'var(--ok)' : 'var(--danger)'
    
    if (type === 'success') {
      setTimeout(() => {
        els.loginError.style.display = 'none'
      }, 5000)
    }
  }

  // UI State Management
  function showLoginPrompt() {
    els.loginPrompt.style.display = ''
    els.mainContent.style.display = 'none'
    els.userBar.style.display = 'none'
    els.loadingApp.style.display = 'none'
    currentUser = null
    selectedMusicData = null
    spotifyToken = null
  }

  function showMainApp() {
    els.loginPrompt.style.display = 'none'
    els.mainContent.style.display = ''
    els.userBar.style.display = ''
    els.loadingApp.style.display = 'none'
    hideLoginModal()
  }

  function switchTab(tab) {
    els.tabs.forEach(t => t.classList.remove('active'))
    els.tabs.find(t => t.dataset.tab === tab).classList.add('active')
    
    els.tabAdd.style.display = 'none'
    els.tabMyReviews.style.display = 'none'
    els.tabGlobalFeed.style.display = 'none'
    els.tabAbout.style.display = 'none'
    
    switch(tab) {
      case 'add':
        els.tabAdd.style.display = ''
        break
      case 'my-reviews':
        els.tabMyReviews.style.display = ''
        loadMyReviews()
        break
      case 'global-feed':
        els.tabGlobalFeed.style.display = ''
        loadGlobalReviews()
        break
      case 'about':
        els.tabAbout.style.display = ''
        break
    }
  }

  // Spotify Integration
  async function getSpotifyToken() {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=8c58098d229c4a4dafacbadcabe687f8`
      })
      
      const data = await response.json()
      spotifyToken = data.access_token
    } catch (error) {
      console.error('Failed to get Spotify token:', error)
    }
  }

  async function searchSpotify(query) {
    if (!spotifyToken || !query.trim()) return []
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album,track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        }
      )
      
      const data = await response.json()
      const results = []
      
      // Add albums
      if (data.albums?.items) {
        data.albums.items.forEach(item => {
          results.push({
            id: item.id,
            type: 'album',
            title: item.name,
            artist: item.artists.map(a => a.name).join(', '),
            cover: item.images[0]?.url || '',
            spotify_url: item.external_urls.spotify,
            release_date: item.release_date,
            genres: item.genres || []
          })
        })
      }
      
      // Add tracks
      if (data.tracks?.items) {
        data.tracks.items.forEach(item => {
          results.push({
            id: item.id,
            type: 'track',
            title: item.name,
            artist: item.artists.map(a => a.name).join(', '),
            album_title: item.album.name,
            cover: item.album.images[0]?.url || '',
            spotify_url: item.external_urls.spotify,
            release_date: item.album.release_date,
            genres: []
          })
        })
      }
      
      return results
    } catch (error) {
      console.error('Spotify search error:', error)
      return []
    }
  }

  function isSpotifyUrl(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === 'open.spotify.com' && 
             (urlObj.pathname.startsWith('/album/') || urlObj.pathname.startsWith('/track/'))
    } catch {
      return false
    }
  }

  async function getSpotifyInfoFromUrl(url) {
    if (!spotifyToken) return null
    
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const type = pathParts[1] // 'album' or 'track'
      const id = pathParts[2]
      
      const endpoint = type === 'album' 
        ? `https://api.spotify.com/v1/albums/${id}`
        : `https://api.spotify.com/v1/tracks/${id}`
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      })
      
      const data = await response.json()
      
      if (type === 'album') {
        return {
          id: data.id,
          type: 'album',
          title: data.name,
          artist: data.artists.map(a => a.name).join(', '),
          cover: data.images[0]?.url || '',
          spotify_url: data.external_urls.spotify,
          release_date: data.release_date,
          genres: data.genres || []
        }
      } else {
        return {
          id: data.id,
          type: 'track',
          title: data.name,
          artist: data.artists.map(a => a.name).join(', '),
          album_title: data.album.name,
          cover: data.album.images[0]?.url || '',
          spotify_url: data.external_urls.spotify,
          release_date: data.album.release_date,
          genres: []
        }
      }
    } catch (error) {
      console.error('Error getting Spotify info:', error)
      return null
    }
  }

  // Search Handling
  async function handleSearchInput(e) {
    const query = e.target.value.trim()
    
    if (!query) {
      els.searchSuggestions.style.display = 'none'
      return
    }

    // Check if it's a Spotify URL
    if (isSpotifyUrl(query)) {
      const musicData = await getSpotifyInfoFromUrl(query)
      if (musicData) {
        selectMusic(musicData)
        els.musicSearch.value = ''
        els.searchSuggestions.style.display = 'none'
        return
      }
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Debounce search
    searchTimeout = setTimeout(async () => {
      const results = await searchSpotify(query)
      showSearchSuggestions(results)
    }, 300)
  }

  function showSearchSuggestions(results) {
    if (results.length === 0) {
      els.searchSuggestions.style.display = 'none'
      return
    }

    els.searchSuggestions.innerHTML = ''
    results.forEach(item => {
      const div = document.createElement('div')
      div.className = 'search-suggestion'
      
      const imgSrc = item.cover && item.cover !== '' ? item.cover : generatePlaceholderImage()
      
      div.innerHTML = `
        <img src="${imgSrc}" alt="Cover" onerror="this.src='${generatePlaceholderImage()}'">
        <div class="suggestion-info">
          <div class="suggestion-title">${escapeHtml(item.title)}</div>
          <div class="suggestion-artist">${escapeHtml(item.artist)}</div>
          ${item.album_title ? `<div class="suggestion-artist">${escapeHtml(item.album_title)}</div>` : ''}
        </div>
        <div class="suggestion-type">${item.type}</div>
      `
      div.addEventListener('click', () => {
        selectMusic(item)
        els.musicSearch.value = ''
        els.searchSuggestions.style.display = 'none'
      })
      els.searchSuggestions.appendChild(div)
    })

    els.searchSuggestions.style.display = 'block'
  }

  function selectMusic(musicData) {
    selectedMusicData = musicData
    
    // Handle cover image with fallback
    const coverSrc = musicData.cover && musicData.cover !== '' ? musicData.cover : generatePlaceholderImage()
    els.selectedCover.src = coverSrc
    els.selectedCover.onerror = function() {
      this.src = generatePlaceholderImage()
    }
    
    els.selectedTitle.textContent = musicData.title
    els.selectedArtist.textContent = musicData.artist
    els.selectedType.textContent = musicData.type === 'album' ? 'Album' : 'Single'
    
    // Show genres if available
    els.selectedGenres.innerHTML = ''
    if (musicData.genres && musicData.genres.length > 0) {
      musicData.genres.forEach(genre => {
        const span = document.createElement('span')
        span.className = 'genre-tag'
        span.textContent = genre
        els.selectedGenres.appendChild(span)
      })
    }
    
    els.selectedMusic.style.display = ''
    updatePreview()
  }

  // Form Handling
  function updateScoreDisplay() {
    const value = parseFloat(els.score.value)
    els.scoreOut.textContent = value.toFixed(1)
    els.manualScore.value = ''
    updatePreview()
  }

  function handleManualScoreInput() {
    const value = parseFloat(els.manualScore.value)
    if (!isNaN(value) && value >= 0.5 && value <= 10) {
      els.score.value = value
      els.scoreOut.textContent = value.toFixed(1)
      updatePreview()
    }
  }

  function updatePreview() {
    if (!selectedMusicData) {
      els.previewPane.innerHTML = '<div class="empty">Select music to see preview</div>'
      return
    }

    const score = els.manualScore.value ? 
      parseFloat(els.manualScore.value) : 
      parseFloat(els.score.value)
    
    const reviewText = els.review.value.trim()

    const previewData = {
      ...selectedMusicData,
      score: Math.round(score * 10) / 10,
      review_text: reviewText,
      created_at: new Date().toISOString(),
      user: { 
        full_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
        avatar_url: currentUser.user_metadata?.avatar_url || els.userAvatar.src
      }
    }

    els.previewPane.innerHTML = ''
    els.previewPane.appendChild(createReviewCard(previewData, false, true))
  }

  async function handleSaveReview() {
    if (!selectedMusicData) {
      alert('Please select music to review')
      return
    }

    const score = els.manualScore.value ? 
      parseFloat(els.manualScore.value) : 
      parseFloat(els.score.value)
    
    const reviewText = els.review.value.trim()

    if (score < 0.5 || score > 10) {
      alert('Score must be between 0.5 and 10.0')
      return
    }

    els.saveBtn.disabled = true
    els.saveBtn.textContent = 'Saving...'

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: currentUser.id,
          title: selectedMusicData.title,
          artist: selectedMusicData.artist,
          album_title: selectedMusicData.album_title || null,
          cover_url: selectedMusicData.cover || null,
          spotify_id: selectedMusicData.id,
          spotify_url: selectedMusicData.spotify_url,
          type: selectedMusicData.type,
          score: Math.round(score * 10) / 10,
          review_text: reviewText || null,
          genres: selectedMusicData.genres || [],
          release_date: selectedMusicData.release_date || null
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Review saved successfully:', data)
      alert('Review saved successfully!')
      clearForm()
      
      // Reload reviews to show the new one
      await loadMyReviews()
      await loadGlobalReviews()
      
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

  // Reviews Loading
  async function loadMyReviews() {
    if (!currentUser) return

    try {
      const searchQuery = els.mySearch.value.trim().toLowerCase()
      const sortBy = els.mySortBy.value

      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', currentUser.id)

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,review_text.ilike.%${searchQuery}%`)
      }

      // Apply sorting
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

      const { data: reviews, error } = await query

      if (error) throw error

      // Process reviews data
      const processedReviews = reviews.map(review => ({
        ...review,
        user: review.profiles || {
          full_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
          avatar_url: currentUser.user_metadata?.avatar_url || els.userAvatar.src
        }
      }))

      renderReviews(processedReviews, els.myReviewsList, els.myReviewsEmpty, true)
      
      // Update stats
      els.statsPill.textContent = `${reviews.length} review${reviews.length === 1 ? '' : 's'}`

    } catch (error) {
      console.error('Error loading my reviews:', error)
    }
  }

  async function loadGlobalReviews() {
    try {
      const searchQuery = els.globalSearch.value.trim().toLowerCase()
      const sortBy = els.globalSortBy.value
      const typeFilter = els.globalTypeFilter.value
      const genreFilter = els.globalGenreFilter.value

      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_user_id_fkey (
            full_name,
            avatar_url
          ),
          review_likes!review_likes_review_id_fkey (
            id,
            user_id
          )
        `)

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,review_text.ilike.%${searchQuery}%`)
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      if (genreFilter !== 'all') {
        query = query.contains('genres', [genreFilter])
      }

      const { data: reviews, error } = await query

      if (error) throw error

      // Process likes and sorting
      const processedReviews = reviews.map(review => ({
        ...review,
        like_count: review.review_likes?.length || 0,
        user_liked: review.review_likes?.some(like => like.user_id === currentUser?.id) || false,
        user: review.profiles || {
          full_name: 'Anonymous',
          avatar_url: generatePlaceholderImage()
        }
      }))

      // Apply sorting
      switch (sortBy) {
        case 'likes-desc':
          processedReviews.sort((a, b) => b.like_count - a.like_count)
          break
        case 'score-desc':
          processedReviews.sort((a, b) => b.score - a.score)
          break
        case 'score-asc':
          processedReviews.sort((a, b) => a.score - b.score)
          break
        default:
          processedReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }

      renderReviews(processedReviews, els.globalReviewsList, els.globalReviewsEmpty, false)
      
      // Update count
      els.globalCount.textContent = `${processedReviews.length} review${processedReviews.length === 1 ? '' : 's'}`

      // Update genre filter options
      updateGenreFilter(processedReviews)

    } catch (error) {
      console.error('Error loading global reviews:', error)
    }
  }

  function updateGenreFilter(reviews) {
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
    listEl.innerHTML = ''
    
    if (reviews.length === 0) {
      emptyEl.style.display = ''
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
        <button class="like-btn ${review.user_liked ? 'liked' : ''}" data-review-id="${review.id}" ${!currentUser ? 'disabled' : ''}>
          ${review.user_liked ? '❤️' : '🤍'}
        </button>
        <div class="like-count">${review.like_count || 0}</div>
      </div>
    ` : '<div></div>'
    
    // Handle cover image with proper fallback
    const coverUrl = review.cover_url || review.cover
    const coverSrc = coverUrl && coverUrl !== '' ? coverUrl : generatePlaceholderImage()
    
    div.innerHTML = `
      <img src="${coverSrc}" alt="Cover" class="r-cover" onerror="this.src='${generatePlaceholderImage()}'">
      <div>
        <div class="r-title">
          ${review.spotify_url ? `<a href="${review.spotify_url}" target="_blank" rel="noopener">${escapeHtml(review.title)}</a>` : escapeHtml(review.title)}
        </div>
        <div class="r-artist">${escapeHtml(review.artist)}</div>
        ${review.album_title && review.type === 'track' ? `<div class="r-artist">from ${escapeHtml(review.album_title)}</div>` : ''}
        <div class="r-meta">
          <span class="score">${review.score}/10</span>
          <span class="tag">${review.type === 'album' ? 'Album' : 'Single'}</span>
          <span class="time">${new Date(review.created_at).toLocaleDateString()}</span>
        </div>
        ${review.genres && review.genres.length > 0 ? `
          <div class="genre-list">
            ${review.genres.map(genre => `<span class="genre-tag">${escapeHtml(genre)}</span>`).join('')}
          </div>
        ` : ''}
        ${review.review_text ? `<div class="r-text">${escapeHtml(review.review_text)}</div>` : ''}
        ${!isPreview && review.user ? `
          <div class="r-user">
            <img src="${review.user.avatar_url || generatePlaceholderImage()}" alt="User" onerror="this.src='${generatePlaceholderImage()}'">
            <span>by ${escapeHtml(review.user.full_name || 'Anonymous')}</span>
          </div>
        ` : ''}
        ${showActions ? `
          <div class="toolbar">
            <button class="btn ghost small edit-btn" data-review-id="${review.id}">✏️ Edit</button>
            <button class="btn danger small delete-btn" data-review-id="${review.id}">🗑️ Delete</button>
          </div>
        ` : ''}
      </div>
      ${likeSection}
    `

    // Add event listeners
    if (!isPreview) {
      const likeBtn = div.querySelector('.like-btn')
      if (likeBtn && currentUser) {
        likeBtn.addEventListener('click', () => toggleLike(review.id, likeBtn))
      }
    }

    if (showActions) {
      const editBtn = div.querySelector('.edit-btn')
      const deleteBtn = div.querySelector('.delete-btn')
      
      if (editBtn) {
        editBtn.addEventListener('click', () => editReview(review.id))
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteReview(review.id))
      }
    }

    return div
  }

  // Like System
  async function toggleLike(reviewId, likeBtn) {
    if (!currentUser) return

    try {
      const isLiked = likeBtn.classList.contains('liked')
      
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', currentUser.id)
        
        if (error) throw error
        
        likeBtn.classList.remove('liked')
        likeBtn.textContent = '🤍'
        
        const countEl = likeBtn.parentNode.querySelector('.like-count')
        const currentCount = parseInt(countEl.textContent)
        countEl.textContent = Math.max(0, currentCount - 1)
        
      } else {
        // Like
        const { error } = await supabase
          .from('review_likes')
          .insert({
            review_id: reviewId,
            user_id: currentUser.id
          })
        
        if (error) throw error
        
        likeBtn.classList.add('liked')
        likeBtn.textContent = '❤️'
        
        const countEl = likeBtn.parentNode.querySelector('.like-count')
        const currentCount = parseInt(countEl.textContent)
        countEl.textContent = currentCount + 1
      }
      
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Review Actions
  async function editReview(reviewId) {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single()

      if (error) throw error

      // Switch to add tab
      switchTab('add')

      // Populate form with review data
      const musicData = {
        id: review.spotify_id,
        type: review.type,
        title: review.title,
        artist: review.artist,
        album_title: review.album_title,
        cover: review.cover_url,
        spotify_url: review.spotify_url,
        genres: review.genres || []
      }

      selectMusic(musicData)
      els.score.value = review.score
      els.scoreOut.textContent = review.score.toFixed(1)
      els.review.value = review.review_text || ''
      updatePreview()

      // Delete the original review
      await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      await loadMyReviews()
      await loadGlobalReviews()

    } catch (error) {
      console.error('Error editing review:', error)
      alert('Failed to edit review. Please try again.')
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      await loadMyReviews()
      await loadGlobalReviews()
      
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review. Please try again.')
    }
  }

  // Export
  async function exportReviews() {
    if (!currentUser) return

    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const dataStr = JSON.stringify(reviews, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `reviewhub-export-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(link.href)
      
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export reviews. Please try again.')
    }
  }

  // Utility Functions
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  function generatePlaceholderImage() {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" fill="#0f1520"/>
        <rect x="10" y="10" width="100" height="100" fill="#0b1220" rx="6"/>
        <text x="60" y="60" dominant-baseline="central" text-anchor="middle" 
              font-family="Inter, sans-serif" font-size="10" fill="#7e94b1" font-weight="500">
          No Image
        </text>
      </svg>
    `)
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

})();
