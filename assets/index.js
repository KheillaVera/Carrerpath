// Sample hobbies based on RIASEC categories
const hobbies = [
    { text: "Building electronics or fixing machines", category: "Realistic" },
    { text: "Solving complex math puzzles", category: "Investigative" },
    { text: "Drawing, painting, or digital design", category: "Artistic" },
    { text: "Helping friends solve their problems", category: "Social" },
    { text: "Starting a small business or leading a team", category: "Enterprising" },
    { text: "Organizing files and data accurately", category: "Conventional" }
];

let currentCardIndex = 0;
let scores = {};

function startQuiz() {
    const container = document.getElementById('quiz-container');
    showCard();
}

function showCard() {
    if (currentCardIndex < hobbies.length) {
        const hobby = hobbies[currentCardIndex];
        const container = document.getElementById('quiz-container');
        
        // Dynamic Glass Card Injection
        container.innerHTML = `
            <div class="swipe-card animate-in">
                <h3>Do you enjoy...</h3>
                <p style="font-size: 1.2rem; margin: 20px 0;">${hobby.text}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="recordAnswer('${hobby.category}', false)" class="btn-no">✖ No</button>
                    <button onclick="recordAnswer('${hobby.category}', true)" class="btn-yes">✔ Yes</button>
                </div>
            </div>
        `;
    } else {
        calculateResults();
    }
}

function recordAnswer(category, isYes) {
    if (isYes) {
        scores[category] = (scores[category] || 0) + 1;
    }
    currentCardIndex++;
    showCard();
}

async function calculateResults() {
    // Find the category with the highest score
    const topCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b, "Realistic");
    
    const container = document.getElementById('quiz-container');
    container.innerHTML = "<h3>Finding your Rwandan Pathway...</h3>";

    // AJAX Call to your PHP API
    try {
        const response = await fetch(`api/get_results.php?interest=${topCategory}`);
        const recommendations = await response.json();
        displayFinalResults(recommendations);
    } catch (error) {
        console.error("Error fetching results:", error);
        container.innerHTML = "<p>Something went wrong. Please try again.</p>";
    }
}

function displayFinalResults(data) {
    const container = document.getElementById('quiz-container');
    let html = `<h3>Recommended Careers:</h3><ul style="list-style:none; padding:0;">`;
    
    data.forEach(item => {
        html += `
            <li style="background: rgba(255,255,255,0.1); margin: 10px 0; padding: 15px; border-radius: 10px; border-left: 4px solid #2ecc71;">
                <strong>${item.career_title}</strong><br>
                <small>${item.description}</small>
            </li>`;
    });
    
    html += `</ul><button onclick="location.reload()" class="btn-primary">Start Over</button>`;
    container.innerHTML = html;
}