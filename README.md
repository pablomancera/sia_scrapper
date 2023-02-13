# SIA Scrapper (Experimental)
Pequeño script para seguir los cupos de las asignaturas en el buscador de cursos de la Universidad Nacional de Colombia.
# Características
- Buscador de cursos integrado.
- Notifica cuando hay un cambio en los cupos.
- Resistente a errores de conexión y errores aleatorios del SIA.
- Seguidores independientes asincrónicos.
# Dependencias
- [Node.js](https://nodejs.org/en/)
- npm
# Quickstart
```
$ git clone https://github.com/pablomancera/sia_scrapper.git
$ cd sia_scrapper
$ npm i
$ npm test
```
# Cómo correr en Android (Termux)

Requiere [Termux](https://f-droid.org/en/packages/com.termux/) y [Termux:API](https://f-droid.org/packages/com.termux.api/).

Adaptado de https://github.com/rishabhrpg/puppeteer-on-termux

- Instalar contenedor de Alpine\
Abrir Termux
```
$ pkg install proot-distro
$ proot-distro install alpine
```

- Instalar dependencias en Alpine\
Abrir Termux
```
$ proot-distro login alpine
# apk update
# apk add git
# apk add nodejs
# apk add npm
# apk add chromium
# git clone https://github.com/pablomancera/sia_scrapper.git
# cd sia_scrapper
# npm i
```

- Ejecutar el programa\
Abrir Termux
```
$ proot-distro login alpine
# cd sia_scrapper
# npm test
```

# Screenshoots
- Linux\
![Screenshot from 2023-02-12 19-44-39](https://user-images.githubusercontent.com/26395881/218359080-66879b28-012b-4029-b8bf-4232864f52f3.png)
![Screenshot from 2023-02-12 19-45-55](https://user-images.githubusercontent.com/26395881/218359331-29e28c05-bcba-4618-8319-7e6caa6660ab.png)
- Android (Termux)\
![Screenshot_20230212-201723_Trebuchet](https://user-images.githubusercontent.com/26395881/218360011-d4b77cf9-979b-4f65-9411-ce8424511ca0.png)
![Screenshot_20230212-201708_Termux](https://user-images.githubusercontent.com/26395881/218360016-6fbcf7fd-9796-4508-a344-12f4f470a240.png)
