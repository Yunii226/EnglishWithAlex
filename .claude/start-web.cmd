@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
set CI=1
"C:\Program Files\nodejs\npx.cmd" expo start --web --port 8090
