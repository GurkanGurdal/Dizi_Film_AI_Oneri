// ========================================
// Configuration
// ========================================
// Backend API URL - Render.com'da deploy edilecek
// Localhost için: 'http://localhost:3000'
// Production için: 'https://your-app-name.onrender.com'
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://dizi-film-ai-oneri.onrender.com';

// TMDB Image Base URL (poster gösterimi için)
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// ========================================
// State
// ========================================
let state = {
    contentType: 'film', // 'film' or 'dizi'
    selectedCategories: [],
    selectedMood: null,
    selectedPlatforms: [],
    history: []
};

// ========================================
// DOM Elements
// ========================================
const elements = {
    splitToggle: document.getElementById('splitToggle'),
    splitSides: document.querySelectorAll('.split-side'),
    contentTypeInput: document.getElementById('contentTypeInput'),
    categoryCards: document.querySelectorAll('.category-card'),
    moodButtons: document.querySelectorAll('.mood-btn'),
    platformCheckboxes: document.querySelectorAll('.platform-checkbox'),
    userPrompt: document.getElementById('userPrompt'),
    recommendBtn: document.getElementById('getRecommendation'),
    resultsSection: document.getElementById('resultsSection'),
    resultsContainer: document.getElementById('resultsContainer'),
    historySection: document.getElementById('historySection'),
    historyContainer: document.getElementById('historyContainer'),
    clearHistoryBtn: document.getElementById('clearHistory')
};

// ========================================
// Initialize
// ========================================
function init() {
    loadHistory();
    setupEventListeners();
    loadTrendingContent('movie'); // Varsayılan olarak filmler
    setupTrendingTabs();
}

// ========================================
// Trending Banner
// ========================================
let currentTrendingType = 'movie';

async function loadTrendingContent(type) {
    const track = document.getElementById('trendingTrack');
    if (!track) return;

    currentTrendingType = type;

    // Loading state
    track.innerHTML = Array(10).fill().map(() => `
        <div class="trend-card loading">
            <div class="trend-poster-wrapper">
                <img class="trend-poster" src="" alt="">
            </div>
            <div class="trend-info">
                <div class="trend-title"></div>
                <div class="trend-year"></div>
            </div>
        </div>
    `).join('');

    try {
        const response = await fetch(`${BACKEND_URL}/api/tmdb/trending/${type}/week`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            track.innerHTML = data.results.slice(0, 10).map((item, index) => {
                const title = item.title || item.name;
                const year = (item.release_date || item.first_air_date || '').substring(0, 4);
                const poster = item.poster_path 
                    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                    : 'https://via.placeholder.com/150x225?text=No+Image';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

                return `
                    <div class="trend-card" data-id="${item.id}" data-type="${type}">
                        <div class="trend-poster-wrapper">
                            <img class="trend-poster" src="${poster}" alt="${title}">
                            <span class="trend-rank">${index + 1}</span>
                            <span class="trend-rating">⭐ ${rating}</span>
                        </div>
                        <div class="trend-info">
                            <div class="trend-title" title="${title}">${title}</div>
                            <div class="trend-year">${year}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // Add click handlers
            track.querySelectorAll('.trend-card').forEach(card => {
                card.addEventListener('click', () => openTrendingModal(card.dataset.id, card.dataset.type));
            });
        }
    } catch (error) {
        console.error('Trending load error:', error);
        track.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">Trend içerikler yüklenemedi.</p>';
    }
}

async function openTrendingModal(id, type) {
    try {
        const detailsUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}?language=tr-TR`;
        const response = await fetch(detailsUrl);
        const data = await response.json();

        const title = data.title || data.name;
        const titleTr = title;
        const year = (data.release_date || data.first_air_date || '').substring(0, 4);
        const poster = data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null;
        const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null;
        const overview = data.overview || 'Açıklama bulunamadı.';
        const rating = data.vote_average ? data.vote_average.toFixed(1) : null;

        // Get providers
        const providersUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}/watch/providers`;
        const providersResponse = await fetch(providersUrl);
        const providersData = await providersResponse.json();
        const providers = providersData.results?.TR?.flatrate || [];

        openModal({
            id,
            title,
            titleTr,
            year,
            poster,
            backdrop,
            overview,
            rating,
            tmdbUrl: `https://www.themoviedb.org/${type}/${id}`,
            providers
        });
    } catch (error) {
        console.error('Error opening trending modal:', error);
    }
}

function setupTrendingTabs() {
    const tabs = document.querySelectorAll('.trend-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadTrendingContent(tab.dataset.type);
        });
    });

    // Carousel buttons
    const track = document.getElementById('trendingTrack');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    if (prevBtn && nextBtn && track) {
        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -300, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Split Toggle (Film/Dizi Selection)
    elements.splitSides.forEach(side => {
        side.addEventListener('click', () => {
            const type = side.dataset.type;
            
            // Update state
            state.contentType = type;
            
            // Update hidden input
            if (elements.contentTypeInput) {
                elements.contentTypeInput.value = type;
            }
            
            // Update active class
            elements.splitSides.forEach(s => s.classList.remove('active'));
            side.classList.add('active');
        });
    });

    // Category Selection
    elements.categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            toggleCategory(category, card);
        });
    });

    // Mood Selection
    elements.moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectMood(btn);
        });
    });

    // Platform Selection
    elements.platformCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateSelectedPlatforms();
        });
    });

    // Get Recommendation
    elements.recommendBtn.addEventListener('click', getRecommendation);

    // Clear History
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // Enter key to submit
    elements.userPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            getRecommendation();
        }
    });
}

// ========================================
// Toggle Functions
// ========================================
function toggleCategory(category, card) {
    const index = state.selectedCategories.indexOf(category);
    if (index > -1) {
        state.selectedCategories.splice(index, 1);
        card.classList.remove('selected');
    } else {
        state.selectedCategories.push(category);
        card.classList.add('selected');
    }
}

function selectMood(btn) {
    const mood = btn.dataset.mood;
    
    // If clicking the same mood, deselect it
    if (state.selectedMood === mood) {
        btn.classList.remove('selected');
        state.selectedMood = null;
    } else {
        // Remove previous selection
        elements.moodButtons.forEach(b => b.classList.remove('selected'));
        // Select new mood
        btn.classList.add('selected');
        state.selectedMood = mood;
    }
}

function updateSelectedPlatforms() {
    state.selectedPlatforms = [];
    elements.platformCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            state.selectedPlatforms.push(checkbox.value);
        }
    });
}

// ========================================
// Recommendation Logic
// ========================================
async function getRecommendation() {
    const userPrompt = elements.userPrompt.value.trim();

    // Build the prompt
    const prompt = buildPrompt(userPrompt);

    // Show loading state
    elements.recommendBtn.classList.add('loading');
    elements.resultsContainer.innerHTML = `
        <div class="loading-container">
            <div class="mask-loader">
                <div class="loader-sparkles">
                    <span class="sparkle s1">✦</span>
                    <span class="sparkle s2">✦</span>
                    <span class="sparkle s3">✧</span>
                    <span class="sparkle s4">✦</span>
                    <span class="sparkle s5">✧</span>
                    <span class="sparkle s6">✦</span>
                </div>
                <div class="mask-line"></div>
                <div class="theater-mask">
                    <img src="assets/sad.png" alt="" class="mask-glow mask-sad-glow">
                    <img src="assets/happy.png" alt="" class="mask-glow mask-happy-glow">
                    <img src="assets/sad.png" alt="Sad" class="mask-img mask-sad">
                    <img src="assets/happy.png" alt="Happy" class="mask-img mask-happy">
                </div>
            </div>
            <div class="loading-text">
                <span>Öneriler hazırlanıyor</span>
            </div>
        </div>
    `;
    elements.resultsSection.classList.add('visible');

    try {
        // Try different models if one fails
        // Call backend API
        const response = await fetch(`${BACKEND_URL}/api/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API Hatası: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiResponse = data.choices[0].message.content;
            console.log('AI Raw Response:', aiResponse);

            // Parse the JSON response
            const recommendations = parseRecommendations(aiResponse);

            if (recommendations.length > 0) {
                // Step 2: Fetch poster data from TMDB
                const enrichedRecommendations = await fetchTMDBData(recommendations);

                // Step 3: Display the poster cards
                displayPosterCards(enrichedRecommendations);
                saveToHistory(userPrompt, enrichedRecommendations);
            } else {
                // AI düzgün JSON vermedi, yanıtı göster
                console.error('AI yanıtı JSON formatında değil:', aiResponse);
                throw new Error('AI uygun öneri üretemedi. Lütfen farklı seçimlerle tekrar deneyin.');
            }
        } else {
            throw new Error('Beklenmeyen API yanıtı');
        }
    } catch (error) {
        console.error('Error:', error);
        displayError(error.message);
    } finally {
        elements.recommendBtn.classList.remove('loading');
    }
}

function buildPrompt(userPrompt) {
    const contentType = state.contentType === 'film' ? 'film' : 'dizi';
    const categories = state.selectedCategories.length > 0
        ? state.selectedCategories.join(', ')
        : 'herhangi bir kategori';

    const moodMap = {
        'mutlu': 'mutlu ve neşeli',
        'uzgun': 'üzgün ve duygusal',
        'heyecanli': 'heyecanlı ve enerjik',
        'rahat': 'rahat ve huzurlu',
        'nostaljik': 'nostaljik'
    };

    const mood = state.selectedMood ? moodMap[state.selectedMood] : null;

    const platformMap = {
        'netflix': 'Netflix',
        'disney': 'Disney+',
        'amazon': 'Amazon Prime Video',
        'blutv': 'BluTV',
        'exxen': 'Exxen',
        'mubi': 'MUBI'
    };

    const platforms = state.selectedPlatforms.length > 0
        ? state.selectedPlatforms.map(p => platformMap[p]).join(', ')
        : null;

    // Güncel tarih bilgisi
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.toLocaleString('tr-TR', { month: 'long' });

    let prompt = `Sen bir ${contentType} öneri uzmanısın. 

GÜNCEL TARİH: ${currentMonth} ${currentYear}

Tercihler:
- İçerik Türü: ${contentType}
- Kategoriler: ${categories}`;

    if (mood) {
        prompt += `\n- Ruh Hali: ${mood}`;
    }

    if (platforms) {
        prompt += `\n- Platformlar: ${platforms}`;
    }

    if (userPrompt) {
        prompt += `\n\n⚠️ EN ÖNEMLİ - KULLANICININ İSTEĞİ (bunu diğer tercihlerden öncelikli tut): "${userPrompt}"
Eğer kullanıcının isteği yukarıdaki seçimlerle çelişiyorsa, KULLANICININ İSTEĞİNE GÖRE hareket et!`;
    }

    prompt += `

Yanıtını SADECE JSON formatında ver:
[{"title": "Orijinal ad", "titleTr": "Türkçe ad", "year": "Yıl", "reason": "Kısa sebep"}]

5 adet ${contentType} öner. SADECE JSON ver, başka yazı YAZMA!`;

    return prompt;
}

function parseRecommendations(text) {
    try {
        console.log('Raw AI response:', text);

        // Clean the text - remove markdown code blocks, invisible characters, etc.
        let cleanText = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
            .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();

        // Try to extract JSON array from the response
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            let jsonStr = jsonMatch[0];
            
            // Try parsing directly first
            try {
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log('Direct parse successful:', parsed);
                    return parsed;
                }
            } catch (e) {
                console.log('Direct parse failed, trying cleanup:', e.message);
            }
            
            // Clean and try again
            jsonStr = jsonStr
                .replace(/,\s*\]/g, ']')
                .replace(/,\s*\}/g, '}')
                .replace(/[\n\r\t]/g, ' ')
                .replace(/\s+/g, ' ');
            
            try {
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log('Cleaned parse successful:', parsed);
                    return parsed;
                }
            } catch (e) {
                console.log('Cleaned parse also failed:', e.message);
            }
        }

        // Fallback: manually extract film data using regex
        console.log('Attempting regex extraction...');
        const films = [];
        const regex = /"title"\s*:\s*"([^"]+)"[^}]*"titleTr"\s*:\s*"([^"]+)"[^}]*"year"\s*:\s*"?(\d{4})"?[^}]*"reason"\s*:\s*"([^"]+)"/g;
        let match;
        
        while ((match = regex.exec(cleanText)) !== null) {
            films.push({
                title: match[1],
                titleTr: match[2],
                year: match[3],
                reason: match[4]
            });
        }
        
        if (films.length > 0) {
            console.log('Regex extraction successful:', films);
            return films;
        }

        console.warn('All parse methods failed for:', cleanText);
        return [];
    } catch (error) {
        console.error('JSON parse error:', error);
        console.error('Text that failed to parse:', text);
        return [];
    }
}

// ========================================
// TMDB API Functions
// ========================================
async function fetchTMDBData(recommendations) {
    const enrichedData = [];
    const searchType = state.contentType === 'film' ? 'movie' : 'tv';

    for (const rec of recommendations) {
        try {
            // Search for the title on TMDB via backend
            const searchQuery = rec.title || rec.titleTr;
            let searchUrl = `${BACKEND_URL}/api/tmdb/search/${searchType}?query=${encodeURIComponent(searchQuery)}`;

            let response = await fetch(searchUrl);
            let data = await response.json();

            // If no results, try with Turkish title
            if ((!data.results || data.results.length === 0) && rec.titleTr && rec.titleTr !== rec.title) {
                searchUrl = `${BACKEND_URL}/api/tmdb/search/${searchType}?query=${encodeURIComponent(rec.titleTr)}`;
                response = await fetch(searchUrl);
                data = await response.json();
            }

            if (data.results && data.results.length > 0) {
                const result = data.results[0];

                // Check if content is originally Turkish
                const isTurkish = result.original_language === 'tr';

                // Get Turkish details for overview and Turkish poster if Turkish content
                const detailsTrUrl = `${BACKEND_URL}/api/tmdb/${searchType}/${result.id}?language=tr-TR`;
                const detailsTrResponse = await fetch(detailsTrUrl);
                const detailsTrData = await detailsTrResponse.json();

                // For poster: use Turkish for Turkish content, original language for foreign content
                let originalPoster, originalBackdrop;
                if (isTurkish) {
                    // Turkish content - use Turkish poster
                    originalPoster = detailsTrData.poster_path || result.poster_path;
                    originalBackdrop = detailsTrData.backdrop_path || result.backdrop_path;
                } else {
                    // Foreign content - use original/no-language poster
                    originalPoster = result.poster_path;
                    originalBackdrop = result.backdrop_path;
                }

                // Get watch providers
                const providersUrl = `${BACKEND_URL}/api/tmdb/${searchType}/${result.id}/watch/providers`;
                const providersResponse = await fetch(providersUrl);
                const providersData = await providersResponse.json();
                const trProviders = providersData.results?.TR;

                enrichedData.push({
                    id: result.id,
                    title: rec.title,
                    titleTr: detailsTrData.title || detailsTrData.name || result.title || result.name,
                    year: rec.year || (result.release_date || result.first_air_date || '').substring(0, 4),
                    poster: originalPoster ? `${TMDB_IMAGE_BASE}${originalPoster}` : null,
                    backdrop: originalBackdrop ? `https://image.tmdb.org/t/p/w1280${originalBackdrop}` : null,
                    overview: detailsTrData.overview || result.overview || 'Açıklama bulunamadı.',
                    rating: result.vote_average ? result.vote_average.toFixed(1) : null,
                    reason: rec.reason,
                    tmdbUrl: `https://www.themoviedb.org/${searchType}/${result.id}`,
                    providers: trProviders?.flatrate || trProviders?.buy || trProviders?.rent || []
                });
            } else {
                // If not found on TMDB, still add it without poster
                enrichedData.push({
                    id: null,
                    title: rec.title,
                    titleTr: rec.titleTr,
                    year: rec.year,
                    poster: null,
                    overview: null,
                    rating: null,
                    reason: rec.reason,
                    tmdbUrl: `https://www.google.com/search?q=${encodeURIComponent(rec.title + ' izle')}`,
                    providers: []
                });
            }
        } catch (error) {
            console.error('TMDB fetch error:', error);
            enrichedData.push({
                id: null,
                title: rec.title,
                titleTr: rec.titleTr,
                year: rec.year,
                poster: null,
                reason: rec.reason,
                tmdbUrl: `https://www.google.com/search?q=${encodeURIComponent(rec.title + ' izle')}`,
                providers: []
            });
        }
    }

    return enrichedData;
}

// ========================================
// Display Functions
// ========================================
// Global variable to store current recommendations
let currentRecommendations = [];

function displayPosterCards(recommendations) {
    currentRecommendations = recommendations;
    const cardsHTML = recommendations.map((rec, index) => {
        const posterStyle = rec.poster
            ? `background-image: url('${rec.poster}')`
            : `background: linear-gradient(135deg, #1a1a2e, #16213e)`;

        const ratingBadge = rec.rating
            ? `<div class="rating-badge">⭐ ${rec.rating}</div>`
            : '';

        const providerIcons = rec.providers.slice(0, 3).map(p =>
            `<img src="https://image.tmdb.org/t/p/original${p.logo_path}" alt="${p.provider_name}" class="provider-icon" title="${p.provider_name}">`
        ).join('');

        return `
            <div class="poster-card" onclick="openMovieModal(${index})">
                <div class="poster-image" style="${posterStyle}">
                    ${!rec.poster ? '<div class="no-poster">🎬</div>' : ''}
                    ${ratingBadge}
                </div>
                <div class="poster-info">
                    <h3 class="poster-title">${rec.titleTr || rec.title}</h3>
                    ${rec.year ? `<span class="poster-year">${rec.year}</span>` : ''}
                    ${rec.reason ? `<p class="poster-reason">${rec.reason}</p>` : ''}
                    ${providerIcons ? `<div class="poster-providers">${providerIcons}</div>` : ''}
                </div>
                <div class="poster-overlay">
                    <span class="detail-hint">Detay için tıkla</span>
                </div>
            </div>
        `;
    }).join('');

    elements.resultsContainer.innerHTML = `
        <div class="poster-grid">
            ${cardsHTML}
        </div>
    `;

    elements.resultsSection.classList.add('visible');
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayError(message) {
    elements.resultsContainer.innerHTML = `
        <div class="error-message">
            <p>⚠️ Bir hata oluştu: ${message}</p>
            <p>Lütfen tekrar deneyin.</p>
        </div>
    `;

    elements.resultsSection.classList.add('visible');
}

// ========================================
// History Functions
// ========================================
function loadHistory() {
    const savedHistory = localStorage.getItem('recommendationHistory');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        renderHistory();
    }
}

function saveToHistory(prompt, recommendations) {
    const historyItem = {
        id: Date.now(),
        prompt: prompt || 'Genel öneri',
        categories: [...state.selectedCategories],
        mood: state.selectedMood,
        contentType: state.contentType,
        platforms: [...state.selectedPlatforms],
        recommendations: recommendations,
        date: new Date().toLocaleString('tr-TR')
    };

    // Add to beginning of array
    state.history.unshift(historyItem);

    // Keep only last 20 items
    if (state.history.length > 20) {
        state.history = state.history.slice(0, 20);
    }

    // Save to localStorage
    localStorage.setItem('recommendationHistory', JSON.stringify(state.history));

    renderHistory();
}

function renderHistory() {
    if (state.history.length === 0) {
        elements.historySection.classList.remove('visible');
        return;
    }

    elements.historySection.classList.add('visible');

    elements.historyContainer.innerHTML = state.history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-prompt">${item.prompt}</div>
            <div class="history-meta">
                <span class="history-tag">${item.contentType === 'film' ? '🎞️ Film' : '📺 Dizi'}</span>
                ${item.categories.slice(0, 2).map(cat => `<span class="history-tag">${cat}</span>`).join('')}
                ${item.categories.length > 2 ? `<span class="history-tag">+${item.categories.length - 2}</span>` : ''}
                <span class="history-date">${item.date}</span>
            </div>
        </div>
    `).join('');

    // Add click listeners to history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            showHistoryItem(id);
        });
    });
}

function showHistoryItem(id) {
    const item = state.history.find(h => h.id === id);
    if (item && item.recommendations) {
        displayPosterCards(item.recommendations);
    }
}

function clearHistory() {
    if (confirm('Tüm öneri geçmişini silmek istediğinize emin misiniz?')) {
        state.history = [];
        localStorage.removeItem('recommendationHistory');
        elements.historySection.classList.remove('visible');
    }
}

// ========================================
// Modal Functions
// ========================================
function openMovieModal(index) {
    const movie = currentRecommendations[index];
    if (!movie) return;

    const modal = document.getElementById('movieModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalPoster = document.getElementById('modalPoster');
    const modalTitle = document.getElementById('modalTitle');
    const modalYear = document.getElementById('modalYear');
    const modalRating = document.getElementById('modalRating');
    const modalDescription = document.getElementById('modalDescription');
    const modalReason = document.getElementById('modalReason');
    const modalReasonBox = document.getElementById('modalReasonBox');
    const modalPlatforms = document.getElementById('modalPlatforms');
    const modalTmdbLink = document.getElementById('modalTmdbLink');

    // Set backdrop and poster
    if (movie.backdrop) {
        modalBackdrop.style.backgroundImage = `url('${movie.backdrop}')`;
    } else if (movie.poster) {
        modalBackdrop.style.backgroundImage = `url('${movie.poster}')`;
    } else {
        modalBackdrop.style.backgroundImage = 'none';
        modalBackdrop.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
    }

    if (movie.poster) {
        modalPoster.style.backgroundImage = `url('${movie.poster}')`;
    } else {
        modalPoster.style.backgroundImage = 'none';
        modalPoster.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:4rem;">🎬</div>';
    }

    // Set text content
    modalTitle.textContent = movie.titleTr || movie.title;
    modalYear.textContent = movie.year || 'N/A';
    modalRating.textContent = movie.rating ? `⭐ ${movie.rating}` : '';
    modalDescription.textContent = movie.overview || 'Açıklama bulunamadı.';

    // Set reason
    if (movie.reason) {
        modalReason.textContent = movie.reason;
        modalReasonBox.style.display = 'block';
    } else {
        modalReasonBox.style.display = 'none';
    }

    // Set TMDB link
    modalTmdbLink.href = movie.tmdbUrl;

    // Set platforms
    renderPlatformLinks(modalPlatforms, movie.providers);

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMovieModal() {
    const modal = document.getElementById('movieModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderPlatformLinks(container, providers) {
    if (!providers || providers.length === 0) {
        container.innerHTML = `
            <div class="no-platforms">
                <p>🔍 Bu içerik için Türkiye'de izleme platformu bulunamadı.</p>
                <p>Google'da arayabilirsiniz.</p>
            </div>
        `;
        return;
    }

    // Platform URL mappings
    const platformUrls = {
        'Netflix': 'https://www.netflix.com/search?q=',
        'Disney Plus': 'https://www.disneyplus.com/search',
        'Amazon Prime Video': 'https://www.primevideo.com/search/?phrase=',
        'Apple TV Plus': 'https://tv.apple.com/search?term=',
        'BluTV': 'https://www.blutv.com/arama?q=',
        'Exxen': 'https://www.exxen.com/',
        'MUBI': 'https://mubi.com/tr/search?query=',
        'Gain': 'https://www.gain.tv/',
        'YouTube': 'https://www.youtube.com/results?search_query='
    };

    const linksHTML = providers.map(provider => {
        const searchUrl = platformUrls[provider.provider_name] ||
            `https://www.google.com/search?q=${encodeURIComponent(document.getElementById('modalTitle').textContent + ' ' + provider.provider_name + ' izle')}`;

        return `
            <a href="${searchUrl}" target="_blank" class="platform-link" rel="noopener noreferrer">
                <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                <span>${provider.provider_name}</span>
            </a>
        `;
    }).join('');

    container.innerHTML = linksHTML;
}

// Setup modal event listeners
function setupModalListeners() {
    const modal = document.getElementById('movieModal');
    const closeBtn = document.getElementById('modalClose');

    // Close button click
    closeBtn.addEventListener('click', closeMovieModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMovieModal();
        }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeMovieModal();
        }
    });
}

// ========================================
// Start Application
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupModalListeners();
});
