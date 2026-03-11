<!DOCTYPE html>
<html lang="en" data-theme="dark" data-palette="blue">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PathAura | Career Intelligence</title>
    <link rel="stylesheet" href="assets/css/style.css"> </head>
<body>

    <div class="web-container">
        <header class="nav-header">
            <div class="logo" onclick="showScreen('home')">Path<span>Aura</span></div>
            <div class="controls">
                <button class="btn-pill" onclick="cyclePalette()">🎨 Palette</button>
            </div>
        </header>

        <main>
            <section class="screen active" id="home">
                <h1 class="hero-title">Your <em>Future</em>, Designed.</h1>
                <div class="grid">
                    <div class="card large" onclick="showScreen('s3-screen')">
                        <h2>Senior 3 Helper</h2>
                        <p>Analyze your marks & find universities.</p>
                    </div>
                    <div class="card large" onclick="showScreen('jobs-screen')">
                        <h2>Job Market</h2>
                        <p>Explore high-growth career paths.</p>
                    </div>
                </div>
            </section>

            <section class="screen" id="s3-screen">
                <div class="search-bar">
                    <input type="text" placeholder="Filter courses..." onkeyup="fetchData('courses', this.value)">
                </div>
                <div id="course-list" class="grid"></div>
            </section>

            <section class="screen" id="jobs-screen">
                <div class="search-bar">
                    <input type="text" placeholder="Search roles..." onkeyup="fetchData('jobs', this.value)">
                </div>
                <div id="job-list" class="grid"></div>
            </section>
        </main>
    </div>

    <script src="assets/js/app.js"></script>
</body>
</html>