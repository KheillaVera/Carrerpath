// Sample hobbies based on RIASEC categories
// State Management
const appState = {
    currentQuestion: 0,
    scores: { Realistic: 0, Investigative: 0, Artistic: 0, Social: 0, Enterprising: 0, Conventional: 0 },
    hobbies: [
        { text: "Fixing gadgets or working with tools", category: "Realistic" },
        { text: "Researching how things work", category: "Investigative" },
        { text: "Creating music or digital art", category: "Artistic" },
        { text: "Mentoring or helping others", category: "Social" },
        { text: "Leading a project or startup", category: "Enterprising" },
        { text: "Managing data or organizing schedules", category: "Conventional" }
    ]
};

// UI Engine: Replaces content without reloading
function renderUI(content) {
    const container = document.getElementById('quiz-container');
    container.classList.add('fade-out');
    
    setTimeout(() => {
        container.innerHTML = content;
        container.classList.remove('fade-out');
        container.classList.add('fade-in');
    }, 300);
}

function startQuiz() {
    showQuestion();
}

function showQuestion() {
    const hobby = appState.hobbies[appState.currentQuestion];
    
    const html = `
        <div class="swipe-card">
            <h3 style="color:var(--primary)">Hobby ${appState.currentQuestion + 1}/${appState.hobbies.length}</h3>
            <p style="font-size: 1.5rem; margin: 30px 0;">${hobby.text}</p>
            <div class="actions">
                <button onclick="handleResponse(false)" class="btn-no">Nah</button>
                <button onclick="handleResponse(true)" class="btn-yes">Yeah!</button>
            </div>
        </div>
    `;
    renderUI(html);
}

function handleResponse(isYes) {
    const category = appState.hobbies[appState.currentQuestion].category;
    if (isYes) appState.scores[category]++;
    
    appState.currentQuestion++;
    
    if (appState.currentQuestion < appState.hobbies.length) {
        showQuestion();
    } else {
        fetchResults();
    }
}

async function fetchResults() {
    renderUI(`<h3>Calculating your best path...</h3>`);
    
    // Sort scores to find the highest category
    const topCategory = Object.keys(appState.scores).reduce((a, b) => appState.scores[a] > appState.scores[b] ? a : b);
    
    try {
        const response = await fetch(`api/get_results.php?interest=${topCategory}`);
        const data = await response.json();
        
        let resultHtml = `<h3>Your Pathway</h3><div class="results-list">`;
        data.forEach(item => {
            resultHtml += `
                <div class="result-item">
                    <strong>${item.career_title}</strong>
                    <p>${item.description}</p>
                </div>`;
        });
        resultHtml += `<button onclick="location.reload()" class="btn-primary">Restart</button></div>`;
        renderUI(resultHtml);
        
    } catch (e) {
        renderUI(`<p>Stay faithful—our servers are recharging. Try again soon.</p>`);
    }
}

