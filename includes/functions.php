// Example logic to match interests to a Pathway
function matchCareer($topInterest) {
    $map = [
        "Artistic" => "Languages & Arts",
        "Investigative" => "MPC or MCB",
        "Social" => "Humanities (HEG)",
        "Realistic" => "TVET / Engineering"
    ];
    return $map[$topInterest] ?? "General Education";
}