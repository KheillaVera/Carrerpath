<?php
include '../includes/db_connect.php';

$type = $_GET['type'] ?? 'jobs'; // Can be 'jobs' or 'courses'
$search = $_GET['search'] ?? '';

if ($type === 'jobs') {
    $stmt = $pdo->prepare("SELECT * FROM jobs WHERE title LIKE ? OR company LIKE ?");
    $stmt->execute(["%$search%", "%$search%"]);
} else {
    $stmt = $pdo->prepare("SELECT * FROM courses WHERE course_name LIKE ?");
    $stmt->execute(["%$search%"]);
}

$results = $stmt->fetchAll();
echo json_encode($results);
?>