<?php
// includes/functions.php

function getRecommendations($db, $interest) {
    // Map RIASEC interests to our database pathways
    $interestMap = [
        "Realistic" => 1,      // Sciences/TVET
        "Investigative" => 1,  // Sciences
        "Artistic" => 3,       // Languages
        "Social" => 2,         // Humanities
        "Enterprising" => 2,   // Humanities/Business
        "Conventional" => 1    // Sciences/Finance
    ];

    $pathwayId = $interestMap[$interest] ?? 1;

    // Fetch careers from the DB based on the pathway
    $query = "SELECT * FROM careers WHERE pathway_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$pathwayId]);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>