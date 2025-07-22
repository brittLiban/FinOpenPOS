$routes = Get-ChildItem -Path "src\app\api" -Recurse -Filter "route.ts" -File

foreach ($route in $routes) {
    $filePath = $route.FullName
    $content = Get-Content $filePath -Raw
    
    # Check if dynamic export already exists
    if ($content -notmatch "export const dynamic") {
        # Find the first import line
        $lines = Get-Content $filePath
        $insertIndex = 0
        
        # Find where to insert - after imports but before any other exports
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import|^\/\/.*import" -or $lines[$i].Trim() -eq "") {
                $insertIndex = $i + 1
            } elseif ($lines[$i] -match "^export") {
                break
            }
        }
        
        # Insert the dynamic export
        $newLines = @()
        $newLines += $lines[0..($insertIndex-1)]
        $newLines += ""
        $newLines += "// This API route uses authentication and must be dynamic"
        $newLines += "export const dynamic = 'force-dynamic';"
        $newLines += ""
        if ($insertIndex -lt $lines.Length) {
            $newLines += $lines[$insertIndex..($lines.Length-1)]
        }
        
        # Write back to file
        $newLines | Set-Content $filePath -Encoding UTF8
        Write-Host "Updated: $($route.FullName)"
    } else {
        Write-Host "Already has dynamic export: $($route.FullName)"
    }
}
