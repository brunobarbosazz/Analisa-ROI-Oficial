param([string]$FileName = 'Analisa-Roi-projeto-completo.zip')
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ([IO.Path]::GetFileName($FileName) -ne $FileName -or [IO.Path]::GetExtension($FileName) -ne '.zip') {
  throw 'Informe apenas o nome de um arquivo .zip.'
}

$out = [IO.Path]::GetFullPath((Join-Path $root $FileName))
if ((Split-Path -Parent $out) -ne $root) { throw 'O destino do ZIP deve ficar na pasta do projeto.' }
if ((Test-Path -LiteralPath $out) -and (Get-Item -LiteralPath $out).PSIsContainer) {
  throw 'O destino já existe como pasta.'
}

$projectItems = @(
  'AGENTS.md', 'CLAUDE.md', '.env.example', '.gitignore', '.nvmrc',
  'app.js', 'design.css', 'index.html', 'iniciar-demo.bat', 'jsrepo.config.mts',
  'landing-copy.css', 'landing-template.js', 'package.json', 'plan-catalog.js',
  'PRODUCT.md', 'README.md', 'reiniciar-demo.bat', 'sales.css', 'sales.js',
  'server.js', 'skills-lock.json', 'split-text.css', 'split-text.js', 'styles.css',
  'theme.js', 'ux.css', 'ux.js', 'vercel.json', '.github', 'api', 'lib', 'supabase',
  'docs', 'landing-page-export', 'public', 'scripts', 'transitions'
)

$paths = foreach ($item in $projectItems) {
  $path = Join-Path $root $item
  if (Test-Path -LiteralPath $path) { (Resolve-Path -LiteralPath $path).Path }
}

if (Test-Path -LiteralPath $out) { Remove-Item -LiteralPath $out -Force }
Compress-Archive -Path $paths -DestinationPath $out -CompressionLevel Optimal

$archive = Get-Item -LiteralPath $out
if ($archive.Length -lt 1) { throw 'O ZIP criado está vazio.' }
Write-Output ("ZIP criado: {0} ({1:N2} MB)" -f $archive.FullName, ($archive.Length / 1MB))
