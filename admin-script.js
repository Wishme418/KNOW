// ==================== ADMIN STATE ====================
let currentAdminUser = null;
let adminPosts = [];
const suggestedCategories = ['JavaScript', 'React', 'Python', 'Data Science', 'Web Development', 'Tutorial', 'Documentation', 'Video', 'Course', 'Best Practices', 'Advanced', 'Beginner'];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminPosts();
    setupAdminListeners();
});

function checkAdminAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentAdminUser = JSON.parse(user);
    if (!currentAdminUser.isAdmin) {
        showToast('Access denied! Admin only.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    document.getElementById('adminDisplay').textContent = currentAdminUser.name;
}

function setupAdminListeners() {
    // Form submission
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
    
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Logout
    document.getElementById('logoutAdminBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Real-time character counters
    document.getElementById('postTitle').addEventListener('input', (e) => {
        document.getElementById('titleCount').textContent = `${e.target.value.length}/100`;
    });
    
    document.getElementById('postDescription').addEventListener('input', (e) => {
        document.getElementById('descCount').textContent = `${e.target.value.length}/1000`;
    });
    
    // Tag management
    document.querySelector('.btn-add-tag').addEventListener('click', addTag);
    document.getElementById('tagInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    });
    
    // Real-time preview
    document.getElementById('postTitle').addEventListener('input', updatePreview);
    document.getElementById('postDescription').addEventListener('input', updatePreview);
    document.getElementById('postLink').addEventListener('input', updatePreview);
    
    // Render suggested tags
    renderSuggestedTags();
}

// ==================== POST MANAGEMENT ====================
let formTags = [];

function addTag() {
    const input = document.getElementById('tagInput');
    const tag = input.value.trim();
    
    if (!tag) {
        showToast('Please enter a tag', 'error');
        return;
    }
    
    if (formTags.includes(tag)) {
        showToast('Tag already added!', 'error');
        return;
    }
    
    if (formTags.length >= 10) {
        showToast('Maximum 10 tags allowed', 'error');
        return;
    }
    
    formTags.push(tag);
    input.value = '';
    renderTags();
    updatePreview();
}

function renderTags() {
    const container = document.getElementById('tagsDisplay');
    container.innerHTML = formTags.map(tag => `
        <div class="tag-item">
            ${escapeHtml(tag)}
            <span class="remove-tag" onclick="removeTag('${tag}')">×</span>
        </div>
    `).join('');
}

function removeTag(tag) {
    formTags = formTags.filter(t => t !== tag);
    renderTags();
    updatePreview();
}

function renderSuggestedTags() {
    const container = document.getElementById('suggestedTags');
    container.innerHTML = `<strong style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">Suggested Tags:</strong>` + 
        suggestedCategories.map(tag => `
            <span class="suggested-tag" onclick="suggestTag('${tag}')">${tag}</span>
        `).join('');
}

function suggestTag(tag) {
    if (!formTags.includes(tag) && formTags.length < 10) {
        formTags.push(tag);
        renderTags();
        updatePreview();
    }
}

function updatePreview() {
    const title = document.getElementById('postTitle').value;
    const desc = document.getElementById('postDescription').value;
    const link = document.getElementById('postLink').value;
    
    const preview = document.getElementById('previewCard');
    
    if (!title && !desc && !link) {
        preview.innerHTML = '<div class="preview-placeholder">Preview will appear here...</div>';
        return;
    }
    
    preview.innerHTML = `
        <div style="padding: 1rem; background: var(--card-bg); border-radius: 8px;">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">${escapeHtml(title || 'Untitled')}</h4>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.8rem; line-height: 1.4;">
                ${escapeHtml(desc?.substring(0, 150) + (desc?.length > 150 ? '...' : '') || 'No description')}
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                ${formTags.map(tag => `<span style="padding: 0.3rem 0.8rem; background: rgba(99, 102, 241, 0.2); border-radius: 15px; font-size: 0.8rem; color: #a5b4fc;">${escapeHtml(tag)}</span>`).join('')}
            </div>
            ${link ? `<a href="${link}" style="color: var(--primary-color); text-decoration: none; font-size: 0.9rem;">→ Visit</a>` : ''}
        </div>
    `;
}

function handlePostSubmit(e) {
    e.preventDefault();
    
    if (formTags.length === 0) {
        showToast('Please add at least one tag', 'error');
        return;
    }
    
    const newPost = {
        id: Date.now(),
        title: document.getElementById('postTitle').value,
        description: document.getElementById('postDescription').value,
        link: document.getElementById('postLink').value,
        tags: formTags,
        date: new Date().toISOString().split('T')[0],
        author: currentAdminUser.name
    };
    
    // Add to state
    adminPosts.unshift(newPost);
    
    // Update localStorage
    const allPosts = JSON.parse(localStorage.getItem('trainingPosts') || '[]');
    allPosts.unshift(newPost);
    localStorage.setItem('trainingPosts', JSON.stringify(allPosts));
    
    // Send to API (in production)
    // await fetch('/api/posts', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(newPost)
    // });
    
    showToast('Post published successfully!', 'success');
    
    // Reset form
    e.target.reset();
    formTags = [];
    renderTags();
    updatePreview();
    document.getElementById('titleCount').textContent = '0/100';
    document.getElementById('descCount').textContent = '0/1000';
    
    // Refresh table
    loadAdminPosts();
}

function loadAdminPosts() {
    adminPosts = JSON.parse(localStorage.getItem('trainingPosts') || '[]');
    renderPostsTable();
}

function renderPostsTable() {
    const tbody = document.getElementById('postsTableBody');
    const noMsg = document.getElementById('noPostsMsg');
    
    if (adminPosts.length === 0) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    
    noMsg.style.display = 'none';
    tbody.innerHTML = adminPosts.map((post, idx) => `
        <tr style="animation: slideIn 0.3s ease-out forwards; animation-delay: ${idx * 0.05}s; opacity: 0;">
            <td><strong>${escapeHtml(post.title)}</strong></td>
            <td>${post.tags.map(t => `<span style="display: inline-block; padding: 0.2rem 0.6rem; background: rgba(99, 102, 241, 0.2); border-radius: 10px; margin-right: 0.3rem; font-size: 0.8rem;">${escapeHtml(t)}</span>`).join('')}</td>
            <td>${new Date(post.date).toLocaleDateString()}</td>
            <td>
                <button class="btn-edit" onclick="editPost(${post.id})">Edit</button>
                <button class="btn-delete" onclick="deletePost(${post.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deletePost(id) {
    if (confirm('Are you sure? This action cannot be undone.')) {
        adminPosts = adminPosts.filter(p => p.id !== id);
        localStorage.setItem('trainingPosts', JSON.stringify(adminPosts));
        showToast('Post deleted successfully', 'success');
        loadAdminPosts();
    }
}

function editPost(id) {
    const post = adminPosts.find(p => p.id === id);
    if (post) {
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postDescription').value = post.description;
        document.getElementById('postLink').value = post.link;
        formTags = [...post.tags];
        renderTags();
        updatePreview();
        
        // Delete the post and let user resubmit
        deletePost(id);
        
        // Scroll to form
        document.querySelector('.post-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// ==================== UTILITIES ====================
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
