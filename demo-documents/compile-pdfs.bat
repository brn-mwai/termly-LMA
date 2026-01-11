@echo off
REM Compile LaTeX documents to PDF
REM Requires pdflatex to be installed (via MiKTeX or TeX Live)

echo Termly Demo Document Compiler
echo =============================
echo.

REM Check if pdflatex is available
where pdflatex >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pdflatex not found!
    echo.
    echo Please install LaTeX:
    echo   - Windows: Download MiKTeX from https://miktex.org/download
    echo   - Or use Overleaf online: https://www.overleaf.com
    echo.
    echo Alternative: Copy the .tex files to Overleaf and compile online.
    pause
    exit /b 1
)

echo Found pdflatex. Compiling documents...
echo.

REM Compile each .tex file
for %%f in (*.tex) do (
    echo Compiling %%f...
    pdflatex -interaction=nonstopmode "%%f" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] %%~nf.pdf created
    ) else (
        echo   [ERROR] Failed to compile %%f
    )
)

echo.
echo Cleaning up auxiliary files...
del /q *.aux *.log *.out 2>nul

echo.
echo Done! PDF files are ready in this directory.
echo.
pause
