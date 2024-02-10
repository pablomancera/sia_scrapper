#!/bin/bash

set -e

container_commands="
    echo \"Actualizando repositorios de Alpine...\" && \
    apk update && \
    echo \"Instalando dependencias de Alpine, esto tomará un tiempo...\" && \
    apk add git nodejs npm chromium && \
    echo \"Clonando repositorio\" && \
    git clone https://github.com/pablomancera/sia_scrapper.git && \
    cd sia_scrapper && \
    echo \"Instalando dependencias de node\" && \
    npm i
"

start_script="cd sia_scrapper && npm start"

shortcut_script="\
#!/bin/bash
proot-distro login alpine -- bash <(echo \"$start_script\")\
"

echo "Actualizando repositorios..."
apt update
echo "Instalando dependencias en Termux..."
apt install -y proot-distro termux-api
echo "Instalando contenedor Alpine"
proot-distro install alpine
echo "Entrando al contenedor Alpine..."
proot-distro login alpine -- bash <(echo "$container_commands")
[[ -d "/data/data/com.termux/files/home/.shortcuts" ]] || mkdir /data/data/com.termux/files/home/.shortcuts
chmod 700 -R /data/data/com.termux/files/home/.shortcuts
[[ -f "/data/data/com.termux/files/home/.shortcuts/sia_scrapper" ]] || echo "$shortcut_script" > /data/data/com.termux/files/home/.shortcuts/sia_scrapper
echo "¡El sia_scrapper ha sido instalado! Ahora instala el acceso directo en la pantalla principal"
