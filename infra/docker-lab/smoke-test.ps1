param(
    [string]$ApiUrl      = "http://localhost:8000",
    [string]$FrontendUrl = "http://localhost:5173"
)

$pass = 0
$fail = 0

$tests = @(
    [pscustomobject]@{ name="API raiz";                        url="$ApiUrl/";                             contains="BookyHome" },
    [pscustomobject]@{ name="API /docs";                       url="$ApiUrl/docs";                         contains="swagger" },
    [pscustomobject]@{ name="API /catalogo/categorias";        url="$ApiUrl/catalogo/categorias";          contains="" },
    [pscustomobject]@{ name="API /catalogo/busqueda-avanzada"; url="$ApiUrl/catalogo/busqueda-avanzada";   contains="" },
    [pscustomobject]@{ name="API /health";                     url="$ApiUrl/health";                       contains="database" },
    [pscustomobject]@{ name="Catalogo con datos";              url="$ApiUrl/catalogo/busqueda-avanzada";   contains="libros" },
    [pscustomobject]@{ name="Frontend raiz";                   url="$FrontendUrl/";                        contains="" }
)

Write-Host "========================================"
Write-Host " Prueba de humo - BookyHome"
Write-Host " API:      $ApiUrl"
Write-Host " Frontend: $FrontendUrl"
Write-Host " Fecha:    $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

foreach ($t in $tests) {
    $ok = $false
    $code = 0
    try {
        $r    = Invoke-WebRequest -Uri $t.url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $code = $r.StatusCode
        $body = $r.Content
        if ($code -eq 200 -and ($t.contains -eq "" -or $body -match $t.contains)) {
            $ok = $true
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "ERR" }
    }
    if ($ok) {
        Write-Host "  OK PASS $($t.name) - HTTP $code"
        $pass++
    } else {
        Write-Host "  XX FAIL $($t.name) - HTTP $code"
        $fail++
    }
}

Write-Host "========================================"
Write-Host " Pasaron: $pass  |  Fallaron: $fail"
Write-Host "========================================"
if ($fail -eq 0) {
    Write-Host "RESULTADO: OK - todas las pruebas pasaron"
    exit 0
}
Write-Host "RESULTADO: FALLA - $fail prueba(s) no pasaron"
exit 1
