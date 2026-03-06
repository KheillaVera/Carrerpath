<?php
include('../includes/db_connect.php');
include('../includes/functions.php');

if (isset($_GET['interest'])) {
    $interest = $_GET['interest'];
    $results = getRecommendations($db, $interest); // Uses your RIASEC mapping
    echo json_encode($results);
}
?>