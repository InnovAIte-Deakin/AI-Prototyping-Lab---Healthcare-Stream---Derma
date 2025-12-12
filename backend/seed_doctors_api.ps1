$doctors = @(
    @{
        email = "alice@derma.com"
        password = "password123"
        role = "doctor"
    },
    @{
        email = "bob@derma.com"
        password = "password123"
        role = "doctor"
    }
)

foreach ($doc in $doctors) {
    $body = $doc | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/auth/signup" -Method Post -Body $body -ContentType "application/json"
        Write-Host "Created $($doc.email)"
    } catch {
        # Check if 400 (already exists)
        if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::BadRequest) {
             Write-Host "User $($doc.email) already exists."
        } else {
             Write-Host "Failed to create $($doc.email): $($_.Exception.Message)"
        }
    }
}
