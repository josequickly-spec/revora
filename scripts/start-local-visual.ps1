param(
  [ValidateRange(1024, 65535)][int]$Port = 3107
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$distDirectory = if (Test-Path -LiteralPath (Join-Path $root ".next-visual-qa\standalone\server.js")) {
  ".next-visual-qa"
} elseif (Test-Path -LiteralPath (Join-Path $root ".next\standalone\server.js")) {
  ".next"
} else {
  $null
}
$standalone = if ($distDirectory) { Join-Path $root "$distDirectory\standalone" } else { $null }
$localEnvFile = Join-Path $root ".env.local"

if (-not $standalone) {
  throw "The visual QA build is missing. Run npm run build first."
}

# Local-only runtime. Credentials stay in the ignored .env.local file.
$localDatabaseLine = Get-Content -LiteralPath $localEnvFile | Where-Object { $_ -match "^LOCAL_DATABASE_URL=" } | Select-Object -Last 1
if (-not $localDatabaseLine) {
  throw "LOCAL_DATABASE_URL is required in .env.local. Refusing to use a remote database."
}
$env:DATABASE_URL = ($localDatabaseLine.Substring($localDatabaseLine.IndexOf('=') + 1)).Trim().Trim('"').Trim("'")
$env:APP_URL = "http://127.0.0.1:$Port"
$env:AUTH_JWT_SECRET = "local-development-jwt-secret-not-for-production-2026"
$env:AUTH_ENCRYPTION_KEY = "local-development-encryption-key-not-for-production-2026"
$env:TRUST_PROXY = "false"
$env:LOCAL_ISOLATED_RUNTIME = "true"
$env:PORT = "$Port"
$env:NEXT_DIST_DIR = $distDirectory

# Delivery and billing providers stay disabled in this isolated local runtime.
$env:RESEND_API_KEY = ""
$env:AUTH_EMAIL_FROM = ""
$env:STRIPE_SECRET_KEY = ""
$env:UPSTASH_REDIS_REST_URL = ""
$env:UPSTASH_REDIS_REST_TOKEN = ""
$env:RATE_LIMIT_ALLOW_LOCAL_FALLBACK = "true"
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY = ""
$env:TURNSTILE_SECRET_KEY = ""

function Get-LocalEnvValue([string]$Name) {
  $line = Get-Content -LiteralPath $localEnvFile | Where-Object { $_ -match "^$([regex]::Escape($Name))=" } | Select-Object -Last 1
  if (-not $line) { return "" }
  return ($line.Substring($line.IndexOf('=') + 1)).Trim().Trim('"').Trim("'")
}

# Load AI credentials without copying or printing them.
$env:OPENAI_API_KEY = Get-LocalEnvValue "OPENAI_API_KEY"
$env:ANTHROPIC_API_KEY = Get-LocalEnvValue "ANTHROPIC_API_KEY"
$env:GEMINI_API_KEY = Get-LocalEnvValue "GEMINI_API_KEY"
$env:GROQ_API_KEY = Get-LocalEnvValue "GROQ_API_KEY"
if (-not ($env:OPENAI_API_KEY -or $env:ANTHROPIC_API_KEY -or $env:GEMINI_API_KEY -or $env:GROQ_API_KEY)) {
  throw "No AI provider key is configured in .env.local."
}
$env:OPENAI_MODEL = "gpt-5.6-terra"
$env:OPENAI_EXECUTIVE_MODEL = "gpt-5.6-terra"
$env:ANTHROPIC_MODEL = "claude-sonnet-5"
$env:ANTHROPIC_PROMPT_CACHE = "true"
$env:GEMINI_MODEL = "gemini-3-flash-preview"
$env:GROQ_MODEL = "openai/gpt-oss-120b"

Push-Location $standalone
try {
  node server.js
} finally {
  Pop-Location
}
