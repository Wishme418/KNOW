// ==================== GLOBAL STATE ====================
let currentUser = null;
let allPosts = [];
let filteredPosts = [];
let selectedCategories = [];
let currentView = 'grid';

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadPosts();
});

function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserDisplay();
    }
    
    const saved = localStorage.getItem('trainingPosts');
    if (saved) {
        allPosts = JSON.parse(saved);
    } else {
        allPosts = getDemoData();
        localStorage.setItem('trainingPosts', JSON.stringify(allPosts));
    }
}

function getDemoData() {
    return [
        {
            id: 1,
            title: "Advanced JavaScript Concepts",
            description: "Learn closures, promises, async/await, and more with detailed explanations and examples.",
            link: "https://javascript.info",
            tags: ["JavaScript", "Web Development", "Advanced"],
            date: "2024-03-01",
            author: "Admin"
        },
        {
            id: 2,
            title: "React Best Practices 2024",
            description: "Comprehensive guide on React hooks, state management, and performance optimization.",
            link: "https://react.dev",
            tags: ["React", "Frontend", "Best Practices"],
            date: "2024-02-28",
            author: "Admin"
        },
        {
            id: 3,
            title: "Python Data Science",
            description: "Master pandas, numpy, matplotlib, and scikit-learn for data analysis and visualization.",
            link: "https://www.datacamp.com",
            tags: ["Python", "Data Science", "Tutorial"],
            date: "2024-02-25",
            author: "Admin"
        }
    ];
}

function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', filterPosts);
    
    // View Toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.dataset.view;
            renderPosts();
        });
    });
    
    // Modal
    const modal = document.getElementById('authModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Auth Forms
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    
    // Admin & Logout
    document.getElementById('adminBtn')?.addEventListener('click', goToAdmin);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`)?.classList.add('active');
        });
    });
}

// ==================== POSTS MANAGEMENT ====================
async function loadPosts() {
    // Simulate API call
    try {
        // In production, fetch from Vercel API:
        // const response = await fetch('/api/posts');
        // allPosts = await response.json();
        
        renderCategories();
        filterPosts();
    } catch (error) {
        showToast('Error loading posts: ' + error.message, 'error');
    }
}

function filterPosts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredPosts = allPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm) || 
                             post.description.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategories.length === 0 || 
                               post.tags.some(tag => selectedCategories.includes(tag));
        
        return matchesSearch && matchesCategory;
    });
    
    renderPosts();
    updateStats();
}

function renderPosts() {
    const postsGrid = document.getElementById('postsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredPosts.length === 0) {
        postsGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    postsGrid.className = `posts-grid ${currentView === 'list' ? 'list-view' : ''}`;
    
    postsGrid.innerHTML = filteredPosts.map((post, index) => `
        <div class="post-card" style="animation-delay: ${index * 0.05}s">
            <div class="post-header">
                <div>
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                </div>
                <span class="post-date">${formatDate(post.date)}</span>
            </div>
            
            <p class="post-description">${escapeHtml(post.description)}</p>
            
            <div class="post-tags">
                ${post.tags.map(tag => `
                    <span class="post-tag" onclick="selectCategory('${tag}')">${escapeHtml(tag)}</span>
                `).join('')}
            </div>
            
            <div class="post-footer">
                <a href="${post.link}" target="_blank" class="post-link" rel="noopener">
                    → Visit Resource
                </a>
                <span style="color: var(--text-secondary); font-size: 0.85rem;">
                    ${post.author || 'Admin'}
                </span>
            </div>
        </div>
    `).join('');
}

function renderCategories() {
    const allTags = new Set();
    allPosts.forEach(post => {
        post.tags.forEach(tag => allTags.add(tag));
    });
    
    const filterContainer = document.getElementById('categoryFilters');
    filterContainer.innerHTML = Array.from(allTags).map(tag => `
        <button class="filter-tag" onclick="selectCategory('${tag}')">${tag}</button>
    `).join('');
    
    updateFilterButtons();
}

function selectCategory(category) {
    const index = selectedCategories.indexOf(category);
    if (index > -1) {
        selectedCategories.splice(index, 1);
    } else {
        selectedCategories.push(category);
    }
    
    updateFilterButtons();
    filterPosts();
}

function updateFilterButtons() {
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.classList.toggle('active', selectedCategories.includes(btn.textContent));
    });
}

function updateStats() {
    const count = filteredPosts.length;
    document.getElementById('postCount').textContent = `${count} Resource${count !== 1 ? 's' : ''}`;
    
    const filterDisplay = document.getElementById('activeFilter');
    if (selectedCategories.length > 0) {
        filterDisplay.textContent = `Filtering by: ${selectedCategories.join(', ')}`;
    } else {
        filterDisplay.textContent = '';
    }
}

// ==================== AUTHENTICATION ====================
function handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    
    // Simple auth simulation
    if (email && password.length >= 6) {
        const user = {
            email: email,
            name: email.split('@')[0],
            isAdmin: email === 'admin@traininghub.com'
        };
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUserDisplay();
        
        document.getElementById('authModal').classList.remove('active');
        showToast('Login successful!', 'success');
        e.target.reset();
    } else {
        showToast('Invalid email or password', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    
    if (username && email && password.length >= 6) {
        const user = {
            email: email,
            name: username,
            isAdmin: false
        };
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUserDisplay();
        
        document.getElementById('authModal').classList.remove('active');
        showToast('Registration successful!', 'success');
        e.target.reset();
    } else {
        showToast('Please fill all fields correctly', 'error');
    }
}

function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    const adminBtn = document.getElementById('adminBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUser) {
        userDisplay.textContent = currentUser.name;
        logoutBtn.style.display = 'block';
        
        if (currentUser.isAdmin) {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('userDisplay').textContent = 'Guest';
    document.getElementById('adminBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    showToast('Logged out successfully', 'success');
}

function goToAdmin() {
    if (currentUser?.isAdmin) {
        window.location.href = 'admin.html';
    } else {
        showToast('Admin access required!', 'error');
    }
}

// ==================== UTILITIES ====================
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
