param(
  [string]$ServerPath = "C:\Users\james\tools\llama.cpp-b9544-cuda12.4\llama-server.exe",
  [string]$Repo = "unsloth/gemma-4-26B-A4B-it-qat-GGUF",
  [string]$File = "gemma-4-26B-A4B-it-qat-UD-Q4_K_XL.gguf",
  [int]$Context = 32768,
  [int]$Port = 8080,
  [string]$HostAddress = "127.0.0.1",
  [string]$GpuLayers = "auto",
  [string]$CacheTypeK = "q4_0",
  [string]$CacheTypeV = "q4_0",
  [int]$Parallel = 1,
  [int]$CacheRamMiB = 0,
  [ValidateSet("on", "off", "auto")]
  [string]$Reasoning = "off",
  [string[]]$ExtraArgs = @()
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ServerPath)) {
  throw "llama-server.exe was not found at '$ServerPath'. Install llama.cpp CUDA or pass -ServerPath."
}

$arguments = @(
  "--hf-repo", $Repo,
  "--hf-file", $File,
  "-cmoe",
  "-c", [string]$Context,
  "-ngl", $GpuLayers,
  "-ctk", $CacheTypeK,
  "-ctv", $CacheTypeV,
  "-np", [string]$Parallel,
  "--cache-ram", [string]$CacheRamMiB,
  "--reasoning", $Reasoning,
  "--host", $HostAddress,
  "--port", [string]$Port,
  "--jinja"
) + $ExtraArgs

Write-Host "Starting llama-server sidecar:"
Write-Host "  Server: $ServerPath"
Write-Host "  Model:  $Repo / $File"
Write-Host "  URL:    http://$HostAddress`:$Port/v1"
Write-Host "  Ctx:    $Context"
Write-Host "  MoE:    CPU"
Write-Host "  KV:     K=$CacheTypeK V=$CacheTypeV"
Write-Host "  Slots:  $Parallel"
Write-Host "  Think:  $Reasoning"
Write-Host ""

& $ServerPath @arguments
