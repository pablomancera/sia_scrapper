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
$ npm start
```

# Actualizando

Luego de actualizar el repositorio se debe correr `npm run build` para compilar los cambios.

# Cómo correr en Android (Termux)

Requiere instalar las aplicaciones: [Termux](https://github.com/termux/termux-app/releases/latest), [Termux:API](https://github.com/termux/termux-api/releases/latest) y [Termux:Widget](https://github.com/termux/termux-widget/releases/latest).

- Dar permiso a Termux de mostrar notificaciones y mostrar sobre otras apps.
- Ejecutar en Termux:
```
bash <(curl -fsSL https://raw.githubusercontent.com/pablomancera/sia_scrapper/main/scripts/termux.sh)
```

# Screenshoots
- Linux\
![Screenshot from 2023-02-12 19-44-39](https://user-images.githubusercontent.com/26395881/218359080-66879b28-012b-4029-b8bf-4232864f52f3.png)
![Screenshot from 2023-02-12 19-45-55](https://user-images.githubusercontent.com/26395881/218359331-29e28c05-bcba-4618-8319-7e6caa6660ab.png)
- Android (Termux)\
![Screenshot_20230212-201723_Trebuchet](https://user-images.githubusercontent.com/26395881/218360011-d4b77cf9-979b-4f65-9411-ce8424511ca0.png)
![Screenshot_20230212-201708_Termux](https://user-images.githubusercontent.com/26395881/218360016-6fbcf7fd-9796-4508-a344-12f4f470a240.png)
