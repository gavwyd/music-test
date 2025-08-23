function clearForm() {
    els.musicSearch.value = ''
    els.score.value = 7
    els.scoreOut.textContent = '7.00'
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
          )
        `)
        .eq('user_id', currentUser.id)

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,review_text.ilike.%${searchQuery}%`)
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
        case 'title-asc':
          query = query.order('title', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data: reviews, error } = await query

      if (error) throw error

      const processedReviews = reviews.map(review => ({
        ...review,
        user: review.profiles || currentUserProfile || {
          username: currentUser.email?.split('@')[0] || 'User',
          full_name: currentUser.email?.split('@')[0] || 'User',
          avatar_url: generatePlaceholderImage()
        }
      }))

      renderReviews(processedReviews, els.myReviewsList, els.myReviewsEmpty, true)
      
      els.statsPill.textContent = `${reviews.length} review${reviews.length === 1 ? '' : 's'}`

    } catch (error) {
      console.error('Error loading my reviews:', error)
      els.myReviewsList.innerHTML = ''
      els.myReviewsEmpty.style.display = ''
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
      
      els.globalCount.textContent = `${processedReviews.length} review${processedReviews.length === 1 ? '' : 's'}`

      updateGenreFilter(processedReviews)

    } catch (error) {
      console.error('Error loading global reviews:', error)
      els.globalReviewsList.innerHTML = ''
      els.globalReviewsEmpty.style.display = ''
      els.globalReviewsEmpty.textContent = 'Error loading reviews: ' + error.message
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
        <button class="like-btn ${review.user_liked ? 'like(function(){
  // Configuration
  const SUPABASE_URL = 'https://qfvhzaxuocbtpinrjyqp.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdmh6YXh1b2NidHBpbnJqeXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzEzMjAsImV4cCI6MjA3MTU0NzMyMH0.Xn9_ZY6OM59xgUnb_Rc29go5sO1OdK4DIiFvpqQatDE'
  const SPOTIFY_CLIENT_ID = 'cf9a6e9189294eb4bfaa374f5481326d'
  const SPOTIFY_CLIENT_SECRET = '8c58098d229c4a4dafacbadcabe687f8'
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Utility functions
  const $ = (sel, root=document) => root.querySelector(sel)
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel))

  // Elements
  const els = {
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
    commentsList: $('#commentsList')
  }

  let currentUser = null
  let currentUserProfile = null
  let selectedMusicData = null
  let spotifyToken = null
  let searchTimeout = null
  let currentReviewForComments = null
  let isRegisterMode = false

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
    els.emailLoginBtn.addEventListener('click', handleEmailLogin)
    els.emailRegisterBtn.addEventListener('click', handleEmailRegister)
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
    els.review.addEventListener('input', updatePreview)
    els.saveBtn.addEventListener('click', handleSaveReview)
    els.clearFormBtn.addEventListener('click', clearForm)

    // My Reviews
    els.mySearch.addEventListener('input', debounce(loadMyReviews, 300))
    els.mySortBy.addEventListener('change', loadMyReviews)
    els.exportBtn.addEventListener('click', exportReviews)
    els.shareProfileBtn.addEventListener('click', showShareModal)

    // Global Feed
    els.globalSearch.addEventListener('input', debounce(loadGlobalReviews, 300))
    els.globalSortBy.addEventListener('change', loadGlobalReviews)
    els.globalTypeFilter.addEventListener('change', loadGlobalReviews)
    els.globalGenreFilter.addEventListener('change', loadGlobalReviews)

    // Profile
    els.changeAvatarBtn.addEventListener('click', () => els.avatarUpload.click())
    els.avatarUpload.addEventListener('change', handleAvatarUpload)
    els.profileUsername.addEventListener('input', handleUsernameChange)
    els.saveUsernameBtn.addEventListener('click', saveUsername)
    els.saveBioBtn.addEventListener('click', saveBio)

    // User Profile View
    els.backToFeed.addEventListener('click', () => switchTab('global-feed'))

    // User avatar/name clicks
    els.userAvatar.addEventListener('click', () => switchTab('profile'))
    els.currentUser.addEventListener('click', () => switchTab('profile'))

    // Share Modal
    els.closeShareModal.addEventListener('click', hideShareModal)
    els.shareModal.addEventListener('click', (e) => {
      if (e.target === els.shareModal) hideShareModal()
    })
    els.copyLinkBtn.addEventListener('click', copyShareLink)

    // Comments Modal
    els.closeCommentsModal.addEventListener('click', hideCommentsModal)
    els.commentsModal.addEventListener('click', (e) => {
      if (e.target === els.commentsModal) hideCommentsModal()
    })
    els.submitComment.addEventListener('click', submitComment)

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
    els.emailRegisterBtn.addEventListener('click', (e) => {
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
      
      // Check if username is available
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        throw new Error('Username is already taken')
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
      showError('Check your email to confirm your account!', 'success')
    } catch (error) {
      showError(error.message)
    } finally {
      els.emailRegisterBtn.disabled = false
      els.emailRegisterBtn.textContent = 'Create Account'
    }
  }

  async function handleAuthSuccess(user) {
    currentUser = user
    
    // Create or update profile
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username,
        full_name: username,
        avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4da3ff&color=fff`,
        bio: '',
        last_username_change: null
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    } else {
      console.log('Profile created/updated successfully for user:', user.id)
      currentUserProfile = profile?.[0] || {
        id: user.id,
        username: username,
        full_name: username,
        avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4da3ff&color=fff`,
        bio: '',
        last_username_change: null
      }
    }

    // Load current profile data
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (currentProfile) {
        currentUserProfile = currentProfile
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }

    // Update UI
    const displayName = currentUserProfile?.username || username
    const avatarUrl = currentUserProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4da3ff&color=fff`
    
    els.currentUser.textContent = displayName
    els.userAvatar.src = avatarUrl
    
    showMainApp()
    await getSpotifyToken()
    switchTab('global-feed') // Start on global feed instead of add review
    await loadGlobalReviews()
    await loadMyReviews()
    updateProfileForm()
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut()
    }
  }

  function showError(message, type = 'error') {
    els.loginError.textContent = message
    els.loginError.style.display = 'block'
    els.loginError.className = type === 'success' ? 'success-msg' : 'error-msg'
    
    if (type === 'success') {
      setTimeout(() => {
        els.loginError.style.display = 'none'
      }, 5000)
    }
  }

  // UI State Management
  function showLoginModal() {
    els.loginModal.classList.add('show')
    els.mainContent.style.display = 'none'
    els.userBar.style.display = 'none'
    els.loadingApp.style.display = 'none'
    currentUser = null
    currentUserProfile = null
    selectedMusicData = null
    spotifyToken = null
    toggleRegisterMode(false)
  }

  function showMainApp() {
    els.loginModal.classList.remove('show')
    els.mainContent.style.display = ''
    els.userBar.style.display = ''
    els.loadingApp.style.display = 'none'
  }

  function switchTab(tab) {
    els.tabs.forEach(t => t.classList.remove('active'))
    const activeTab = els.tabs.find(t => t.dataset.tab === tab)
    if (activeTab) activeTab.classList.add('active')
    
    els.tabAdd.style.display = 'none'
    els.tabMyReviews.style.display = 'none'
    els.tabGlobalFeed.style.display = 'none'
    els.tabProfile.style.display = 'none'
    els.tabUserProfile.style.display = 'none'
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
      case 'profile':
        els.tabProfile.style.display = ''
        updateProfileForm()
        break
      case 'user-profile':
        els.tabUserProfile.style.display = ''
        break
      case 'about':
        els.tabAbout.style.display = ''
        break
    }
  }

  // Profile Management
  function updateProfileForm() {
    if (!currentUserProfile) return

    els.profileAvatar.src = currentUserProfile.avatar_url || generatePlaceholderImage()
    els.profileUsername.value = currentUserProfile.username || ''
    els.profileBio.value = currentUserProfile.bio || ''

    // Check if username can be changed
    const lastChange = currentUserProfile.last_username_change
    const canChangeUsername = !lastChange || (Date.now() - new Date(lastChange).getTime()) > (3 * 24 * 60 * 60 * 1000)
    
    els.saveUsernameBtn.disabled = !canChangeUsername
    els.usernameHint.textContent = canChangeUsername ? 
      'You can change your username every 3 days' : 
      'You can change your username again in a few days'
  }

  function handleUsernameChange() {
    const newUsername = els.profileUsername.value.trim()
    const isValid = newUsername.length >= 3 && newUsername.length <= 20 && /^[a-zA-Z0-9_]+$/.test(newUsername)
    const isDifferent = newUsername !== currentUserProfile?.username
    
    els.saveUsernameBtn.disabled = !isValid || !isDifferent || 
      (currentUserProfile?.last_username_change && 
       (Date.now() - new Date(currentUserProfile.last_username_change).getTime()) < (3 * 24 * 60 * 60 * 1000))
  }

  async function saveUsername() {
    const newUsername = els.profileUsername.value.trim()
    
    if (newUsername.length < 3 || newUsername.length > 20) {
      alert('Username must be between 3 and 20 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      alert('Username can only contain letters, numbers, and underscores')
      return
    }

    try {
      els.saveUsernameBtn.disabled = true
      els.saveUsernameBtn.textContent = 'Saving...'

      // Check if username is available
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUsername)
        .neq('id', currentUser.id)
        .single()

      if (existingUser) {
        alert('Username is already taken')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: newUsername,
          full_name: newUsername,
          last_username_change: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (error) throw error

      currentUserProfile.username = newUsername
      currentUserProfile.full_name = newUsername
      currentUserProfile.last_username_change = new Date().toISOString()

      els.currentUser.textContent = newUsername
      alert('Username updated successfully!')
      updateProfileForm()

    } catch (error) {
      console.error('Error updating username:', error)
      alert('Failed to update username: ' + error.message)
    } finally {
      els.saveUsernameBtn.disabled = false
      els.saveUsernameBtn.textContent = 'Save'
    }
  }

  async function saveBio() {
    const newBio = els.profileBio.value.trim()

    try {
      els.saveBioBtn.disabled = true
      els.saveBioBtn.textContent = 'Saving...'

      const { error } = await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', currentUser.id)

      if (error) throw error

      currentUserProfile.bio = newBio
      alert('Bio updated successfully!')

    } catch (error) {
      console.error('Error updating bio:', error)
      alert('Failed to update bio: ' + error.message)
    } finally {
      els.saveBioBtn.disabled = false
      els.saveBioBtn.textContent = 'Save Bio'
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    try {
      els.changeAvatarBtn.disabled = true
      els.changeAvatarBtn.textContent = 'Uploading...'

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      currentUserProfile.avatar_url = publicUrl
      els.profileAvatar.src = publicUrl
      els.userAvatar.src = publicUrl
      
      alert('Profile picture updated successfully!')

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to update profile picture: ' + error.message)
    } finally {
      els.changeAvatarBtn.disabled = false
      els.changeAvatarBtn.textContent = 'Change Photo'
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
        body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=${SPOTIFY_CLIENT_SECRET}`
      })
      
      const data = await response.json()
      spotifyToken = data.access_token
      console.log('Spotify token obtained successfully')
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
    els.scoreOut.textContent = value.toFixed(2)
    els.manualScore.value = ''
    updatePreview()
  }

  function handleManualScoreInput() {
    const value = parseFloat(els.manualScore.value)
    if (!isNaN(value) && value >= 0 && value <= 10) {
      els.score.value = value
      els.scoreOut.textContent = value.toFixed(2)
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
      score: Math.round(score * 100) / 100,
      review_text: reviewText,
      created_at: new Date().toISOString(),
      user: { 
        full_name: currentUserProfile?.username || currentUser?.email?.split('@')[0] || 'User',
        avatar_url: currentUserProfile?.avatar_url || els.userAvatar?.src
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

    if (!currentUser) {
      alert('Please log in to save reviews')
      return
    }

    const score = els.manualScore.value ? 
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

      console.log('Saving review with user_id:', currentUser.id, reviewData)

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Review saved successfully:', data)
      alert('Review saved successfully!')
      clearForm()
      
      // Reload reviews immediately
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
    els.scoreOut.textContent = '7.00'
    els.manualScore.value = ''
    els.review.value = ''
    els.selectedMusic.style.display = 'none'
    els.searchSuggestions.style.display = 'none'
    selectedMusicData = null
    updatePreview()
  }
