// script.js

let storedUser = JSON.parse(localStorage.getItem('user')) || null;
const loginPage = document.getElementById('loginPage');
const app = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const reviewForm = document.getElementById('reviewForm');
const reviewsContainer = document.getElementById('reviews');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');

function showApp() {
  loginPage.style.display = 'none';
  app.style.display = 'block';
  renderReviews();
}

loginBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!storedUser) {
    storedUser = { username, password, reviews: [] };
    localStorage.setItem('user', JSON.stringify(storedUser));
    alert('Account created and logged in!');
  } else if (storedUser.username === username && storedUser.password === password) {
    alert('Login successful!');
  } else {
    alert('Invalid login');
    return;
  }

  showApp();
});

reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  let title = document.getElementById('customTitle').value.trim();
  let text = document.getElementById('reviewText').value.trim();
  let score = parseFloat(document.getElementById('score').value);
  let link = document.getElementById('spotifyLink').value.trim();
  let artist = '';
  let albumArt = '';

  if (link.includes('open.spotify.com/album')) {
    try {
      const albumId = link.split('/album/')[1].split('?')[0];
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://open.spotify.com/oembed?url=spotify:album:' + albumId)}`);
      const data = await res.json();
      const parsed = JSON.parse(data.contents);
      title = parsed.title;
      albumArt = parsed.thumbnail_url;
      artist = parsed.author_name || '';
    } catch (err) {
      console.error('Spotify fetch failed', err);
    }
  }

  storedUser.reviews.push({ title, artist, text, score, albumArt, date: new Date().getTime() });
  localStorage.setItem('user', JSON.stringify(storedUser));
  renderReviews();
  reviewForm.reset();
});

function renderReviews() {
  let reviews = [...storedUser.reviews];
  const searchTerm = searchInput.value.toLowerCase();

  if (searchTerm) {
    reviews = reviews.filter(r => r.title.toLowerCase().includes(searchTerm) || r.artist.toLowerCase().includes(searchTerm) || r.text.toLowerCase().includes(searchTerm));
  }

  const sortType = sortSelect.value;
  if (sortType === 'newest') reviews.sort((a,b)=> b.date - a.date);
  if (sortType === 'oldest') reviews.sort((a,b)=> a.date - b.date);
  if (sortType === 'highest') reviews.sort((a,b)=> b.score - a.score);
  if (sortType === 'lowest') reviews.sort((a,b)=> a.score - b.score);

  reviewsContainer.innerHTML = '';
  reviews.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'review';
    div.innerHTML = `
      <div class="review-header">
        ${r.albumArt ? `<img src="${r.albumArt}" class="album-art">` : ''}
        <div class="review-info">
          <h3>${r.title} ${r.artist ? '- ' + r.artist : ''}</h3>
          <p><strong>Score:</strong> ${r.score}/10</p>
        </div>
      </div>
      <p>${r.text}</p>
      <button onclick="deleteReview(${i})">Delete</button>
    `;
    reviewsContainer.appendChild(div);
  });
}

function deleteReview(index) {
  storedUser.reviews.splice(index,1);
  localStorage.setItem('user', JSON.stringify(storedUser));
  renderReviews();
}

searchInput.addEventListener('input', renderReviews);
sortSelect.addEventListener('change', renderReviews);

if(storedUser) showApp();
