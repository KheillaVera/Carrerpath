<?php
include('../includes/db_connect.php');
include('../includes/functions.php');
// Get the category from the JS fetch request
$interest = $_GET['category'] ?? 'Realistic';
$data = getRecommendations($db, $interest); 
header('Content-Type: application/json');
echo json_encode($data); // This sends the data back to index.js
?>