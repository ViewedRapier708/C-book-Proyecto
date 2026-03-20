@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Begin all REM://cmds with @
@echo off

@REM set title of command window
title %0

@setlocal

set ERROR_CODE=0

@REM To isolate internal variables from possible post scripts, we use another setlocal
@setlocal

@REM ==== START VALIDATION ====
if NOT "%JAVA_HOME%"=="" goto OkJHome

for %%i in (java.exe) do set "JAVACMD=%%~$PATH:i"
goto checkJCmd

:OkJHome
set "JAVACMD=%JAVA_HOME%\bin\java.exe"

:checkJCmd
if exist "%JAVACMD%" goto chkMHome

echo The JAVA_HOME environment variable is not defined correctly, >&2
echo this environment variable is needed to run this program. >&2
goto error

:chkMHome
set "MAVEN_PROJECTBASEDIR=%~dp0"

@REM Find the project basedir, i.e. the directory that contains the pom.xml file
:findBaseDir
IF EXIST "%MAVEN_PROJECTBASEDIR%\.mvn" goto baseDirFound
cd ..
IF "%cd%"=="%cd:~0,3%" goto baseDirNotFound
set "MAVEN_PROJECTBASEDIR=%cd%"
goto findBaseDir

:baseDirFound
set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%
cd "%MAVEN_PROJECTBASEDIR%"
goto baseDirCheckEnd

:baseDirNotFound
set "MAVEN_PROJECTBASEDIR=%~dp0"
cd "%MAVEN_PROJECTBASEDIR%"

:baseDirCheckEnd

IF NOT EXIST "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" (
    set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

    @REM Download maven-wrapper.jar
    for /f "tokens=1,2 delims==" %%A in ('type "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"') do (
        if "%%A"=="wrapperUrl" set WRAPPER_URL=%%B
    )
    if not "%WRAPPER_URL%"=="" (
        echo Downloading Maven Wrapper from %WRAPPER_URL% ...
        powershell -Command "&{"^
            "$webclient = new-object System.Net.WebClient;"^
            "$webclient.DownloadFile('%WRAPPER_URL%', '%WRAPPER_JAR%')"^
            "}"
    )
)

@REM Provide a "standardized" way to retrieve the CLI args that will
@REM work with both Windows and non-Windows executions.
set MAVEN_CMD_LINE_ARGS=%*

@REM Find the wrapper jar
set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

@REM Execute the wrapper
"%JAVACMD%" ^
  %JVM_CONFIG_MAVEN_PROPS% ^
  %MAVEN_OPTS% ^
  -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" ^
  -classpath %WRAPPER_JAR% ^
  org.apache.maven.wrapper.MavenWrapperMain %MAVEN_CMD_LINE_ARGS%

if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%

cmd /C exit /B %ERROR_CODE%
