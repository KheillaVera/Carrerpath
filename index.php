<?php 
include('includes/db_connect.php'); 
include('includes/functions.php'); 
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="assets/style.css">
    <title>CareerPath| Find Your Pathway</title>
</head>
<body>

    <?php include('includes/header.php'); ?>

    <main class="app-container" style="display:flex; justify-content:center; align-items:center; min-height:80vh;">
        <div class="glass-card">
            <h1>Find Your Future 🇷🇼</h1>
            <p>Swipe through your hobbies to see your A-Level pathway.</p>
            
            <div id="quiz-container">
                <button onclick="startQuiz()" class="btn-primary" style="background:var(--primary); padding:15px 30px; border:none; border-radius:10px; color:white; font-weight:bold; cursor:pointer;">
                    Start Assessment
                </button>
            </div>
        </div>
    </main>

    <footer class="main-footer">
        <p>&copy; 2026 CareerPath Rwanda. Built with faith and code.</p>
        <p><small>"Commit to the Lord whatever you do, and he will establish your plans." — Proverbs 16:3</small></p>
    </footer>

    <script src="assets/index.js"></script>
</body>
</html>