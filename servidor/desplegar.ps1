# Despliegue del servidor desde Windows (PowerShell): hace commit+push de lo pendiente si lo pides y lanza
# desplegar.sh en el servidor por SSH. Requiere el Host "servidor-pi" en ~/.ssh/config y la regla de sudoers (LEEME).
#     .\servidor\desplegar.ps1              → solo despliega lo que ya esté en GitHub
#     .\servidor\desplegar.ps1 "mensaje"    → git add -A, commit con ese mensaje, push, y despliega
param([string]$Mensaje = "", [string]$Servidor = "servidor-pi", [string]$Usuario = "administrador")
$repo = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $repo
if ($Mensaje -ne "") {
  git add -A
  git commit -m $Mensaje
  if ($LASTEXITCODE -ne 0) { Write-Host "Nada que commitear, sigo con el push/despliegue." }
}
git push
if ($LASTEXITCODE -ne 0) { Write-Error "git push ha fallado; no despliego."; exit 1 }
# El bastión de Isard entra como el usuario de las credenciales del escritorio (isard): sudo al dueño del repo, como el workflow
ssh $Servidor "sudo -n -u $Usuario -H /home/$Usuario/proyectos_intermodulares/servidor/desplegar.sh"
