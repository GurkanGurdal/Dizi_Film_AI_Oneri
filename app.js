// ========================================
// Configuration
// ========================================
// OpenRouter API (Free Gemini access)
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// TMDB API
const TMDB_API_KEY = '7b38ff183fa7e0c194098fec83b5f1ed';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
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
    contentTypeToggle: document.getElementById('contentTypeToggle'),
    categoryCards: document.querySelectorAll('.category-card'),
    moodButtons: document.querySelectorAll('.mood-btn'),
    platformCheckboxes: document.querySelectorAll('.platform-checkbox'),
    userPrompt: document.getElementById('userPrompt'),
    recommendBtn: document.getElementById('getRecommendation'),
    resultsSection: document.getElementById('resultsSection'),
    resultsContainer: document.getElementById('resultsContainer'),
    historySection: document.getElementById('historySection'),
    historyContainer: document.getElementById('historyContainer'),
    clearHistoryBtn: document.getElementById('clearHistory'),
    toggleLabels: document.querySelectorAll('.toggle-label')
};

// ========================================
// Initialize
// ========================================
function init() {
    loadHistory();
    setupEventListeners();
    updateToggleLabels();
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Content Type Toggle
    elements.contentTypeToggle.addEventListener('change', (e) => {
        state.contentType = e.target.checked ? 'dizi' : 'film';
        updateToggleLabels();
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
function updateToggleLabels() {
    elements.toggleLabels.forEach(label => {
        const type = label.dataset.type;
        if (type === state.contentType) {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });
}

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
    // Remove previous selection
    elements.moodButtons.forEach(b => b.classList.remove('selected'));

    // Select new mood
    btn.classList.add('selected');
    state.selectedMood = btn.dataset.mood;
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
            <div class="loading-spinner"></div>
            <p>Öneriler hazırlanıyor...</p>
        </div>
    `;
    elements.resultsSection.classList.add('visible');

    try {
        // Step 1: Get recommendations from OpenRouter (Gemini)
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'AI Film Öneri'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 4096,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 429) {
                throw new Error('API istek limiti aşıldı. Birkaç dakika bekleyip tekrar deneyin.');
            }
            throw new Error(errorData.error?.message || `API Hatası: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiResponse = data.choices[0].message.content;

            // Parse the JSON response
            const recommendations = parseRecommendations(aiResponse);

            if (recommendations.length > 0) {
                // Step 2: Fetch poster data from TMDB
                const enrichedRecommendations = await fetchTMDBData(recommendations);

                // Step 3: Display the poster cards
                displayPosterCards(enrichedRecommendations);
                saveToHistory(userPrompt, enrichedRecommendations);
            } else {
                throw new Error('Öneriler ayrıştırılamadı');
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

    let prompt = `Sen bir ${contentType} öneri uzmanısın. 

Kullanıcı için ${contentType} önerisi yap.

Tercihler:
- İçerik Türü: ${contentType}
- Kategoriler: ${categories}`;

    if (mood) {
        prompt += `\n- Ruh Hali: Kullanıcı şu an ${mood} hissediyor`;
    }

    if (platforms) {
        prompt += `\n- Platformlar: Şu platformlarda izlenebilen içerikler öner: ${platforms}`;
    }

    if (userPrompt) {
        prompt += `\n\nKullanıcının ek notu: "${userPrompt}"`;
    }

    prompt += `

ÖNEMLI: Yanıtını SADECE aşağıdaki JSON formatında ver:

[
  {
    "title": "Orijinal adı",
    "titleTr": "Türkçe adı",
    "year": "Yıl",
    "reason": "Kısa sebep (max 50 karakter)"
  }
]

5 adet ${contentType} öner. SADECE JSON ver, başka yazı yazma. Reason alanı çok KISA olsun!`;

    return prompt;
}

function parseRecommendations(text) {
    try {
        console.log('Raw Gemini response:', text);

        // Clean the text - remove markdown code blocks if present
        let cleanText = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        // Try to extract JSON array from the response
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('Parsed recommendations:', parsed);
            return parsed;
        }

        // If no array found, try parsing the whole text
        if (cleanText.startsWith('[')) {
            return JSON.parse(cleanText);
        }

        console.warn('No JSON array found in response');
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
            // Search for the title on TMDB (try English first for better results)
            const searchQuery = rec.title || rec.titleTr;
            let searchUrl = `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`;

            let response = await fetch(searchUrl);
            let data = await response.json();

            // If no results, try with Turkish title
            if ((!data.results || data.results.length === 0) && rec.titleTr && rec.titleTr !== rec.title) {
                searchUrl = `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(rec.titleTr)}`;
                response = await fetch(searchUrl);
                data = await response.json();
            }

            if (data.results && data.results.length > 0) {
                const result = data.results[0];

                // Check if content is originally Turkish
                const isTurkish = result.original_language === 'tr';

                // Get Turkish details for overview and Turkish poster if Turkish content
                const detailsTrUrl = `${TMDB_BASE_URL}/${searchType}/${result.id}?api_key=${TMDB_API_KEY}&language=tr-TR`;
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
                const providersUrl = `${TMDB_BASE_URL}/${searchType}/${result.id}/watch/providers?api_key=${TMDB_API_KEY}`;
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
                    <span class="watch-btn">🔍 Detay</span>
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
