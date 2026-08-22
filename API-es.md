# API de GilTube

Referencia para desarrolladores de la API HTTP pública de GilTube.

> English documentation: [API.md](./API.md)

## Contenido

- [URL base](#url-base)
- [Inicio rápido](#inicio-rápido)
- [¿Necesito un token?](#necesito-un-token)
- [Obtener un token de desarrollador](#obtener-un-token-de-desarrollador)
- [Convenciones](#convenciones)
- [Salud, búsqueda y descubrimiento](#salud-búsqueda-y-descubrimiento)
- [Videos](#videos)
- [Canales y usuarios](#canales-y-usuarios)
- [Autenticación y cuenta](#autenticación-y-cuenta)
- [Suscripciones](#suscripciones)
- [Listas de reproducción](#listas-de-reproducción)
- [Películas, series y música](#películas-series-y-música)
- [Transmisiones en vivo y chat](#transmisiones-en-vivo-y-chat)
- [Watch parties](#watch-parties)
- [Notificaciones y push](#notificaciones-y-push)
- [Integración publicitaria](#integración-publicitaria)
- [API administrativa](#api-administrativa)
- [API de workers e internas](#api-de-workers-e-internas)
- [Recomendaciones de compatibilidad](#recomendaciones-de-compatibilidad)

## URL base

Todos los endpoints de este documento son relativos a:

```text
https://giltube.gilservers.com/api/v1
```

Las URL de archivos multimedia devueltas por la API también pueden partir del
origen del sitio:

```text
https://giltube.gilservers.com
```

Usa HTTPS en todas las solicitudes. Las rutas y los nombres de campos distinguen
entre mayúsculas y minúsculas.

## Inicio rápido

Comprueba el estado del servicio:

```bash
curl --fail-with-body \
  https://giltube.gilservers.com/api/v1/health
```

```json
{
  "status": "ok"
}
```

Obtén los videos públicos más recientes:

```bash
curl --fail-with-body \
  "https://giltube.gilservers.com/api/v1/videos?limit=12&offset=0"
```

Busca en el catálogo:

```bash
curl --fail-with-body --get \
  --data-urlencode "q=video musical" \
  --data-urlencode "page=1" \
  https://giltube.gilservers.com/api/v1/search
```

JavaScript en el navegador:

```js
const apiBaseUrl = 'https://giltube.gilservers.com/api/v1'

const response = await fetch(`${apiBaseUrl}/videos?limit=12&offset=0`)
if (!response.ok) {
  throw new Error(`Falló la solicitud a GilTube: ${response.status}`)
}

const videos = await response.json()
```

## ¿Necesito un token?

No para información pública. El catálogo, la búsqueda, la reproducción de
videos y los datos públicos de canales, películas, series, música y estado de
transmisiones en vivo pueden consultarse de forma anónima.

Necesitas un token cuando una aplicación actúa en nombre de un usuario: ajustes
de cuenta, listas privadas, progreso de reproducción, suscripciones,
notificaciones, publicación, administración de directos y participación en
watch parties. Esos endpoints aparecen como **Usuario** en las tablas.

## Obtener un token de desarrollador

Para una cuenta de GilTube con contraseña, intercambia el correo y la contraseña
una sola vez:

```bash
curl --fail-with-body \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"email":"developer@example.com","password":"tu-contraseña"}' \
  https://giltube.gilservers.com/api/v1/auth/token
```

Respuesta:

```json
{
  "access_token": "gts_...",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "expires_at": "2026-09-20T12:00:00Z",
  "user_id": "USER_ID",
  "user_type": "user"
}
```

El token dura 30 días. Guárdalo como una contraseña y envíalo como bearer token:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  https://giltube.gilservers.com/api/v1/account/me
```

Revoca el token cuando ya no lo necesites:

```bash
curl --fail-with-body \
  -X DELETE \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  https://giltube.gilservers.com/api/v1/auth/token
```

El token solo se muestra en la respuesta de creación. Cada llamada a
`/auth/token` crea un token independiente y no invalida los anteriores.

Las cuentas administradas mediante GILid no pueden intercambiar una contraseña
de GilTube. En su lugar, el flujo de callback de GILid devuelve un
`session_token` compatible con bearer.

## Convenciones

### Formatos de solicitud y respuesta

- Los endpoints JSON usan `Content-Type: application/json`.
- Los endpoints de archivos e imágenes usan `multipart/form-data`.
- Las propiedades JSON usan `snake_case`.
- Los IDs son cadenas opacas, normalmente UUID. No los analices ni construyas.
- Las fechas son cadenas ISO 8601/RFC 3339.
- Un endpoint de lista devuelve un arreglo o un objeto que contiene el arreglo;
  la forma exacta se indica en cada sección.
- Cuando el contrato garantiza una lista, una colección vacía se devuelve como
  `[]`.

### Autenticación e identidad del usuario

El inicio de sesión por contraseña, GILid o passkey puede devolver:

```json
{
  "message": "login successful",
  "user_id": "USER_ID",
  "user_type": "user",
  "status": "active",
  "auth_method": "password",
  "session_token": "gts_..."
}
```

Envía el token en las solicitudes del usuario:

```http
Authorization: Bearer gts_...
```

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  https://giltube.gilservers.com/api/v1/account/me
```

La API valida el bearer token y obtiene de él el ID del usuario. Nunca pongas un
token de acceso en una URL. Algunas operaciones administrativas sensibles de
workers también exigen una sesión bearer vigente.

Los clientes propios antiguos todavía pueden enviar `X-User-ID` o el parámetro
`user_id` sin bearer token. Es un mecanismo temporal de compatibilidad, no una
autorización OAuth delegada. Las integraciones nuevas deben usar bearer tokens;
un backend nunca debe considerar `X-User-ID` por sí solo como prueba de que una
solicitud no confiable pertenece a una cuenta.

Muchas acciones sociales se realizan como un canal. Además del token del
usuario, esas solicitudes usan `channel_id` o `subscriber_channel_id`. Cuando se
comprueba la propiedad, el canal debe pertenecer al usuario actual.

### Errores

La mayoría de los errores JSON tienen esta forma:

```json
{
  "error": "human-readable error"
}
```

| Estado | Significado |
| --- | --- |
| `200` | Lectura o actualización correcta. |
| `201` | Recurso creado. |
| `202` | Trabajo asíncrono aceptado o todavía en proceso. |
| `204` | Respuesta correcta sin cuerpo, cuando aplica. |
| `400` | Parámetros, cuerpo o carga no válidos. |
| `401` | Falta la identidad o una sesión requerida. |
| `403` | El usuario o canal no tiene acceso. |
| `404` | Recurso no encontrado. |
| `409` | La solicitud entra en conflicto con el estado existente. |
| `500` | Error del servidor. |

No tomes decisiones según el texto del error. Usa el estado HTTP y considera los
campos adicionales solo como información de diagnóstico.

### Paginación

- Los feeds de videos y categorías usan `limit` y `offset` basado en cero.
- La búsqueda usa `page` basado en uno y devuelve `per_page` y `total`.
- Las listas de reproducción usan `page` basado en uno y actualmente devuelven
  20 elementos por página.
- Las notificaciones usan `limit` y `offset` basado en cero.

El cliente debe tolerar que el máximo permitido por el servidor sea menor que
el límite solicitado.

### URL de multimedia

Campos como `thumbnail_url`, `avatar_url`, `hls_path`, `playback_url` y
`file_url` pueden ser absolutos o relativos a la raíz. Resuelve un valor relativo
contra `https://giltube.gilservers.com`, no contra la ruta de la API.

```js
const siteOrigin = 'https://giltube.gilservers.com'
const mediaUrl = new URL(video.thumbnail_url, siteOrigin).toString()
```

Los archivos estáticos se sirven desde `/avatars/`, `/videos/`, `/downloads/`,
`/music-assets/` y `/channel-backgrounds/` en el origen del sitio. Por
compatibilidad, la API también admite `GET` y `HEAD` sobre
`/channel-backgrounds/{filename}`. Prefiere siempre la URL devuelta por el
recurso.

## Leyenda de acceso

| Etiqueta | Requisito |
| --- | --- |
| Público | No requiere cabeceras de usuario. |
| Usuario opcional | Es público, pero un bearer token puede personalizar el resultado. |
| Usuario | Envía `Authorization: Bearer ACCESS_TOKEN`. |
| Actor de canal | Proporciona un ID de canal y bearer token para cambios de estado. |
| Admin | Requiere una cuenta admin; algunas operaciones también exigen una sesión bearer vigente. |
| Worker | Requiere credenciales de un worker registrado. |

## Salud, búsqueda y descubrimiento

| Método | Ruta | Acceso | Parámetros | Respuesta/comportamiento |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Público | Ninguno | `{ "status": "ok" }` |
| `GET` | `/search` | Público | `q` obligatorio; `page` por defecto `1` | Objeto con `results`, `total`, `page` y `per_page`. Los resultados pueden ser videos, canales, películas o series. |
| `GET` | `/search/suggest` | Público | `q`; `limit` por defecto `8`, máximo `12` | `{ "suggestions": [...] }`; puede incluir búsquedas previas y entidades del catálogo. |
| `GET` | `/categories` | Público | `limit`, `offset` | Lista pública de categorías. |
| `GET` | `/categories/all` | Público | Ninguno | Todas las categorías, incluidas las de interfaces administrativas. |
| `GET` | `/categories/{slug}/videos` | Público | `limit`, `offset` | Videos visibles y listos de la categoría. |
| `GET` | `/recommendations/home` | Usuario opcional | `limit`, `offset`; bearer token opcional | Recomendaciones generales o personalizadas. |

Los campos de un resultado dependen de `type`. Ejemplo:

```json
{
  "type": "video",
  "id": "VIDEO_ID",
  "title": "Título de ejemplo",
  "description": "...",
  "channel": "Canal de ejemplo",
  "channel_id": "CHANNEL_ID",
  "thumbnail": "/path/to/image.jpg",
  "views": 42,
  "verified": false
}
```

## Videos

### Lectura y reproducción

| Método | Ruta | Acceso | Parámetros | Respuesta/comportamiento |
| --- | --- | --- | --- | --- |
| `GET` | `/videos` | Público | `limit` por defecto `12`, máximo `100`; `offset` por defecto `0` | Arreglo de videos públicos y listos, del más reciente al más antiguo. |
| `GET` | `/videos/{id}` | Público | Ninguno | Detalle del video con canal y categorías. |
| `GET` | `/videos/{id}/related` | Público | `limit` | Videos relacionados ordenados por relevancia. |
| `GET` | `/videos/{id}/clips` | Público | Ninguno | Clips publicados derivados del video. |
| `POST` | `/videos/{id}/view` | Público | Sin cuerpo | Incrementa el contador de vistas. |
| `GET` | `/videos/{id}/stream/{filepath}` | Público | Ruta del archivo HLS | Devuelve playlist o segmento. Prefiere el `hls_path` de la API. |
| `GET` | `/videos/{id}/download` | Público | `quality` opcional | `200` si está listo o `202` mientras se prepara. |
| `GET` | `/videos/{id}/download-status` | Público | `quality` opcional | Estado de la descarga y `file_url` cuando está lista. |
| `GET` | `/downloads/{videoId}/{quality}` | Público | Ninguno | Sirve una descarga preparada. |
| `GET` | `/my-videos` | Usuario | `channel_id` obligatorio | Videos de uno de los canales del usuario. |

Un elemento de la lista contiene los datos del video y un canal anidado:

```json
{
  "id": "VIDEO_ID",
  "title": "Video de ejemplo",
  "description": "Descripción",
  "status": "ready",
  "views": 100,
  "likes": 12,
  "created_at": "2026-01-01T12:00:00Z",
  "hls_path": "/api/v1/videos/VIDEO_ID/stream/master.m3u8",
  "thumbnail_url": "/videos/VIDEO_ID/thumbnail.jpg",
  "has_custom_thumbnail": true,
  "explicit": false,
  "channel_id": "CHANNEL_ID",
  "width": 1920,
  "categories": [],
  "channel": {
    "id": "CHANNEL_ID",
    "user_id": "USER_ID",
    "name": "Canal de ejemplo",
    "description": "",
    "avatar_url": "/avatars/example.jpg",
    "verified": false
  }
}
```

Los clientes deben tolerar campos adicionales y campos opcionales ausentes.

### Likes, comentarios y clips

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `POST` | `/videos/{id}/like` | Actor de canal | Query: `channel_id` |
| `DELETE` | `/videos/{id}/like` | Actor de canal | Query: `channel_id` |
| `GET` | `/videos/{id}/liked` | Actor de canal | Query: `channel_id` |
| `GET` | `/videos/{id}/comments` | Público | `channel_id` opcional añade el estado de like del actor. |
| `POST` | `/videos/{id}/comments` | Actor de canal | Multipart: `channel_id`, `text`, `parent_comment_id` opcional. Máximo 500 caracteres. |
| `DELETE` | `/comments/{commentId}` | Actor de canal | Sin cuerpo. |
| `POST` | `/comments/{commentId}/like` | Actor de canal | Query: `channel_id` |
| `DELETE` | `/comments/{commentId}/like` | Actor de canal | Query: `channel_id` |
| `GET` | `/comments/{commentId}/liked` | Actor de canal | Query: `channel_id` |
| `POST` | `/videos/{id}/clips` | Usuario | JSON: `start_seconds`, `end_seconds`, `title` y `channel_id` opcionales. |

Crear un comentario principal:

```bash
curl --fail-with-body \
  -X POST \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  -F "channel_id=$GILTUBE_CHANNEL_ID" \
  -F "text=Excelente video" \
  "https://giltube.gilservers.com/api/v1/videos/$VIDEO_ID/comments"
```

### Progreso de reproducción

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `GET` | `/videos/{id}/progress` | Usuario | Sin cuerpo. |
| `PUT` | `/videos/{id}/progress` | Usuario | JSON: `position_seconds`, `duration_seconds`. |
| `GET` | `/watch-progress/videos` | Usuario | Query `ids`: IDs separados por comas, máximo 100. |
| `GET` | `/watch-progress/recent` | Usuario | Query `limit`. |
| `GET` | `/series/{id}/progress` | Usuario | Estado de reanudación/progreso de la serie. |
| `POST` | `/videos/{id}/intro-suggestions` | Usuario | JSON: `intro_start_seconds`, `intro_end_seconds`, `note` opcional. |

```bash
curl --fail-with-body \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  --data '{"position_seconds":125.5,"duration_seconds":600}' \
  "https://giltube.gilservers.com/api/v1/videos/$VIDEO_ID/progress"
```

### Carga y administración de videos

| Método | Ruta | Acceso | Tipo/comportamiento |
| --- | --- | --- | --- |
| `POST` | `/videos/upload-chunk` | Usuario | Carga multipart por fragmentos. |
| `POST` | `/videos/finalize-upload` | Usuario | Metadatos multipart; ensambla el archivo e inicia el procesamiento. |
| `POST` | `/videos` | Usuario | Carga multipart directa heredada. |
| `PUT` | `/videos/{id}` | Usuario | Actualiza un video propio. |
| `DELETE` | `/videos/{id}` | Usuario | Elimina un video propio. |
| `POST` | `/videos/{id}/re-encode` | Usuario | Inicia una recodificación. |

El flujo recomendado usa fragmentos de hasta 50 MiB. Envía cada fragmento a
`/videos/upload-chunk` con:

| Campo | Descripción |
| --- | --- |
| `chunk` | Fragmento binario. |
| `chunkIndex` | Índice del fragmento basado en cero. |
| `totalChunks` | Número total de fragmentos. |
| `uploadSessionId` | ID generado por el cliente y único para la carga. |
| `fileName` | Nombre original del archivo. |

Después llama a `/videos/finalize-upload` con:

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `uploadSessionId` | Sí | El mismo ID usado en todos los fragmentos. |
| `fileName` | Sí | El mismo nombre de archivo. |
| `title` | Sí | Título del video. |
| `description` | No | Descripción. |
| `channel_id` | Sí | Canal que publica. |
| `explicit` | No | `true` marca contenido explícito. |
| `hidden` | No | `true` lo oculta de feeds públicos. |
| `category_ids[]` | No | Repite el campo por cada categoría. |
| `thumbnail` | No | Imagen personalizada. |

### Subtítulos y audio alternativo

Estas rutas requieren ser propietario del video o admin.

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `GET` | `/videos/{id}/subtitles` | Usuario | Ninguna |
| `POST` | `/videos/{id}/subtitles` | Usuario | Subtítulo multipart y metadatos. |
| `PUT` | `/videos/{id}/subtitles/{trackId}` | Usuario | Archivo y/o metadatos multipart. |
| `DELETE` | `/videos/{id}/subtitles/{trackId}` | Usuario | Ninguna |
| `GET` | `/videos/{id}/audio` | Usuario | Ninguna |
| `POST` | `/videos/{id}/audio` | Usuario | Audio multipart y metadatos. |
| `PUT` | `/videos/{id}/audio/{trackId}` | Usuario | Archivo y/o metadatos multipart. |
| `GET` | `/videos/{id}/audio/{trackId}/download-wav` | Usuario | Descarga WAV. |
| `DELETE` | `/videos/{id}/audio/{trackId}` | Usuario | Ninguna |

Los metadatos son `label`, `language`, `default` y `delay_ms`. El archivo de
subtítulos usa la parte `subtitle`; el audio usa `audio`.

## Canales y usuarios

| Método | Ruta | Acceso | Entrada/respuesta |
| --- | --- | --- | --- |
| `POST` | `/users` | Público | JSON: `username`, `email`, `password`; devuelve el usuario sin contraseña. |
| `GET` | `/user/{userId}` | Público | Registro público del usuario. |
| `GET` | `/users/{userId}/channels` | Público | Canales y canal predeterminado del usuario. |
| `POST` | `/channels` | Usuario | Multipart: `name`, `description`, `avatar` y `background` opcionales. El token aporta `user_id`; el campo heredado solo se acepta si coincide. |
| `GET` | `/channels/{channelId}/info` | Público | Perfil y personalización del canal. |
| `GET` | `/channels/{channelId}/videos` | Público | Videos del canal. |
| `GET` | `/channels/{channelId}/clips` | Público | Clips del canal. |
| `GET` | `/channels/{channelId}/music` | Público | Artista y lanzamientos asociados. |
| `GET` | `/channels/{channelId}/analytics` | Actor de canal | Analíticas del canal. |
| `PUT` | `/channels/{channelId}` | Usuario | Actualización multipart del perfil. |
| `DELETE` | `/channels/{channelId}` | Usuario | Elimina un canal propio. |

Las actualizaciones aceptan `name`, `description`, `avatar`, `background`,
`remove_avatar`, `remove_background`, `background_position_x`,
`background_position_y`, `background_scale`, `custom_header_html`,
`custom_header_css`, `custom_content_html` y `custom_content_css`.

## Autenticación y cuenta

### Registro e inicio con contraseña

```bash
curl --fail-with-body \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"username":"developer","email":"developer@example.com","password":"elige-una-contraseña-segura"}' \
  https://giltube.gilservers.com/api/v1/users
```

```bash
curl --fail-with-body \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"email":"developer@example.com","password":"elige-una-contraseña-segura"}' \
  https://giltube.gilservers.com/api/v1/login
```

### Endpoints de cuenta

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `POST` | `/auth/token` | Público | JSON: `email`, `password`; devuelve un bearer token de 30 días. |
| `DELETE` | `/auth/token` | Usuario | Revoca el bearer token usado. |
| `POST` | `/login` | Público | JSON: `email`, `password`. |
| `POST` | `/oauth/gilid/start` | Público | JSON: `mode` (`login` o `link`), `return_to`. |
| `POST` | `/oauth/gilid/callback` | Público | JSON: `code` y `state` de autorización. |
| `GET` | `/account/me` | Usuario | Perfil de la cuenta actual. |
| `PUT` | `/account/default-channel` | Usuario | JSON: `channel_id`. |
| `PUT` | `/account/music-quality` | Usuario | JSON `quality`: `auto`, `low`, `medium`, `high` o `maximum`. |
| `PUT` | `/account/playback-languages` | Usuario | JSON: `audio_language`, `caption_language`. |
| `PUT` | `/account/email` | Usuario | JSON: `email`, `current_password`. |
| `PUT` | `/account/password` | Usuario | JSON: `current_password`, `new_password`. |
| `DELETE` | `/account` | Usuario | JSON: `current_password`; puede ser vacío en cuentas vinculadas a GILid, pero el objeto JSON sigue siendo obligatorio. |

La autorización GILid es un flujo de redirección del navegador. Abre la
`authorize_url` devuelta; no recolectes credenciales de GILid en tu aplicación.

### Passkeys

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `GET` | `/passkeys` | Usuario | Lista las passkeys registradas. |
| `POST` | `/passkeys/register/begin` | Usuario | JSON: `name` opcional; devuelve opciones WebAuthn y `session_token` de corta duración. |
| `POST` | `/passkeys/register/finish` | Usuario | Query: `session_token`; cuerpo: credencial WebAuthn serializada. |
| `POST` | `/passkeys/login/begin` | Público | JSON vacío; devuelve opciones WebAuthn y `session_token` de corta duración. |
| `POST` | `/passkeys/login/finish` | Público | Query: `session_token`; credencial WebAuthn serializada; devuelve sesión. |
| `DELETE` | `/passkeys/{id}` | Usuario | Elimina una passkey propia. |

El token temporal del flujo de passkey no es el bearer token devuelto tras un
inicio de sesión correcto.

## Suscripciones

Las suscripciones relacionan un canal con otro.

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `GET` | `/channels/{channelId}/subscription` | Usuario opcional | Sin usuario devuelve el total y `subscribed: false`; `subscriber_channel_id` opcional usa por defecto el canal principal. |
| `POST` | `/channels/{channelId}/subscription` | Usuario | JSON: `subscriber_channel_id` opcional. |
| `DELETE` | `/channels/{channelId}/subscription` | Usuario | Query `subscriber_channel_id` opcional. |
| `GET` | `/subscriptions` | Usuario | Query `subscriber_channel_id` opcional. |
| `GET` | `/subscriptions/feed` | Usuario | `subscriber_channel_id` opcional; `limit` por canal entre 1 y 24. |

```json
{
  "subscribed": true,
  "subscriber_count": 128
}
```

## Listas de reproducción

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `GET` | `/playlists` | Público/usuario opcional | Exactamente uno de `user_id` o `channel_id`; `page` opcional. La identidad revela listas privadas propias. |
| `GET` | `/playlists/{id}` | Público/usuario opcional | Lista pública/no listada; una lista privada requiere ser propietario. |
| `POST` | `/playlists` | Usuario | JSON: `title`, `description`, `visibility`, `channel_id` opcional. |
| `PUT` | `/playlists/{id}` | Usuario | JSON: `title`, `description`, `visibility`. |
| `DELETE` | `/playlists/{id}` | Usuario | Ninguna |
| `POST` | `/playlists/{id}/videos` | Usuario | JSON: `video_id`. |
| `DELETE` | `/playlists/{id}/videos/{videoId}` | Usuario | Ninguna |
| `PUT` | `/playlists/{id}/videos/reorder` | Usuario | JSON: `videos`, arreglo de `{ "video_id": "...", "position": number }`. |

Los valores válidos de `visibility` son `public`, `private` y `unlisted`.

## Películas, series y música

### Películas y series

| Método | Ruta | Acceso | Respuesta |
| --- | --- | --- | --- |
| `GET` | `/movies` | Público | Catálogo de películas publicadas. |
| `GET` | `/movies/{id}` | Público | Detalle de película. |
| `GET` | `/movie-videos/{videoId}` | Público | Contexto de película para un video principal. |
| `GET` | `/movie-trailers/{videoId}` | Público | Contexto de película para un tráiler. |
| `GET` | `/series` | Público | Catálogo de series publicadas. |
| `GET` | `/series/{id}` | Público | Detalle y episodios. |
| `GET` | `/series-episodes/{videoId}` | Público | Contexto de serie/episodio para un video. |
| `GET` | `/series-trailers/{videoId}` | Público | Contexto de serie para un tráiler. |

### Música

| Método | Ruta | Acceso | Respuesta/comportamiento |
| --- | --- | --- | --- |
| `GET` | `/music` | Público | Artistas y lanzamientos publicados. |
| `GET` | `/music/artists/{slug}` | Público | Artista y lanzamientos. |
| `GET` | `/music/releases/{slug}` | Público | Lanzamiento y pistas. |
| `GET` | `/music/tracks/{slug}` | Público | Metadatos de pista. |
| `GET`, `HEAD` | `/music/audio/{trackId}/{quality}` | Público | Transmite la calidad codificada seleccionada. |
| `GET` | `/music-videos/{videoId}` | Público | Contexto musical de un video oficial. |

Usa las URL y calidades devueltas por la pista; no supongas que existe una
calidad determinada.

## Transmisiones en vivo y chat

### Endpoints públicos

| Método | Ruta | Acceso | Entrada/respuesta |
| --- | --- | --- | --- |
| `GET` | `/live/active` | Público | Transmisiones activas. |
| `GET` | `/live/channels/{channelId}` | Público | Estado en vivo actual del canal. |
| `GET` | `/live/channels/{channelId}/chat` | Público | `limit` opcional; mensajes recientes. |
| `POST` | `/live/channels/{channelId}/chat` | Usuario | JSON: `channel_id` del actor y `message` (máximo 500 caracteres). |
| `POST` | `/live/{videoId}/presence` | Público | Registra presencia. |
| `DELETE` | `/live/{videoId}/presence` | Público | Retira la presencia. |
| `GET` | `/live/{videoId}/presence/stream` | Público | Eventos enviados por el servidor para presencia. |

El estado puede incluir `status`, `is_live`, `started_at`, `ended_at`,
`playback_url`, `thumbnail_url`, `watching_now`, `dvr_enabled` y `channel`. Para
el propietario también puede incluir credenciales de ingestión.

### Endpoints del propietario del canal

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `GET` | `/live/me` | Usuario | Query: `channel_id`. |
| `PUT` | `/live/me/settings` | Usuario | JSON: `channel_id`, `title`, `description`, `dvr_enabled` opcional. |
| `POST` | `/live/me/key/rotate` | Usuario | JSON: `channel_id`. Trata la stream key como secreto. |
| `POST` | `/live/me/start` | Usuario | JSON: `channel_id`, `title`, `description`, `dvr_enabled` opcional. |
| `POST` | `/live/me/stop` | Usuario | JSON: `channel_id`. |
| `POST` | `/live/me/publisher-presence` | Usuario | JSON: `channel_id`, `enabled`. |
| `POST` | `/live/me/whip` | Usuario | Solicitud proxy WHIP. |
| `DELETE` | `/live/me/whip/session` | Usuario | Termina la sesión WHIP. |

## Watch parties

| Método | Ruta | Acceso | Entrada |
| --- | --- | --- | --- |
| `GET` | `/watch-parties/public` | Público | Lista las parties públicas. |
| `GET` | `/watch-parties/{id}` | Público | Estado, participantes, chat, reproducción y cola. |
| `GET` | `/watch-parties/saved-progress` | Usuario | Query: `media_type` (`movie` o `series`), `media_id`. |
| `POST` | `/watch-parties` | Usuario | Crea una party; cuerpo descrito abajo. |
| `POST` | `/watch-parties/{id}/join` | Usuario | JSON: `channel_id` opcional. |
| `POST` | `/watch-parties/{id}/leave` | Usuario | Ninguna |
| `POST` | `/watch-parties/{id}/save-progress` | Usuario | Ninguna |
| `POST` | `/watch-parties/{id}/transfer-host` | Usuario | JSON: `user_id`. |
| `PUT` | `/watch-parties/{id}/suggest-permission` | Usuario | JSON: `user_id`, `can_suggest`. |
| `PUT` | `/watch-parties/{id}/sync-mode` | Usuario | JSON `mode`: `host-only` u `open`. |
| `GET` | `/watch-parties/{id}/events` | Usuario | SSE. Query `user_id` admitido para `EventSource`. |
| `POST` | `/watch-parties/{id}/chat` | Usuario | JSON: `message`, `gif_url`, `reaction`, `channel_id`, todos opcionales según el tipo. |
| `POST` | `/watch-parties/{id}/playback` | Usuario | JSON: `action`, `current_time`, `channel_id` opcional. |
| `POST` | `/watch-parties/{id}/queue` | Usuario | JSON: `video_id`. |
| `PUT` | `/watch-parties/{id}/queue/reorder` | Usuario | JSON: `item_ids`. |
| `POST` | `/watch-parties/{id}/queue/{itemId}/play` | Usuario | Ninguna |
| `DELETE` | `/watch-parties/{id}/queue/{itemId}` | Usuario | Ninguna |

Cuerpo para crear una party:

```json
{
  "video_id": "VIDEO_ID",
  "visibility": "public",
  "title": "Watch party del viernes",
  "channel_id": "CHANNEL_ID",
  "party_type": "queue",
  "media_type": "movie",
  "media_id": "MOVIE_ID",
  "queue_video_ids": ["VIDEO_ID"],
  "start_time_seconds": 0
}
```

## Notificaciones y push

Todas estas rutas requieren identidad del usuario.

| Método | Ruta | Entrada/respuesta |
| --- | --- | --- |
| `GET` | `/notifications` | Query: `limit`, `offset`, `unread_only` opcional; devuelve `items`, `limit`, `offset`. |
| `GET` | `/notifications/unread-count` | `{ "unread_count": number }` |
| `PATCH` | `/notifications/{id}/read` | JSON: `is_read`. |
| `POST` | `/notifications/read-all` | Marca todas como leídas. |
| `GET` | `/notifications/push/config` | Disponibilidad push y clave pública VAPID. |
| `POST` | `/notifications/push/subscribe` | Suscripción Push API: `endpoint`, `keys.p256dh`, `keys.auth`. |
| `POST` | `/notifications/push/unsubscribe` | JSON: `endpoint`. |

Los tipos actuales incluyen `comment_video`, `reply_comment`, `like_video`,
`like_comment` y `live_started`.

## Integración publicitaria

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/ads/serve` | Público | Solicita un anuncio para una ubicación compatible de GilAds. |
| `POST` | `/ads/events` | Público | Reporta una entrega o interacción publicitaria. |

Los payloads siguen el contrato actual de GilAds. Las ubicaciones desconocidas
se normalizan a una compatible o se rechazan.

## API administrativa

Las rutas bajo `/admin` requieren un usuario admin. El registro, la
planificación y las versiones de workers también validan la sesión bearer. Son
interfaces operativas, no un contrato estable para terceros.

| Área | Endpoints |
| --- | --- |
| Resumen | `GET /admin/stats`, `GET /admin/users`, `GET /admin/channels`, `GET /admin/videos`, `GET /admin/channels/{id}/videos` |
| Moderación de usuarios | `POST /admin/users/{id}/toggle-admin`, `suspend`, `ban`, `unban`, `unsuspend`; `DELETE /admin/users/{id}` |
| Moderación de canales | `POST /admin/channels/{id}/suspend`, `ban`, `unban`, `unsuspend` |
| Moderación de videos | `PUT /admin/videos/{id}/verify` |
| Metadatos | `GET /admin/metadata/search`, `GET /admin/metadata/details` |
| Música | `/admin/music/overview`, `/admin/music/artists`, `/admin/music/releases`, `/admin/music/tracks` y acciones de carga, publicación, portada, letras y asociación de videos |
| Series | `/admin/series`, orden y metadatos de episodios, subtítulos y audio |
| Películas | `/admin/movies`, asignación de tráiler/video, subtítulos y audio |
| Revisión de intros | `GET /admin/intro-suggestions` y acciones de aprobar/rechazar por ID |
| Espejos de YouTube | `/admin/youtube-mirrors/channels` y `/admin/youtube-mirrors/import` |
| Ingestión | `/admin/media-ingests` y acciones de carga, reintento, pausa, vista previa, importación, adjuntos y limpieza |
| Transcodificación | `/admin/transcode-jobs` y acciones de inicio, reinicio, pausa y cancelación |
| Workers | `/admin/workers`, versiones, códigos de registro, habilitación/revocación, planificación y eliminación |

Desarrolla clientes administrativos junto con la versión del backend objetivo.

## API de workers e internas

Lo siguiente queda fuera del contrato público para desarrolladores:

- `/workers/*`: protocolo remoto de codificación.
- `/worker-releases/*`: distribución de versiones.
- `/internal/gilid/account`: integración confiable con GILid.

Los workers usan secretos de registro y credenciales de leases/jobs, no una
sesión normal de usuario. La documentación de despliegue y registro se mantiene
en el repositorio privado del backend. Nunca expongas en el navegador
credenciales de workers, el token interno de GILid, stream keys ni bearer tokens
administrativos.

## Recomendaciones de compatibilidad

- Ignora propiedades JSON desconocidas para admitir respuestas ampliadas.
- No dependas del orden de un arreglo salvo que el endpoint lo documente.
- No construyas rutas multimedia; usa las URL devueltas por la API.
- Usa reintentos limitados con backoff exponencial para `429`, `502`, `503`,
  `504` y fallos de red idempotentes.
- No reintentes automáticamente un `POST` no idempotente salvo que puedas
  demostrar que la solicitud original no fue aceptada.
- Consulta estados asíncronos de carga/descarga con una pausa entre solicitudes.
- Mantén bearer tokens, stream keys, secretos de workers y tokens WebAuthn fuera
  de logs y URL.

## Fuente de verdad

Esta guía documenta las rutas y contratos del backend de GilTube. Si una
operación administrativa o de worker cambia según el despliegue, la versión
disponible en `https://giltube.gilservers.com/api/v1` es la autoridad.
