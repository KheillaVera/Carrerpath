// ═══════════════════ NAVIGATION ═══════════════════
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if(target) target.classList.add('active');
    
    // Load data automatically when entering a screen
    if(screenId === 'jobs-screen') fetchData('jobs');
    if(screenId === 's3-screen') fetchData('courses');
}

// ═══════════════════ DYNAMIC FETCH ═══════════════════
async function fetchData(type, query = '') {
    const container = type === 'jobs' ? document.getElementById('job-list') : document.getElementById('course-list');
    container.innerHTML = '<p class="loading">Searching the stars...</p>';

    try {
        const response = await fetch(`api/get_data.php?type=${type}&search=${query}`);
        const data = await response.json();
        renderCards(type, data);
    } catch (error) {
        container.innerHTML = '<p>Error loading data. Check database connection.</p>';
    }
}

// ═══════════════════ RENDER UI ═══════════════════
function renderCards(type, data) {
    const container = type === 'jobs' ? document.getElementById('job-list') : document.getElementById('course-list');
    
    if (data.length === 0) {
        container.innerHTML = '<p>No matches found for your Aura.</p>';
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="card fade-in">
            <div class="card-header">
                <h3>${item.title || item.course_name}</h3>
                <span class="badge">${item.match_rate || 'New'}</span>
            </div>
            <p class="text-muted">${item.company || item.university}</p>
            <div class="card-footer">
                <button class="btn-sm">View Details</button>
                <span class="price">${item.salary || item.tuition || ''}</span>
            </div>
        </div>
    `).join('');
}

// ═══════════════════ THEME LOGIC ═══════════════════
function cyclePalette() {
    const palettes = ['blue', 'red'];
    const current = document.documentElement.getAttribute('data-palette');
    const next = palettes[(palettes.indexOf(current) + 1) % palettes.length];
    document.documentElement.setAttribute('data-palette', next);
}