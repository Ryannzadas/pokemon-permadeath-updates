Unicode true
!include "MUI2.nsh"
!ifndef PROJECT_DIR
 !define PROJECT_DIR "."
!endif
!ifndef APP_STAGE
 !error "Passe APP_STAGE com a pasta do aplicativo Windows empacotado"
!endif
!ifndef OUTPUT_SETUP
 !define OUTPUT_SETUP "${PROJECT_DIR}/dist/Pokemon-Permadeath-Teste-Visual-Interface-Setup-r2.exe"
!endif
Name "Pokemon Permadeath - Teste Visual"
OutFile "${OUTPUT_SETUP}"
InstallDir "$LOCALAPPDATA\Programs\Pokemon Permadeath - Teste Visual"
InstallDirRegKey HKCU "Software\PokemonPermadeathVisualTest" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID zlib
!define MUI_ICON "${PROJECT_DIR}/build/app-icon.ico"
!define MUI_UNICON "${MUI_ICON}"
!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "PortugueseBR"
Function .onInit
 FindWindow $0 "" "Pokemon Permadeath — Teste Visual"
 StrCmp $0 0 done
 MessageBox MB_OK|MB_ICONEXCLAMATION "Feche a edição de teste visual antes de instalar."
 Abort
 done:
FunctionEnd
Section "Aplicativo"
 SetOutPath "$INSTDIR"
 File /r "${APP_STAGE}/*"
 WriteUninstaller "$INSTDIR\Desinstalar.exe"
 WriteRegStr HKCU "Software\PokemonPermadeathVisualTest" "InstallDir" "$INSTDIR"
 CreateShortcut "$DESKTOP\Pokemon Permadeath - Teste Visual.lnk" "$INSTDIR\Pokemon Permadeath - Teste Visual.exe" "" "$INSTDIR\app-icon.ico"
 CreateDirectory "$SMPROGRAMS\Pokemon Permadeath - Teste Visual"
 CreateShortcut "$SMPROGRAMS\Pokemon Permadeath - Teste Visual\Jogar.lnk" "$INSTDIR\Pokemon Permadeath - Teste Visual.exe" "" "$INSTDIR\app-icon.ico"
 CreateShortcut "$SMPROGRAMS\Pokemon Permadeath - Teste Visual\Desinstalar.lnk" "$INSTDIR\Desinstalar.exe"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PokemonPermadeathVisualTest" "DisplayName" "Pokemon Permadeath - Teste Visual"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PokemonPermadeathVisualTest" "DisplayVersion" "0.4.1-test.7"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PokemonPermadeathVisualTest" "UninstallString" '"$INSTDIR\Desinstalar.exe"'
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PokemonPermadeathVisualTest" "DisplayIcon" "$INSTDIR\app-icon.ico"
SectionEnd
Section "Uninstall"
 Delete "$DESKTOP\Pokemon Permadeath - Teste Visual.lnk"
 RMDir /r "$SMPROGRAMS\Pokemon Permadeath - Teste Visual"
 RMDir /r "$INSTDIR"
 DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PokemonPermadeathVisualTest"
 DeleteRegKey HKCU "Software\PokemonPermadeathVisualTest"
SectionEnd
