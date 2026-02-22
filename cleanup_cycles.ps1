# Script para limpar ciclos financeiros duplicados no Supabase
$supabaseUrl = "https://xfbkqnvchmtewqjpemfm.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYmtxbnZjaG10ZXdxanBlbWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NDk3NjQsImV4cCI6MjA4NzMyNTc2NH0.SWY5do3wLHVZBSGxkos3e9SXTkC8HtG8fSvdKvAs9z8"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}

# 1. Buscar todos ciclos ativos
$activeCycles = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/financial_cycles?status=eq.active&select=id,couple_id,created_at&order=created_at.desc" -Method GET -Headers $headers
Write-Host "Ciclos ativos encontrados: $($activeCycles.Count)"

# 2. Para cada couple_id, manter apenas o mais recente (já ordenado por created_at desc)
$seen = @{}
$toClose = @()

foreach ($cycle in $activeCycles) {
    if ($seen.ContainsKey($cycle.couple_id)) {
        $toClose += $cycle.id
    } else {
        $seen[$cycle.couple_id] = $cycle.id
        Write-Host "Manter ciclo $($cycle.id) para casal $($cycle.couple_id)"
    }
}

Write-Host "Ciclos duplicados a fechar: $($toClose.Count)"

# 3. Fechar os duplicados
foreach ($id in $toClose) {
    $body = @{ status = "closed" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/financial_cycles?id=eq.$id" -Method PATCH -Headers $headers -Body $body
    Write-Host "Fechado ciclo: $id"
}

Write-Host "Limpeza concluida!"
