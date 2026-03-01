@echo off
echo 正在安装依赖...
call npm install
echo.
echo 依赖安装完成，正在启动开发服务器...
echo 请在浏览器打开 http://localhost:5173
call npm run dev
pause
