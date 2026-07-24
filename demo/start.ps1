# Ein Befehl, der alles erledigt - Windows-Fassung von start.sh.
#
#   powershell -ExecutionPolicy Bypass -File start.ps1
#
# Prueft Hardware, installiert Ollama falls noetig, laedt das passende Modell
# und fuehrt die Demo vor. Nichts zu entscheiden.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Python heisst unter Windows meist "python", nicht "python3".
$python = $null
foreach ($kandidat in @("python", "python3", "py")) {
    if (Get-Command $kandidat -ErrorAction SilentlyContinue) { $python = $kandidat; break }
}
if (-not $python) {
    Write-Host "Python fehlt. Installieren mit:  winget install Python.Python.3.12" -ForegroundColor Red
    exit 1
}

Write-Host "== 1/4  Hardware =="
& $python hardware.py
$modell = (& $python hardware.py --nur-modell).Trim()
Write-Host ""

Write-Host "== 2/4  Ollama =="
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "bereits installiert"
} else {
    Write-Host "wird installiert ..."
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id Ollama.Ollama --accept-source-agreements --accept-package-agreements
        # winget setzt PATH erst in einer neuen Sitzung - hier nachziehen.
        $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                    [Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        Write-Host "winget fehlt. Installer laden von https://ollama.com/download" -ForegroundColor Yellow
        exit 1
    }
}

# Dienst starten, falls er nicht laeuft.
function Test-Ollama {
    try {
        Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 | Out-Null
        return $true
    } catch { return $false }
}

if (-not (Test-Ollama)) {
    Write-Host "starte Dienst im Hintergrund ..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    foreach ($_ in 1..30) {
        Start-Sleep -Seconds 1
        if (Test-Ollama) { break }
    }
}

if (-not (Test-Ollama)) {
    Write-Host "Ollama laeuft nicht. Einmal manuell starten:  ollama serve" -ForegroundColor Red
    exit 1
}
Write-Host "laeuft"
Write-Host ""

Write-Host "== 3/4  Modell $modell =="
$vorhanden = (ollama list 2>$null | Select-String -SimpleMatch ($modell.Split(':')[0]))
if ($vorhanden) {
    Write-Host "bereits vorhanden"
} else {
    Write-Host "wird geladen, das dauert je nach Leitung ein paar Minuten ..."
    ollama pull $modell
}
Write-Host ""

Write-Host "== 4/4  Demo: Beleg auslesen =="
Write-Host "Eingabe: beispiele\beleg.txt"
Write-Host ""
& $python extract.py --vorlage beleg beispiele\beleg.txt
Write-Host ""
Write-Host "Fertig. Kein Byte hat diesen Rechner verlassen."
Write-Host ""
Write-Host "Weiter geht es so:"
Write-Host "  $python extract.py --vorlage angebot beispiele\angebot.txt"
Write-Host "  $python extract.py --vorlage beleg   eigene_rechnung.pdf"
Write-Host "  $python stapel.py  .\belege --csv maerz.csv"
