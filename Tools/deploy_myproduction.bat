@echo off

set productionServerName=host-home
set buildSystemPath=..\.deploy\Server\System
set productionSystemPath=\\host-home\C$\LocalApps\Emby\System
set productionBackupSystemPath=\\host-home\C$\LocalApps\Emby\SystemOLD

echo Stopping service on remote machine
sc \\%productionServerName% stop Emby

echo Waiting until MediaBrowser.ServerApplication.exe has exited, this usually takes some time
:ServiceDownWaitLoop
tasklist /S %productionServerName% /FI "IMAGENAME eq MediaBrowser.ServerApplication.exe" 2>NUL | find /I /N "MediaBrowser.ServerApplication.exe" >NUL
if "%errorlevel%"=="0" (
	timeout /T 3 /NOBREAK >NUL
	goto ServiceDownWaitLoop
)

rem echo Backing up current System folder to SystemOLD
rem robocopy "%productionSystemPath%" "%productionBackupSystemPath%" /MIR

echo Deploying new System folder
pushd "%~dp0"
robocopy "%buildSystemPath%" "%productionSystemPath%" /MIR
popd

echo Starting service on remote machine
sc \\%productionServerName% start Emby
