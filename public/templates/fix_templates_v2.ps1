# Fix all templates to use auto-sizing (compatible with older PowerShell)
Get-ChildItem -Recurse -Filter *.json | Where-Object { $_.Name -ne 'index.json' } | ForEach-Object {
    Write-Host "Processing $($_.Name)"
    $content = Get-Content $_.FullName -Raw | ConvertFrom-Json
    
    # Update all text elements
    $content.pages | ForEach-Object {
        $_.elements | ForEach-Object {
            if ($_.type -eq 'text' -or $_.type -eq 'heading' -or $_.type -eq 'paragraph') {
                $_.style | Add-Member -NotePropertyName 'width' -NotePropertyValue 'auto' -Force
                $_.style | Add-Member -NotePropertyName 'height' -NotePropertyValue 'auto' -Force
                $_.style | Add-Member -NotePropertyName 'resize' -NotePropertyValue 'both' -Force
                $_.style | Add-Member -NotePropertyName 'overflow' -NotePropertyValue 'visible' -Force
                $_.style | Add-Member -NotePropertyName 'whiteSpace' -NotePropertyValue 'nowrap' -Force
                $_.style | Add-Member -NotePropertyName 'minWidth' -NotePropertyValue 150 -Force
                $_.style | Add-Member -NotePropertyName 'minHeight' -NotePropertyValue 20 -Force
                $_.style | Add-Member -NotePropertyName 'maxWidth' -NotePropertyValue 674 -Force
            }
        }
    }
    
    $content | ConvertTo-Json -Depth 10 | Set-Content $_.FullName -Encoding UTF8
}
Write-Host "All templates updated!"
