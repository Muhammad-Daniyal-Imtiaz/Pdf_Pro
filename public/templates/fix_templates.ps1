# Fix all templates to use auto-sizing
Get-ChildItem -Recurse -Filter *.json | Where-Object { $_.Name -ne 'index.json' } | ForEach-Object {
    Write-Host "Processing $($_.Name)"
    $content = Get-Content $_.FullName -Raw | ConvertFrom-Json -Depth 10
    
    # Update all text elements
    $content.pages | ForEach-Object {
        $_.elements | ForEach-Object {
            if ($_.type -eq 'text' -or $_.type -eq 'heading' -or $_.type -eq 'paragraph') {
                $_.style.width = "auto"
                $_.style.height = "auto"
                $_.style.resize = "both"
                $_.style.overflow = "visible"
                $_.style.whiteSpace = "nowrap"
                $_.style.minWidth = 150
                $_.style.minHeight = 20
                $_.style.maxWidth = 674
            }
        }
    }
    
    $content | ConvertTo-Json -Depth 10 | Set-Content $_.FullName -Encoding UTF8
}
Write-Host "All templates updated!"
