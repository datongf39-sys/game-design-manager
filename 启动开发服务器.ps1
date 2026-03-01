# 游戏设计管理平台 - 启动脚本

Write-Host "正在检查 Node.js..." -ForegroundColor Yellow

# 尝试多个可能的 Node.js 安装位置
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:APPDATA\npm\node.exe"
)

$nodeCmd = $null
foreach ($path in $nodePaths) {
    $expandedPath = [System.Environment]::ExpandEnvironmentVariables($path)
    if (Test-Path $expandedPath) {
        $nodeCmd = $expandedPath
        break    }
}

if ($nodeCmd) {
    Write-Host "找到 Node.js: $nodeCmd" -ForegroundColor Green
} else {
    Write-Host "未找到 Node.js！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 Node.js：" -ForegroundColor Yellow
    Write-Host "访问 https://nodejs.org/zh-cn/ 下载并安装 LTS 版本" -ForegroundColor White
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Gray
    $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# 添加 npm 到 PATH
$npmPath = Split-Path $nodeCmd
$env:PATH = "$npmPath;$env:PATH"

Write-Host ""
Write-Host "正在安装依赖..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "依赖安装失败！" -ForegroundColor Red
    Write-Host "按任意键退出..." -ForegroundColor Gray
    $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""
Write-Host "依赖安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "正在启动开发服务器..." -ForegroundColor Yellow
Write-Host "请在浏览器打开: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host ""

npm run dev
