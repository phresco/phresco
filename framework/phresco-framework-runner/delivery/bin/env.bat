@echo off
if "%PHRESCO_HOME%" == "%cd%\.." goto :eof
  
set PHRESCO_HOME=%CD%\..
set MAVEN_HOME=%CD%\..\tools\maven
set JENKINS_HOME=%PHRESCO_HOME%\workspace\tools\jenkins
set M2_HOME=%MAVEN_HOME%
set SONAR_HOME=%CD%\..\workspace\tools\sonar-3.1.1
set PATH=%MAVEN_HOME%\bin;%SONAR_HOME%;%PHRESCO_HOME%\bin;%PHRESCO_HOME%\workspace\tools\phantomjs-1.5.0-win32-static\bin;%PATH%;