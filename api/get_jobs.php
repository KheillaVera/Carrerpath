<?php
header('Content-Type: application/json');
include '../includes/db_connect.php';

$search = $_GET['search'] ?? '';

try {
    $sql = "SELECT title, company, location, salary, job_type, match_rate 
            FROM jobs 
            WHERE title LIKE :s OR company LIKE :s";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['s' => "%$search%"]);
    $jobs = $stmt->fetchAll();

    echo json_encode($jobs);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>