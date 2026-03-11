<?php
header('Content-Type: application/json');
include '../includes/db_connect.php';

// Get the search term if it exists
$search = $_GET['search'] ?? '';

try {
    // We select the course, university, and the entry grade requirements
    $sql = "SELECT course_name, university, duration, avg_entry_grade, match_rate 
            FROM courses 
            WHERE course_name LIKE :s OR university LIKE :s";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['s' => "%$search%"]);
    $courses = $stmt->fetchAll();

    echo json_encode($courses);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>