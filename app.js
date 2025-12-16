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
let heroSlideIndex = 0;
let heroSlideInterval = null;
let heroData = [];

async function loadTrendingContent(type) {
    const track = document.getElementById('trendingTrack');
    const heroSlides = document.getElementById('heroSlides');
    const heroIndicators = document.getElementById('heroIndicators');
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

    if (heroSlides) {
        heroSlides.innerHTML = '<div class="hero-slide"><div class="hero-backdrop" style="background: linear-gradient(135deg, #1a1a2e, #16213e);"></div></div>';
    }

    try {
        // Orijinal poster için dil parametresi olmadan çek
        const originalResponse = await fetch(`${BACKEND_URL}/api/tmdb/trending/${type}/week`);
        const originalData = await originalResponse.json();
        
        // Türkçe başlık/açıklama için tr-TR ile çek
        const trResponse = await fetch(`${BACKEND_URL}/api/tmdb/trending/${type}/week?language=tr-TR`);
        const trData = await trResponse.json();

        if (originalData.results && originalData.results.length > 0) {
            // Orijinal ve Türkçe verileri birleştir
            heroData = originalData.results.slice(0, 5).map((item, index) => {
                const trItem = trData.results[index] || item;
                return {
                    ...item,
                    title: trItem.title || trItem.name, // Türkçe başlık
                    name: trItem.name || trItem.title,
                    overview: trItem.overview || item.overview, // Türkçe açıklama
                    // poster_path ve backdrop_path orijinal kalacak
                };
            });
            
            // Render Hero Slider
            if (heroSlides && heroIndicators) {
                heroSlides.innerHTML = heroData.map((item, index) => {
                    const title = item.title || item.name;
                    const year = (item.release_date || item.first_air_date || '').substring(0, 4);
                    const backdrop = item.backdrop_path 
                        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
                        : null;
                    const poster = item.poster_path 
                        ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                        : null;
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                    const overview = item.overview || 'Açıklama bulunamadı.';

                    return `
                        <div class="hero-slide" data-id="${item.id}" data-type="${type}" data-poster="${poster || ''}">
                            <div class="hero-backdrop" style="background-image: url('${backdrop}')"></div>
                            <div class="hero-gradient"></div>
                            <div class="hero-content">
                                <div class="hero-rank-badge">
                                    <span>🏆</span>
                                    <span>#${index + 1} Bu Hafta</span>
                                </div>
                                <h2 class="hero-title">${title}</h2>
                                <div class="hero-meta">
                                    <span class="hero-rating">⭐ ${rating}</span>
                                    <span>${year}</span>
                                    <span>${type === 'movie' ? 'Film' : 'Dizi'}</span>
                                </div>
                                <p class="hero-overview">${overview}</p>
                                <button class="hero-btn" onclick="openTrendingModalFromHero(this)">
                                    <span>Detayları Gör</span>
                                    <span>→</span>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

                // Render indicators
                heroIndicators.innerHTML = heroData.map((_, index) => `
                    <div class="hero-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
                `).join('');

                // Setup hero slider
                setupHeroSlider();
            }

            // Render small cards - orijinal poster, Türkçe başlık
            const smallCards = originalData.results.slice(0, 10).map((item, index) => {
                const trItem = trData.results[index] || item;
                return {
                    ...item,
                    title: trItem.title || trItem.name,
                    name: trItem.name || trItem.title,
                };
            });
            
            track.innerHTML = smallCards.map((item, index) => {
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
                card.addEventListener('click', () => {
                    const posterImg = card.querySelector('.trend-poster');
                    const originalPoster = posterImg ? posterImg.src : null;
                    openTrendingModal(card.dataset.id, card.dataset.type, originalPoster);
                });
            });
        }
    } catch (error) {
        console.error('Trending load error:', error);
        track.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">Trend içerikler yüklenemedi.</p>';
    }
}

function setupHeroSlider() {
    const slides = document.getElementById('heroSlides');
    const indicatorsContainer = document.getElementById('heroIndicators');
    const prevBtn = document.querySelector('.hero-prev');
    const nextBtn = document.querySelector('.hero-next');

    if (!slides || heroData.length === 0) return;

    heroSlideIndex = 0;
    let isPaused = false;

    // Render indicators with progress bars inside
    indicatorsContainer.innerHTML = heroData.map((_, index) => `
        <div class="hero-indicator ${index === 0 ? 'active' : ''}" data-index="${index}">
            <div class="progress-fill"></div>
        </div>
    `).join('');

    function startProgressAnimation(index, paused = false) {
        const indicators = indicatorsContainer.querySelectorAll('.hero-indicator');
        indicators.forEach((ind, i) => {
            const progressBar = ind.querySelector('.progress-fill');
            if (progressBar) {
                // Reset animation
                progressBar.style.animation = 'none';
                progressBar.style.width = '0%';
                progressBar.offsetHeight; // Force reflow
                
                if (i === index) {
                    progressBar.style.animation = 'indicatorProgress 5s linear forwards';
                    progressBar.style.animationPlayState = paused ? 'paused' : 'running';
                }
            }
        });
    }

    function goToSlide(index, triggeredByUser = false) {
        heroSlideIndex = index;
        if (heroSlideIndex >= heroData.length) heroSlideIndex = 0;
        if (heroSlideIndex < 0) heroSlideIndex = heroData.length - 1;

        slides.style.transform = `translateX(-${heroSlideIndex * 100}%)`;

        // Update active indicator
        const indicators = indicatorsContainer.querySelectorAll('.hero-indicator');
        indicators.forEach((ind, i) => {
            ind.classList.toggle('active', i === heroSlideIndex);
        });

        // Start progress animation - if triggered by user while hovering, start paused
        startProgressAnimation(heroSlideIndex, triggeredByUser && isPaused);
    }

    function nextSlide(triggeredByUser = false) {
        goToSlide(heroSlideIndex + 1, triggeredByUser);
    }

    function prevSlide(triggeredByUser = false) {
        goToSlide(heroSlideIndex - 1, triggeredByUser);
    }

    // Listen for animation end on progress bars
    indicatorsContainer.addEventListener('animationend', (e) => {
        if (e.target.classList.contains('progress-fill') && !isPaused) {
            nextSlide(false);
        }
    });

    // Click on indicators
    indicatorsContainer.addEventListener('click', (e) => {
        const indicator = e.target.closest('.hero-indicator');
        if (indicator) {
            goToSlide(parseInt(indicator.dataset.index), true);
        }
    });

    // Navigation buttons - clone and replace to remove old listeners
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevSlide(true);
    });

    newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextSlide(true);
    });

    // Pause on hover
    const slider = document.getElementById('heroSlider');
    if (slider) {
        slider.addEventListener('mouseenter', () => {
            isPaused = true;
            const activeProgress = indicatorsContainer.querySelector('.hero-indicator.active .progress-fill');
            if (activeProgress) {
                activeProgress.style.animationPlayState = 'paused';
            }
        });
        
        slider.addEventListener('mouseleave', () => {
            isPaused = false;
            const activeProgress = indicatorsContainer.querySelector('.hero-indicator.active .progress-fill');
            if (activeProgress) {
                activeProgress.style.animationPlayState = 'running';
            }
        });
        
        // Touch/Swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        let isSwiping = false;
        
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            isSwiping = true;
            isPaused = true;
            const activeProgress = indicatorsContainer.querySelector('.hero-indicator.active .progress-fill');
            if (activeProgress) {
                activeProgress.style.animationPlayState = 'paused';
            }
        }, { passive: true });
        
        slider.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            touchEndX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            touchEndX = e.changedTouches[0].screenX;
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next slide
                    nextSlide(true);
                } else {
                    // Swipe right - prev slide
                    prevSlide(true);
                }
            }
            
            isSwiping = false;
            isPaused = false;
            const activeProgress = indicatorsContainer.querySelector('.hero-indicator.active .progress-fill');
            if (activeProgress) {
                activeProgress.style.animationPlayState = 'running';
            }
        }, { passive: true });
    }

    // Start first slide
    goToSlide(0, false);
}

async function openTrendingModal(id, type, originalPosterUrl = null) {
    try {
        // Orijinal poster için dil parametresi olmadan çek
        const originalUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}`;
        const originalResponse = await fetch(originalUrl);
        const originalData = await originalResponse.json();

        // Türkçe başlık/açıklama için tr-TR ile çek
        const trUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}?language=tr-TR`;
        const trResponse = await fetch(trUrl);
        const trData = await trResponse.json();

        const title = originalData.title || originalData.name;
        const titleTr = trData.title || trData.name || title;
        const year = (originalData.release_date || originalData.first_air_date || '').substring(0, 4);
        // API'den gelen orijinal poster her zaman TMDB orijinali olacak
        const poster = originalData.poster_path ? `${TMDB_IMAGE_BASE}${originalData.poster_path}` : null;
        const backdrop = originalData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${originalData.backdrop_path}` : null;
        
        // Türkçe açıklama yoksa İngilizce'yi kullan, çeviriyi async yap
        let overview = trData.overview || originalData.overview || 'Açıklama bulunamadı.';
        const needsOverviewTranslation = !trData.overview && originalData.overview;
        
        const rating = originalData.vote_average ? originalData.vote_average.toFixed(1) : null;

        // Get providers
        const providersUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}/watch/providers`;
        const providersResponse = await fetch(providersUrl);
        const providersData = await providersResponse.json();
        const providers = providersData.results?.TR?.flatrate || [];

        // Get cast - use aggregate_credits for TV shows (more comprehensive)
        let cast = [];
        if (type === 'tv') {
            const creditsUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}/aggregate_credits`;
            const creditsResponse = await fetch(creditsUrl);
            const creditsData = await creditsResponse.json();
            // TV aggregate_credits has roles array instead of character
            cast = (creditsData.cast || []).slice(0, 15).map(actor => ({
                ...actor,
                character: actor.roles?.[0]?.character || ''
            }));
        } else {
            const creditsUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}/credits`;
            const creditsResponse = await fetch(creditsUrl);
            const creditsData = await creditsResponse.json();
            cast = (creditsData.cast || []).slice(0, 15);
        }

        // Get trailer video (for TV shows, prefer oldest/original trailer)
        let trailerKey = null;
        const videosUrl = `${BACKEND_URL}/api/tmdb/${type}/${id}/videos`;
        const videosResponse = await fetch(videosUrl);
        const videosData = await videosResponse.json();
        // Find YouTube trailers
        let trailers = (videosData.results || []).filter(v => v.site === 'YouTube' && v.type === 'Trailer');
        
        if (type === 'tv' && trailers.length > 0) {
            // For TV shows, sort by published date (oldest first) to get original trailer
            trailers.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
            // Prefer official among oldest trailers, otherwise just oldest
            const officialTrailer = trailers.find(v => v.official) || trailers[0];
            trailerKey = officialTrailer?.key || null;
        } else {
            // For movies, prefer official, then any trailer
            const officialTrailer = trailers.find(v => v.official) || trailers[0];
            trailerKey = officialTrailer?.key || null;
        }
        
        // If no main trailer and it's a TV show, try season 1
        if (!trailerKey && type === 'tv') {
            const season1VideosUrl = `${BACKEND_URL}/api/tmdb/tv/${id}/season/1/videos`;
            const season1VideosResponse = await fetch(season1VideosUrl);
            const season1VideosData = await season1VideosResponse.json();
            const season1Trailers = (season1VideosData.results || []).filter(v => v.site === 'YouTube' && v.type === 'Trailer');
            const season1Trailer = season1Trailers.find(v => v.official) || season1Trailers[0];
            trailerKey = season1Trailer?.key || null;
        }

        // Store in currentRecommendations temporarily for modal
        const tempMovie = {
            id,
            title,
            titleTr,
            year,
            poster,
            backdrop,
            overview,
            originalOverview: originalData.overview, // Çeviri için orijinal
            needsOverviewTranslation, // Türkçe yoksa çevir
            rating,
            reason: null, // Trending'de reason yok
            tmdbUrl: `https://www.themoviedb.org/${type}/${id}`,
            providers,
            cast, // Oyuncu listesi
            mediaType: type, // Film mi Dizi mi
            trailerKey // YouTube fragman key
        };

        // Open modal with movie object directly (don't modify currentRecommendations)
        openMovieModal(tempMovie);
    } catch (error) {
        console.error('Error opening trending modal:', error);
    }
}

// Helper function for hero slider button
function openTrendingModalFromHero(btn) {
    const slide = btn.closest('.hero-slide');
    const id = slide.dataset.id;
    const type = slide.dataset.type;
    const poster = slide.dataset.poster && slide.dataset.poster !== '' ? slide.dataset.poster : null;
    openTrendingModal(id, type, poster);
}

function setupTrendingTabs() {
    const tabs = document.querySelectorAll('.trend-tab');
    const tabsContainer = document.querySelector('.trending-tabs');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Indicator animasyonu için data-active güncelle
            tabsContainer.dataset.active = tab.dataset.type;
            loadTrendingContent(tab.dataset.type);
        });
    });

    // Carousel buttons
    const track = document.getElementById('trendingTrack');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    if (prevBtn && nextBtn && track) {
        const getScrollAmount = () => {
            const cards = track.querySelectorAll('.trend-card');
            if (cards.length === 0) return 300;
            
            const card = cards[0];
            const cardStyle = window.getComputedStyle(card);
            const cardWidth = card.offsetWidth + parseInt(cardStyle.marginRight || 0);
            const trackWidth = track.clientWidth;
            const visibleCards = Math.floor(trackWidth / cardWidth);
            
            return cardWidth * Math.max(1, visibleCards);
        };

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
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
        // Yaratıcı animasyon efekti
        triggerCategoryEffect(category, card);
    }
}

// ========================================
// Creative Category Effects
// ========================================
function triggerCategoryEffect(category, card) {
    const categoryName = card.querySelector('.category-name');
    const categoryIcon = card.querySelector('.category-icon');
    
    // Yazıyı ve iconu gizle
    categoryName.classList.add('effect-hidden');
    categoryIcon.classList.add('effect-hidden');
    
    // Card'ın pozisyonunu al - scroll pozisyonunu da ekle
    const rect = card.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const centerX = rect.left + rect.width / 2 + scrollX;
    const centerY = rect.top + rect.height / 2 + scrollY;
    
    // Kategoriye özel efekt
    switch(category) {
        case 'aksiyon':
            createExplosionEffect(centerX, centerY);
            break;
        case 'komedi':
            createLaughEffect(centerX, centerY);
            break;
        case 'korku':
            createHorrorEffect(card, centerX, centerY);
            break;
        case 'romantik':
            createHeartEffect(centerX, centerY);
            break;
        case 'bilim-kurgu':
            createSpaceEffect(centerX, centerY);
            break;
        case 'animasyon':
            createColorEffect(centerX, centerY);
            break;
        case 'dram':
            createDramaEffect(centerX, centerY);
            break;
        case 'belgesel':
            createGlobeEffect(centerX, centerY);
            break;
        case 'gerilim':
            createTensionEffect(card, centerX, centerY);
            break;
    }
    
    // Yazıyı ve iconu geri getir
    setTimeout(() => {
        categoryName.classList.remove('effect-hidden');
        categoryIcon.classList.remove('effect-hidden');
    }, 800);
}

// Parçacık oluşturucu yardımcı fonksiyon
function createParticle(className, emoji, x, y) {
    const particle = document.createElement('span');
    particle.className = `effect-particle ${className}`;
    particle.textContent = emoji;
    particle.style.position = 'absolute';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.transform = 'translate(-50%, -50%)';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    document.body.appendChild(particle);
    return particle;
}

// Aksiyon - Patlama parçacıkları
function createExplosionEffect(centerX, centerY) {
    const explosions = ['💥', '🔥', '💣', '⚡', '💢'];
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const particle = createParticle('explosion-particle', explosions[Math.floor(Math.random() * explosions.length)], centerX, centerY);
            particle.style.setProperty('--x', (Math.random() - 0.5) * 150 + 'px');
            particle.style.setProperty('--y', (Math.random() - 0.5) * 150 + 'px');
            particle.style.setProperty('--r', Math.random() * 360 + 'deg');
            setTimeout(() => particle.remove(), 800);
        }, i * 50);
    }
}

// Komedi - Gülen yüzler
function createLaughEffect(centerX, centerY) {
    const laughs = ['😂', '🤣', '😆', '😄', '😁', '🤪'];
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const particle = createParticle('laugh-particle', laughs[Math.floor(Math.random() * laughs.length)], centerX, centerY);
            particle.style.setProperty('--x', (Math.random() - 0.5) * 120 + 'px');
            particle.style.setProperty('--delay', i * 0.1 + 's');
            setTimeout(() => particle.remove(), 1000);
        }, i * 80);
    }
}

// Korku - Karanlık ve hayaletler
function createHorrorEffect(card, centerX, centerY) {
    // Karanlık overlay (bu card'a eklenmeli)
    const darkness = document.createElement('div');
    darkness.className = 'horror-darkness';
    card.appendChild(darkness);
    
    // Hayaletler
    const ghosts = ['👻', '💀', '🦇', '🕷️', '👁️'];
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const ghost = createParticle('ghost-particle', ghosts[i % ghosts.length], centerX, centerY);
                ghost.style.setProperty('--x', (Math.random() - 0.5) * 100 + 'px');
                ghost.style.setProperty('--delay', i * 0.1 + 's');
                setTimeout(() => ghost.remove(), 800);
            }, i * 100);
        }
    }, 200);
    
    setTimeout(() => darkness.remove(), 1000);
}

// Romantik - Kalpler
function createHeartEffect(centerX, centerY) {
    const hearts = ['❤️', '💕', '💖', '💗', '💓', '💘', '💝'];
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const heart = createParticle('heart-particle', hearts[Math.floor(Math.random() * hearts.length)], centerX, centerY);
            heart.style.setProperty('--x', (Math.random() - 0.5) * 100 + 'px');
            heart.style.setProperty('--float-x', (Math.random() - 0.5) * 50 + 'px');
            setTimeout(() => heart.remove(), 1200);
        }, i * 60);
    }
}

// Bilim Kurgu - Yıldızlar ve gezegenler
function createSpaceEffect(centerX, centerY) {
    const space = ['🌟', '⭐', '✨', '🛸', '🌙', '☄️', '🚀', '🪐'];
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const star = createParticle('space-particle', space[i % space.length], centerX, centerY);
            // Her parçacık farklı açıdan çıksın
            const angle = (i / 8) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            star.style.setProperty('--start-x', Math.cos(angle) * 20 + 'px');
            star.style.setProperty('--start-y', Math.sin(angle) * 20 + 'px');
            star.style.setProperty('--end-x', Math.cos(angle) * distance + 'px');
            star.style.setProperty('--end-y', Math.sin(angle) * distance - 80 + 'px');
            setTimeout(() => star.remove(), 1000);
        }, i * 70);
    }
}

// Animasyon - Renkli parçacıklar
function createColorEffect(centerX, centerY) {
    const colors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚪'];
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const color = createParticle('color-particle', colors[i % colors.length], centerX, centerY);
            const angle = (i / 10) * Math.PI * 2;
            color.style.setProperty('--x', Math.cos(angle) * 80 + 'px');
            color.style.setProperty('--y', Math.sin(angle) * 80 + 'px');
            setTimeout(() => color.remove(), 800);
        }, i * 50);
    }
}

// Dram - Gözyaşları ve maskeler
function createDramaEffect(centerX, centerY) {
    const drama = ['🎭', '😢', '😭', '💧', '🥀'];
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const tear = createParticle('drama-particle', drama[Math.floor(Math.random() * drama.length)], centerX, centerY);
            tear.style.setProperty('--x', (Math.random() - 0.5) * 80 + 'px');
            setTimeout(() => tear.remove(), 1200);
        }, i * 100);
    }
}

// Belgesel - Dünya ve doğa
function createGlobeEffect(centerX, centerY) {
    const nature = ['🌍', '🌎', '🌏', '🌿', '🦁', '🐘', '🦅'];
    for (let i = 0; i < 7; i++) {
        setTimeout(() => {
            const item = createParticle('globe-particle', nature[i % nature.length], centerX, centerY);
            const angle = (i / 7) * Math.PI * 2;
            item.style.setProperty('--orbit-x', Math.cos(angle) * 70 + 'px');
            item.style.setProperty('--orbit-y', Math.sin(angle) * 40 + 'px');
            setTimeout(() => item.remove(), 1200);
        }, i * 80);
    }
}

// Gerilim - Titreşim ve tehlike
function createTensionEffect(card, centerX, centerY) {
    const tension = ['⚠️', '❗', '😰', '😱', '🔪'];
    
    // Flash efekti
    card.classList.add('tension-flash');
    setTimeout(() => card.classList.remove('tension-flash'), 600);
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const item = createParticle('tension-particle', tension[i % tension.length], centerX, centerY);
            item.style.setProperty('--x', (Math.random() - 0.5) * 100 + 'px');
            setTimeout(() => item.remove(), 700);
        }, i * 100);
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

    if (userPrompt) {
        prompt += `\n\n⚠️ KULLANICININ İSTEĞİ (bunu diğer tercihlerden öncelikli tut): "${userPrompt}"
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
                const allProviders = trProviders?.flatrate || trProviders?.buy || trProviders?.rent || [];

                // Get cast - use aggregate_credits for TV shows
                let cast = [];
                if (searchType === 'tv') {
                    const creditsUrl = `${BACKEND_URL}/api/tmdb/${searchType}/${result.id}/aggregate_credits`;
                    const creditsResponse = await fetch(creditsUrl);
                    const creditsData = await creditsResponse.json();
                    cast = (creditsData.cast || []).slice(0, 15).map(actor => ({
                        ...actor,
                        character: actor.roles?.[0]?.character || ''
                    }));
                } else {
                    const creditsUrl = `${BACKEND_URL}/api/tmdb/${searchType}/${result.id}/credits`;
                    const creditsResponse = await fetch(creditsUrl);
                    const creditsData = await creditsResponse.json();
                    cast = (creditsData.cast || []).slice(0, 15);
                }

                // Get trailer video (for TV shows, prefer oldest/original trailer)
                let trailerKey = null;
                const videosUrl = `${BACKEND_URL}/api/tmdb/${searchType}/${result.id}/videos`;
                const videosResponse = await fetch(videosUrl);
                const videosData = await videosResponse.json();
                // Find YouTube trailers
                let trailers = (videosData.results || []).filter(v => v.site === 'YouTube' && v.type === 'Trailer');
                
                if (searchType === 'tv' && trailers.length > 0) {
                    // For TV shows, sort by published date (oldest first) to get original trailer
                    trailers.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
                    // Prefer official among oldest trailers, otherwise just oldest
                    const officialTrailer = trailers.find(v => v.official) || trailers[0];
                    trailerKey = officialTrailer?.key || null;
                } else {
                    // For movies, prefer official, then any trailer
                    const officialTrailer = trailers.find(v => v.official) || trailers[0];
                    trailerKey = officialTrailer?.key || null;
                }
                
                // If no main trailer and it's a TV show, try season 1
                if (!trailerKey && searchType === 'tv') {
                    const season1VideosUrl = `${BACKEND_URL}/api/tmdb/tv/${result.id}/season/1/videos`;
                    const season1VideosResponse = await fetch(season1VideosUrl);
                    const season1VideosData = await season1VideosResponse.json();
                    const season1Trailers = (season1VideosData.results || []).filter(v => v.site === 'YouTube' && v.type === 'Trailer');
                    const season1Trailer = season1Trailers.find(v => v.official) || season1Trailers[0];
                    trailerKey = season1Trailer?.key || null;
                }

                enrichedData.push({
                    id: result.id,
                    title: rec.title,
                    titleTr: detailsTrData.title || detailsTrData.name || result.title || result.name,
                    year: rec.year || (result.release_date || result.first_air_date || '').substring(0, 4),
                    poster: originalPoster ? `${TMDB_IMAGE_BASE}${originalPoster}` : null,
                    backdrop: originalBackdrop ? `https://image.tmdb.org/t/p/w1280${originalBackdrop}` : null,
                    overview: detailsTrData.overview || result.overview || 'Açıklama bulunamadı.',
                    originalOverview: result.overview, // Çeviri için orijinal
                    needsOverviewTranslation: !detailsTrData.overview && result.overview, // Türkçe yoksa çevir
                    rating: result.vote_average ? result.vote_average.toFixed(1) : null,
                    reason: rec.reason,
                    tmdbUrl: `https://www.themoviedb.org/${searchType}/${result.id}`,
                    providers: allProviders,
                    cast, // Oyuncu listesi
                    mediaType: searchType,
                    trailerKey // YouTube fragman key
                });
            } else {
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
                    providers: [],
                    mediaType: searchType
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
                providers: [],
                mediaType: searchType
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
function openMovieModal(indexOrMovie) {
    // Accept either an index (for recommendations) or a movie object directly
    const movie = typeof indexOrMovie === 'object' ? indexOrMovie : currentRecommendations[indexOrMovie];
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
    const modalTmdbLink = document.getElementById('modalTmdbLink');
    const modalWatchBtn = document.getElementById('modalWatchBtn');
    const modalContentType = document.getElementById('modalContentType');

    // Set content type (Film / Dizi)
    if (modalContentType) {
        const contentTypeText = movie.mediaType === 'tv' ? 'Dizi' : 'Film';
        modalContentType.textContent = contentTypeText;
    }

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

    // Açıklama çevirisi gerekiyorsa async olarak yap
    if (movie.needsOverviewTranslation && movie.originalOverview) {
        modalDescription.classList.add('bio-translating');
        
        fetch(`${BACKEND_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: movie.originalOverview, type: 'overview' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.translation) {
                modalDescription.textContent = data.translation;
                // Çevrilen veriyi kaydet, tekrar çevirmesin
                movie.overview = data.translation;
                movie.needsOverviewTranslation = false;
            }
        })
        .catch(err => console.error('Overview translation error:', err))
        .finally(() => {
            modalDescription.classList.remove('bio-translating');
        });
    }

    // Set reason
    if (movie.reason) {
        modalReason.textContent = movie.reason;
        modalReasonBox.style.display = 'block';
    } else {
        modalReasonBox.style.display = 'none';
    }

    // Set cast
    const modalCastSection = document.getElementById('modalCastSection');
    const modalCastList = document.getElementById('modalCastList');
    
    if (movie.cast && movie.cast.length > 0) {
        modalCastList.innerHTML = movie.cast.map(actor => `
            <div class="cast-item" onclick="openActorModal(${actor.id})" style="cursor: pointer;">
                <div class="cast-photo" style="background-image: url('${actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : ''}')">
                    ${!actor.profile_path ? '<span class="no-photo">👤</span>' : ''}
                </div>
                <div class="cast-info">
                    <span class="cast-name">${actor.name}</span>
                    <span class="cast-character">${actor.character || ''}</span>
                </div>
            </div>
        `).join('');
        modalCastSection.style.display = 'block';
    } else {
        modalCastSection.style.display = 'none';
    }

    // Set Watch button (Google search)
    const searchTitle = movie.titleTr || movie.title;
    modalWatchBtn.href = `https://www.google.com/search?q=${encodeURIComponent(searchTitle)}`;

    // Set TMDB link
    modalTmdbLink.href = movie.tmdbUrl;

    // Set Trailer button
    const modalTrailerBtn = document.getElementById('modalTrailerBtn');
    if (movie.trailerKey) {
        modalTrailerBtn.style.display = 'inline-flex';
        modalTrailerBtn.onclick = () => openTrailerModal(movie.trailerKey);
    } else {
        modalTrailerBtn.style.display = 'none';
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Update cast arrow states after a short delay (for DOM to render)
    setTimeout(updateCastArrows, 100);
}

function closeMovieModal() {
    const modal = document.getElementById('movieModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset cast list scroll position
    const castList = document.getElementById('modalCastList');
    if (castList) {
        castList.scrollLeft = 0;
    }
}

// Trailer Modal Functions
let ytPlayer = null;
let playerUpdateInterval = null;

function onYouTubeIframeAPIReady() {
    // YouTube API hazır - player ilk video açıldığında oluşturulacak
}

function openTrailerModal(youtubeKey) {
    const trailerModal = document.getElementById('trailerModal');
    trailerModal.classList.add('active');
    
    // Player varsa yok et ve yeniden oluştur
    if (ytPlayer) {
        ytPlayer.destroy();
        ytPlayer = null;
    }
    
    ytPlayer = new YT.Player('youtubePlayer', {
        videoId: youtubeKey,
        playerVars: {
            autoplay: 1,
            controls: 0, // Kendi kontrollerimizi kullan
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0, // Kendi fullscreen butonumuzu kullanacağız
            cc_load_policy: 0,
            iv_load_policy: 3, // Annotations gizle
            playsinline: 1,
            disablekb: 1 // Klavye kontrollerini devre dışı bırak
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
    setupCustomControls();
    startProgressUpdate();
}

function onPlayerStateChange(event) {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (event.data === YT.PlayerState.PLAYING) {
        playPauseBtn.classList.add('playing');
    } else {
        playPauseBtn.classList.remove('playing');
    }
}



function setupCustomControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressContainer = document.getElementById('progressContainer');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    // Play/Pause
    playPauseBtn.onclick = () => {
        if (ytPlayer) {
            const state = ytPlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                ytPlayer.pauseVideo();
            } else {
                ytPlayer.playVideo();
            }
        }
    };
    
    // Progress bar - drag support
    let isDragging = false;
    let wasPlayingBeforeDrag = false;
    
    const seekToPosition = (e) => {
        if (ytPlayer && ytPlayer.getDuration) {
            const rect = progressContainer.getBoundingClientRect();
            let percent = (e.clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent)); // Clamp 0-1
            const duration = ytPlayer.getDuration();
            
            // Visual feedback immediately
            document.getElementById('progressPlayed').style.width = (percent * 100) + '%';
            document.getElementById('progressHandle').style.left = (percent * 100) + '%';
            document.getElementById('timeDisplay').textContent = 
                formatTime(duration * percent) + ' / ' + formatTime(duration);
            
            return { percent, duration };
        }
        return null;
    };
    
    progressContainer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        progressContainer.classList.add('dragging');
        // Video oynatılıyorsa hatırla
        wasPlayingBeforeDrag = ytPlayer && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
        seekToPosition(e);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            seekToPosition(e);
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            progressContainer.classList.remove('dragging');
            const result = seekToPosition(e);
            if (result && ytPlayer) {
                ytPlayer.seekTo(result.duration * result.percent, true);
                // Eğer sürüklemeden önce oynatılıyorsa devam et
                if (wasPlayingBeforeDrag) {
                    ytPlayer.playVideo();
                }
            }
        }
    });
    
    // Click to seek (for non-drag clicks)
    progressContainer.addEventListener('click', (e) => {
        if (!isDragging && ytPlayer) {
            const rect = progressContainer.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const duration = ytPlayer.getDuration();
            ytPlayer.seekTo(duration * percent, true);
        }
    });
    
    // Volume
    volumeBtn.onclick = () => {
        if (ytPlayer) {
            if (ytPlayer.isMuted()) {
                ytPlayer.unMute();
                volumeBtn.classList.remove('muted');
                volumeSlider.value = ytPlayer.getVolume();
                updateVolumeSliderBackground(volumeSlider);
            } else {
                ytPlayer.mute();
                volumeBtn.classList.add('muted');
            }
        }
    };
    
    volumeSlider.oninput = () => {
        if (ytPlayer) {
            ytPlayer.setVolume(volumeSlider.value);
            updateVolumeSliderBackground(volumeSlider);
            if (volumeSlider.value == 0) {
                volumeBtn.classList.add('muted');
            } else {
                volumeBtn.classList.remove('muted');
                ytPlayer.unMute();
            }
        }
    };
    
    // Fullscreen
    fullscreenBtn.onclick = () => {
        const wrapper = document.querySelector('.trailer-video-wrapper');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            wrapper.requestFullscreen();
        }
    };
    
    // Click on video to play/pause
    const playerElement = document.getElementById('youtubePlayer');
    playerElement.addEventListener('click', () => {
        if (ytPlayer) {
            const state = ytPlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                ytPlayer.pauseVideo();
            } else {
                ytPlayer.playVideo();
            }
        }
    });
    
    // Initialize volume slider background
    updateVolumeSliderBackground(volumeSlider);
}

function updateVolumeSliderBackground(slider) {
    const value = slider.value;
    const percent = value + '%';
    slider.style.background = `linear-gradient(to right, #6366f1 0%, #8b5cf6 ${percent}, rgba(255,255,255,0.3) ${percent})`;
}

function startProgressUpdate() {
    if (playerUpdateInterval) {
        clearInterval(playerUpdateInterval);
    }
    
    playerUpdateInterval = setInterval(() => {
        if (ytPlayer && ytPlayer.getCurrentTime) {
            const currentTime = ytPlayer.getCurrentTime();
            const duration = ytPlayer.getDuration();
            const buffered = ytPlayer.getVideoLoadedFraction();
            
            if (duration > 0) {
                const percent = (currentTime / duration) * 100;
                document.getElementById('progressPlayed').style.width = percent + '%';
                document.getElementById('progressHandle').style.left = percent + '%';
                document.getElementById('progressBuffered').style.width = (buffered * 100) + '%';
                document.getElementById('timeDisplay').textContent = 
                    formatTime(currentTime) + ' / ' + formatTime(duration);
            }
        }
    }, 100);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function closeTrailerModal() {
    const trailerModal = document.getElementById('trailerModal');
    trailerModal.classList.remove('active');
    
    if (playerUpdateInterval) {
        clearInterval(playerUpdateInterval);
        playerUpdateInterval = null;
    }
    
    if (ytPlayer) {
        ytPlayer.stopVideo();
    }
    
    // Reset controls
    document.getElementById('progressPlayed').style.width = '0%';
    document.getElementById('progressHandle').style.left = '0%';
    document.getElementById('progressBuffered').style.width = '0%';
    document.getElementById('timeDisplay').textContent = '0:00 / 0:00';
    document.getElementById('playPauseBtn').classList.remove('playing');
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

    // Escape key to close (handles both modals)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const trailerModal = document.getElementById('trailerModal');
            if (trailerModal.classList.contains('active')) {
                closeTrailerModal();
            } else if (modal.classList.contains('active')) {
                closeMovieModal();
            }
        }
    });

    // Trailer modal listeners
    const trailerModal = document.getElementById('trailerModal');
    const trailerCloseBtn = document.getElementById('trailerModalClose');
    
    trailerCloseBtn.addEventListener('click', closeTrailerModal);
    
    trailerModal.addEventListener('click', (e) => {
        if (e.target === trailerModal) {
            closeTrailerModal();
        }
    });

    // Cast arrow buttons
    const castArrowLeft = document.getElementById('castArrowLeft');
    const castArrowRight = document.getElementById('castArrowRight');
    const castList = document.getElementById('modalCastList');

    castArrowLeft.addEventListener('click', () => {
        const scrollAmount = castList.clientWidth; // Görünür alan kadar kaydır
        castList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    castArrowRight.addEventListener('click', () => {
        const scrollAmount = castList.clientWidth; // Görünür alan kadar kaydır
        castList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // Update arrow states on scroll
    castList.addEventListener('scroll', updateCastArrows);

    // Actor modal close button
    const actorModal = document.getElementById('actorModal');
    const actorCloseBtn = document.getElementById('actorModalClose');
    
    actorCloseBtn.addEventListener('click', closeActorModal);
    
    actorModal.addEventListener('click', (e) => {
        if (e.target === actorModal) {
            closeActorModal();
        }
    });

    // Known for arrow buttons
    const knownForArrowLeft = document.getElementById('knownForArrowLeft');
    const knownForArrowRight = document.getElementById('knownForArrowRight');
    const knownForList = document.getElementById('actorKnownFor');

    knownForArrowLeft.addEventListener('click', () => {
        const scrollAmount = knownForList.clientWidth;
        knownForList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    knownForArrowRight.addEventListener('click', () => {
        const scrollAmount = knownForList.clientWidth;
        knownForList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    knownForList.addEventListener('scroll', updateKnownForArrows);
}

function updateCastArrows() {
    const castList = document.getElementById('modalCastList');
    const castArrowLeft = document.getElementById('castArrowLeft');
    const castArrowRight = document.getElementById('castArrowRight');
    
    if (!castList || !castArrowLeft || !castArrowRight) return;
    
    const isAtStart = castList.scrollLeft <= 0;
    const isAtEnd = castList.scrollLeft >= castList.scrollWidth - castList.clientWidth - 5;
    
    castArrowLeft.disabled = isAtStart;
    castArrowRight.disabled = isAtEnd;
}

function updateKnownForArrows() {
    const knownForList = document.getElementById('actorKnownFor');
    const knownForArrowLeft = document.getElementById('knownForArrowLeft');
    const knownForArrowRight = document.getElementById('knownForArrowRight');
    
    if (!knownForList || !knownForArrowLeft || !knownForArrowRight) return;
    
    const isAtStart = knownForList.scrollLeft <= 0;
    const isAtEnd = knownForList.scrollLeft >= knownForList.scrollWidth - knownForList.clientWidth - 5;
    
    knownForArrowLeft.disabled = isAtStart;
    knownForArrowRight.disabled = isAtEnd;
}

// ========================================
// Actor Modal Functions
// ========================================
async function openActorModal(actorId) {
    try {
        const actorModal = document.getElementById('actorModal');
        
        // Fetch actor details - Turkish first, then English for biography fallback
        const detailsUrlTr = `${BACKEND_URL}/api/tmdb/person/${actorId}?language=tr-TR`;
        const detailsUrlEn = `${BACKEND_URL}/api/tmdb/person/${actorId}?language=en-US`;
        const [detailsResponseTr, detailsResponseEn] = await Promise.all([
            fetch(detailsUrlTr),
            fetch(detailsUrlEn)
        ]);
        const actorDataTr = await detailsResponseTr.json();
        const actorDataEn = await detailsResponseEn.json();
        
        // Use Turkish data but keep English biography as fallback
        const actorData = actorDataTr;
        const englishBiography = actorDataEn.biography || '';

        // Fetch "known_for" from search/person endpoint (this is what TMDB shows)
        const actorName = actorDataEn.name || actorDataTr.name;
        const searchUrl = `${BACKEND_URL}/api/tmdb/search/person?query=${encodeURIComponent(actorName)}&language=tr-TR`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        // Find the matching actor by ID
        const searchedActor = searchData.results?.find(p => p.id === parseInt(actorId));
        const knownForFromSearch = searchedActor?.known_for || [];

        // Fetch actor credits - one for original posters, one for Turkish titles
        const creditsUrlOriginal = `${BACKEND_URL}/api/tmdb/person/${actorId}/combined_credits`;
        const creditsUrlTr = `${BACKEND_URL}/api/tmdb/person/${actorId}/combined_credits?language=tr-TR`;
        const [creditsResponseOriginal, creditsResponseTr] = await Promise.all([
            fetch(creditsUrlOriginal),
            fetch(creditsUrlTr)
        ]);
        const creditsDataOriginal = await creditsResponseOriginal.json();
        const creditsDataTr = await creditsResponseTr.json();
        
        // Create a map for Turkish titles
        const trTitleMap = new Map();
        creditsDataTr.cast?.forEach(c => {
            trTitleMap.set(c.id, c.title || c.name);
        });
        
        // Use original credits data but merge Turkish titles
        const creditsData = {
            cast: creditsDataOriginal.cast?.map(c => ({
                ...c,
                titleTr: trTitleMap.get(c.id) || c.title || c.name
            }))
        };

        // Set actor photo
        const actorPhoto = document.getElementById('actorPhoto');
        if (actorData.profile_path) {
            actorPhoto.style.backgroundImage = `url('https://image.tmdb.org/t/p/w500${actorData.profile_path}')`;
            actorPhoto.innerHTML = '';
        } else {
            actorPhoto.style.backgroundImage = 'none';
            actorPhoto.innerHTML = '<span class="no-photo">👤</span>';
        }

        // Set backdrop on modal-body (covers entire scrollable content)
        const actorModalBody = document.querySelector('.actor-modal-body');
        if (actorData.profile_path) {
            actorModalBody.style.setProperty('--actor-bg-image', `url('https://image.tmdb.org/t/p/w780${actorData.profile_path}')`);
        } else {
            actorModalBody.style.setProperty('--actor-bg-image', 'none');
        }

        // Set actor name
        document.getElementById('actorName').textContent = actorData.name || 'Bilinmeyen';

        // Set birthday
        const actorBirthday = document.getElementById('actorBirthday');
        if (actorData.birthday) {
            const age = calculateAge(actorData.birthday, actorData.deathday);
            const deathInfo = actorData.deathday ? ` - ✝️ ${formatDate(actorData.deathday)}` : '';
            actorBirthday.innerHTML = `🎂 ${formatDate(actorData.birthday)} (${age} yaş)${deathInfo}`;
        } else {
            actorBirthday.textContent = '';
        }

        // Set birthplace
        const actorBirthplace = document.getElementById('actorBirthplace');
        if (actorData.place_of_birth) {
            actorBirthplace.innerHTML = `📍 ${actorData.place_of_birth}`;
        } else {
            actorBirthplace.textContent = '';
        }

        // Set biography - translate from English if Turkish not available
        const actorBiography = document.getElementById('actorBiography');
        if (actorData.biography) {
            actorBiography.textContent = actorData.biography;
        } else if (englishBiography) {
            // Show English text with shimmer effect while translating
            actorBiography.textContent = englishBiography;
            actorBiography.classList.add('bio-translating');
            // Translate from English (don't await - let it run in background)
            fetch(`${BACKEND_URL}/api/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: englishBiography, targetLang: 'tr' })
            })
            .then(response => response.json())
            .then(translateData => {
                if (translateData.translation) {
                    actorBiography.textContent = translateData.translation;
                } else {
                    actorBiography.textContent = englishBiography; // Fallback to English
                }
            })
            .catch(e => {
                console.error('Translation error:', e);
                actorBiography.textContent = englishBiography; // Fallback to English
            })
            .finally(() => {
                actorBiography.classList.remove('bio-translating');
            });
        } else {
            actorBiography.textContent = 'Biyografi bilgisi bulunamadı.';
        }

        // Set known for - use TMDB's known_for data from search endpoint + top credits
        const knownForList = document.getElementById('actorKnownFor');
        
        // Create a map for original posters from credits
        const originalPosterMap = new Map();
        creditsDataOriginal.cast?.forEach(c => {
            originalPosterMap.set(c.id, c.poster_path);
        });
        
        // Start with TMDB's official known_for list
        let topCredits = [];
        const knownForIds = new Set();
        
        if (knownForFromSearch.length > 0) {
            // Use TMDB's official known_for list first
            knownForFromSearch
                .filter(item => item.poster_path || originalPosterMap.get(item.id))
                .forEach(item => {
                    knownForIds.add(item.id);
                    topCredits.push({
                        id: item.id,
                        media_type: item.media_type,
                        poster_path: originalPosterMap.get(item.id) || item.poster_path,
                        titleTr: item.title || item.name
                    });
                });
        }
        
        // Add more from combined_credits (exclude already added ones)
        const additionalCredits = creditsData.cast
            ?.filter(c => c.poster_path && c.character && c.character.trim() !== '')
            ?.filter(c => !knownForIds.has(c.id))
            ?.filter(c => c.order !== undefined ? c.order < 10 : true)
            ?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
            ?.slice(0, 15 - topCredits.length)
            ?.map(c => ({
                id: c.id,
                media_type: c.media_type,
                poster_path: c.poster_path,
                titleTr: c.titleTr
            })) || [];
        
        topCredits = [...topCredits, ...additionalCredits];

        knownForList.innerHTML = topCredits.map(credit => `
            <div class="known-for-item" onclick="openKnownForModal(${credit.id}, '${credit.media_type}')">
                <div class="known-for-poster" style="background-image: url('https://image.tmdb.org/t/p/w185${credit.poster_path}')"></div>
                <div class="known-for-title-text">${credit.titleTr}</div>
            </div>
        `).join('');

        // Set TMDB link
        document.getElementById('actorTmdbLink').href = `https://www.themoviedb.org/person/${actorId}`;

        // Show modal
        actorModal.classList.add('active');
        
        // Update arrows after render
        setTimeout(updateKnownForArrows, 100);

    } catch (error) {
        console.error('Error opening actor modal:', error);
    }
}

function closeActorModal() {
    const actorModal = document.getElementById('actorModal');
    actorModal.classList.remove('active');
    
    // Reset known-for list scroll position
    const knownForList = document.getElementById('actorKnownFor');
    if (knownForList) {
        knownForList.scrollLeft = 0;
    }
}

// Helper function to open movie/tv from known for
async function openKnownForModal(id, mediaType) {
    closeActorModal();
    await openTrendingModal(id, mediaType);
}

// Helper function to calculate age
function calculateAge(birthday, deathday = null) {
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Helper function to format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ========================================
// Start Application
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupModalListeners();
    disableTapHighlight();
});

// Disable tap highlight on mobile
function disableTapHighlight() {
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    // Force remove tap highlight from all interactive elements
    const style = document.createElement('style');
    style.textContent = `
        * {
            -webkit-tap-highlight-color: transparent !important;
            -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
            tap-highlight-color: transparent !important;
        }
        *:focus {
            outline: none !important;
        }
    `;
    document.head.appendChild(style);
}
