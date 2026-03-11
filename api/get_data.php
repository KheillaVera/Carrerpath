<?php
header('Content-Type: application/json');
include '../includes/db_connect.php';

$type = $_GET['type'] ?? 'jobs'; 
$search = $_GET['search'] ?? '';

if ($type === 'jobs') {
    $query = "SELECT title, company, location, salary, job_type, match_rate FROM jobs WHERE title LIKE :s OR company LIKE :s";
} else {
    $query = "SELECT course_name, university, duration as location, avg_entry_grade as salary, 'Degree' as job_type, match_rate FROM courses WHERE course_name LIKE :s";
}

$stmt = $pdo->prepare($query);
$stmt->execute(['s' => "%$search%"]);
echo json_encode($stmt->fetchAll());
?>