
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx"

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content

        # Fix corrupted empty strings
        # Case 1: Operators = : ? , (
        $content = $content -replace "([=:(?,])\s*';`r?`n", "`$1 '';`n"
        # Case 2: Keywords return
        $content = $content -replace "(return)\s*';`r?`n", "`$1 '';`n"

        # Also handle end of file without newline
        $content = $content -replace "([=:(?,])\s*';$", "`$1 '';"
        $content = $content -replace "(return)\s*';$", "`$1 '';"

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -Force
            Write-Host "Repaired: $($file.Name)"
        }
    }
    catch {
        Write-Error "Error processing $($file.Name): $_"
    }
}
