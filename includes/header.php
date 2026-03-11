<?php
// Start a session for user login later
session_start();
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark" data-palette="blue">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PathAura | AI Career Compass</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header class="nav-header">
        <div class="web-container" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div class="logo" onclick="showScreen('home')" style="cursor:pointer">
                Path<span>Aura</span>
            </div>
            <nav class="desktop-nav">
                <button class="btn-pill" onclick="cyclePalette()">🎨 Theme</button>
                <button class="btn-pill" onclick="toggleMode()">🌙</button>
            </nav>
        </div>
    </header>