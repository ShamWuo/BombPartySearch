
function debounce(func, delay) {
    let debounceTimer;
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}


function toggleSidebar(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    const otherSidebarId = sidebarId === 'historySidebar' ? 'favoritesSidebar' : 'historySidebar';
    const otherSidebar = document.getElementById(otherSidebarId);
    
    sidebar.classList.toggle('active');
    otherSidebar.classList.remove('active');
}


function addHistory(query) {
    if (!query.trim()) return;
    
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history = history.filter(item => item !== query);
    history.unshift(query);
    history = history.slice(0, 20);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    historyList.innerHTML = history.length ? '' : '<li class="empty-message">No search history</li>';
    
    history.forEach(query => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="query-text">${query}</span>
            <button class="use-query" title="Use this query">
                <i class="fas fa-search"></i>
            </button>
        `;
        
        li.querySelector('.use-query').addEventListener('click', () => {
            document.getElementById('searchInput').value = query;
            findWords();
            toggleSidebar('historySidebar');
        });
        
        historyList.appendChild(li);
    });
}

function toggleFavorite(word) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFavorite = favorites.includes(word);
    
    if (isFavorite) {
        favorites = favorites.filter(w => w !== word);
        showToast(`Removed '${word}' from favorites`);
    } else {
        favorites.push(word);
        showToast(`Added '${word}' to favorites`);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    updateModalFavoriteButton(word);
}

function renderFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    favoritesList.innerHTML = favorites.length ? '' : '<li class="empty-message">No favorites yet</li>';
    
    favorites.forEach(word => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="word-text">${word}</span>
            <div class="actions">
                <button class="copy-word" title="Copy word">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="remove-favorite" title="Remove from favorites">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        li.querySelector('.copy-word').addEventListener('click', () => {
            copyToClipboard(word);
        });
        
        li.querySelector('.remove-favorite').addEventListener('click', () => {
            toggleFavorite(word);
        });
        
        favoritesList.appendChild(li);
    });
}

function openWordModal(word) {
    const modal = document.getElementById('wordModal');
    const modalTitle = document.getElementById('modalWordTitle');
    const modalDetails = document.getElementById('modalWordDetails');
    
    modalTitle.textContent = word;
    modalDetails.innerHTML = `
        <div class="word-info">
            <p class="word-length">
                <i class="fas fa-text-width"></i> Length: ${word.length} characters
            </p>
            <p class="word-letters">
                <i class="fas fa-font"></i> Letters: ${Array.from(word).join(', ')}
            </p>
        </div>
    `;
    
    updateModalFavoriteButton(word);
    modal.classList.add('show');
}

function updateModalFavoriteButton(word) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFavorite = favorites.includes(word);
    const favoriteBtn = document.getElementById('modalFavoriteBtn');
    
    favoriteBtn.innerHTML = `
        <i class="fas ${isFavorite ? 'fa-star' : 'fa-star'}"></i>
        <span>${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
    `;
    favoriteBtn.onclick = () => toggleFavorite(word);
}

function closeModal() {
    const modal = document.getElementById('wordModal');
    modal.classList.remove('show');
}


async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(`Copied "${text}" to clipboard`);
    } catch (err) {
        showToast('Failed to copy to clipboard', 'error');
    }
}


async function findWords() {
    console.log('findWords called'); 
    const input = document.getElementById('searchInput');
    console.log('Input element:', input); 
    
    if (!input) {
        console.error('Search input element not found');
        return;
    }
    
    const searchTerm = input.value.toLowerCase().trim();
    console.log('Search term:', searchTerm); 
    
    const resultList = document.getElementById('resultList');
    const filter = parseInt(document.getElementById('lengthFilter').value);
    const condition = document.getElementById('lengthCondition').value;
    const loading = document.getElementById('loading');
    
    resultList.innerHTML = '';
    
    if (!searchTerm) {
        showToast('Please enter some letters to search', 'error');
        return;
    }
    
    loading.classList.remove('hidden');
    addHistory(searchTerm);
    
    try {
        console.log('Fetching words for:', searchTerm); // Debug 
        const response = await fetch(`https://api.datamuse.com/words?sp=*${searchTerm}*`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        console.log('API response:', data); 
        
        let words = data.map(item => item.word);
        
        
        if (filter > 0) {
            words = words.filter(word => {
                if (condition === 'only') return word.length === filter;
                if (condition === 'higher') return word.length >= filter;
                if (condition === 'lower') return word.length <= filter;
                return true;
            });
        }
        
       
        words.sort((a, b) => a.length - b.length);
        
        if (words.length === 0) {
            resultList.innerHTML = '<li class="no-results">No words found</li>';
            return;
        }
        
        console.log('Filtered words:', words); // Debug 
        
        words.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            li.addEventListener('click', () => openWordModal(word));
            resultList.appendChild(li);
        });
        
        window.wordsList = words;
        
    } catch (error) {
        console.error('Search error:', error); 
        showToast('Error fetching words. Please try again.', 'error');
        resultList.innerHTML = '<li class="error">Error fetching words</li>';
    } finally {
        loading.classList.add('hidden');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); 
    
    
    document.getElementById('nav-history').addEventListener('click', (e) => {
        e.preventDefault();
        toggleSidebar('historySidebar');
    });

    document.getElementById('nav-favorites').addEventListener('click', (e) => {
        e.preventDefault();
        toggleSidebar('favoritesSidebar');
    });

    
    document.querySelectorAll('.close-sidebar').forEach(btn => {
        btn.addEventListener('click', () => {
            const sidebar = btn.closest('.sidebar');
            sidebar.classList.remove('active');
        });
    });

    
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        localStorage.removeItem('searchHistory');
        renderHistory();
        showToast('Search history cleared');
    });

    document.getElementById('clearFavoritesBtn').addEventListener('click', () => {
        localStorage.removeItem('favorites');
        renderFavorites();
        showToast('Favorites cleared');
    });

    
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('wordModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('modalCopyBtn').addEventListener('click', () => {
        const word = document.getElementById('modalWordTitle').textContent;
        copyToClipboard(word);
    });

    
    const searchInput = document.getElementById('searchInput');
    console.log('Search input element:', searchInput); 
    
    if (searchInput) {
        const debouncedFindWords = debounce(findWords, 500);
        searchInput.addEventListener('input', debouncedFindWords);
    } else {
        console.error('Search input element not found during initialization');
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            console.log('Search button clicked'); 
            findWords();
        });
    } else {
        console.error('Search button not found during initialization');
    }

    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            findWords();
        } else if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            if (window.wordsList && window.wordsList[index]) {
                openWordModal(window.wordsList[index]);
            }
        } else if (e.key === 'Escape') {
            closeModal();
            document.querySelectorAll('.sidebar').forEach(sidebar => {
                sidebar.classList.remove('active');
            });
        }
    });

    
    renderHistory();
    renderFavorites();
});
