# GilTube API

Developer reference for the public GilTube HTTP API.

> Documentación en español: [API-es.md](./API-es.md)

## Contents

- [Base URL](#base-url)
- [Quick start](#quick-start)
- [Do I need a token?](#do-i-need-a-token)
- [Get a developer token](#get-a-developer-token)
- [Conventions](#conventions)
- [Health, search, and discovery](#health-search-and-discovery)
- [Videos](#videos)
- [Channels and users](#channels-and-users)
- [Authentication and account](#authentication-and-account)
- [Subscriptions](#subscriptions)
- [Playlists](#playlists)
- [Movies, series, and music](#movies-series-and-music)
- [Live streaming and chat](#live-streaming-and-chat)
- [Watch parties](#watch-parties)
- [Notifications and push](#notifications-and-push)
- [Advertising integration](#advertising-integration)
- [Admin API](#admin-api)
- [Worker and internal APIs](#worker-and-internal-apis)
- [Compatibility guidance](#compatibility-guidance)

## Base URL

All API endpoints in this document are relative to:

```text
https://giltube.gilservers.com/api/v1
```

Media URLs returned by the API can also be rooted at the site origin:

```text
https://giltube.gilservers.com
```

Use HTTPS for every request. Paths and field names are case-sensitive.

## Quick start

Check service health:

```bash
curl --fail-with-body \
  https://giltube.gilservers.com/api/v1/health
```

```json
{
  "status": "ok"
}
```

List the newest public videos:

```bash
curl --fail-with-body \
  "https://giltube.gilservers.com/api/v1/videos?limit=12&offset=0"
```

Search the catalog:

```bash
curl --fail-with-body --get \
  --data-urlencode "q=music video" \
  --data-urlencode "page=1" \
  https://giltube.gilservers.com/api/v1/search
```

Browser JavaScript:

```js
const apiBaseUrl = 'https://giltube.gilservers.com/api/v1'

const response = await fetch(`${apiBaseUrl}/videos?limit=12&offset=0`)
if (!response.ok) {
  throw new Error(`GilTube request failed: ${response.status}`)
}

const videos = await response.json()
```

## Do I need a token?

Not for public data. Catalog, search, video playback, public channel, movie,
series, music, and live-status endpoints can be read anonymously.

A token is needed when an application acts for a user: account settings,
private playlists, watch progress, subscriptions, notifications, publishing,
live management, and watch-party participation. Those endpoints are marked
**User** in the tables below.

## Get a developer token

For a password-based GilTube account, exchange the email and password once:

```bash
curl --fail-with-body \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"email":"developer@example.com","password":"your-password"}' \
  https://giltube.gilservers.com/api/v1/auth/token
```

Response:

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

The token lasts 30 days. Store it like a password and send it as a bearer token:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  https://giltube.gilservers.com/api/v1/account/me
```

Revoke the token when it is no longer needed:

```bash
curl --fail-with-body \
  -X DELETE \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  https://giltube.gilservers.com/api/v1/auth/token
```

The token is shown only in the creation response. Calling `/auth/token` again
creates a new independent token; it does not invalidate older tokens.

GILid-managed accounts cannot exchange a GilTube password. They receive a
bearer-compatible `session_token` from the GILid callback flow instead.

## Conventions

### Request and response formats

- JSON endpoints use `Content-Type: application/json`.
- File and image endpoints use `multipart/form-data`.
- JSON property names use `snake_case`.
- IDs are opaque strings, normally UUIDs. Do not parse or construct them.
- Timestamps are JSON strings in ISO 8601/RFC 3339 form.
- Successful list endpoints return either an array or an object containing the
  array. The exact shape is listed below.
- Empty collections are returned as `[]` where the endpoint guarantees a list.

### Authentication and user identity

Password, GILid, and passkey login responses can return:

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

For user-scoped requests, send the token:

```http
Authorization: Bearer gts_...
```

Example:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  https://giltube.gilservers.com/api/v1/account/me
```

The API validates the bearer token and derives the user ID from it. Do not put
an access token in a URL. Sensitive admin worker operations also require a
current bearer session.

A malformed, expired, or revoked bearer token is rejected with `401`, even on
endpoints that also work anonymously. A banned account receives `403`. If a
request sends both a bearer token and an `X-User-ID` header or `user_id` query
parameter, the IDs must match or the request is rejected with `403`.

Older first-party clients can still send `X-User-ID` or a `user_id` query
parameter without a bearer token. This is a temporary compatibility mechanism,
not delegated OAuth authorization. New integrations should use bearer tokens;
a backend integration must never use `X-User-ID` alone as proof that an
untrusted caller owns an account.

Many social actions are performed as a channel. Those requests use a
`channel_id` or `subscriber_channel_id` in addition to the owning user headers.
The channel must belong to the current user where ownership is enforced.

### Errors

Most JSON errors have this shape:

```json
{
  "error": "human-readable error"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `200` | Successful read or update. |
| `201` | Resource created. |
| `202` | Asynchronous work accepted or still processing. |
| `204` | Successful response with no body, when used. |
| `400` | Invalid parameters, body, or upload. |
| `401` | User identity or required session is missing. |
| `403` | The user or channel does not have access. |
| `404` | Resource not found. |
| `409` | The request conflicts with existing state. |
| `500` | Server-side failure. |

Do not branch on error-message text. Use the HTTP status and treat additional
response fields as diagnostic information.

### Pagination

Pagination is endpoint-specific:

- Video and category feeds use `limit` plus zero-based `offset`.
- Search uses one-based `page` and returns `per_page` and `total`.
- Playlists use one-based `page` and currently return 20 items per page.
- Notifications use `limit` plus zero-based `offset`.

Clients should tolerate a server-side maximum lower than the requested limit.

### Media URLs

Fields such as `thumbnail_url`, `avatar_url`, `hls_path`, `playback_url`, and
`file_url` may be absolute or root-relative. Resolve a relative value against
`https://giltube.gilservers.com`, not against the API path.

```js
const siteOrigin = 'https://giltube.gilservers.com'
const mediaUrl = new URL(video.thumbnail_url, siteOrigin).toString()
```

Static media is served from root-level `/avatars/`, `/videos/`, `/downloads/`,
`/music-assets/`, and `/channel-backgrounds/` paths on the site origin. The API
also exposes `GET` and `HEAD` on `/channel-backgrounds/{filename}` below the API
base for compatibility. Prefer the URL supplied in the resource response.

Uploaded images (thumbnails, avatars, backgrounds, live thumbnails) are limited
to 16 MiB and 32 megapixels. The server stores them as several resized JPEG
variants and returns the URL of the default variant; video thumbnails, for
example, are generated at 320×180, 640×360, and 1280×720 and the API returns the
640×360 one. Do not derive sibling variant file names from a returned URL.

## Access legend

Endpoint tables use these access labels:

| Label | Requirement |
| --- | --- |
| Public | No user headers required. |
| Optional user | Public, but an optional bearer token may personalize the result. |
| User | Send `Authorization: Bearer ACCESS_TOKEN`. |
| Channel actor | Supply a channel ID; send a bearer token for state-changing calls. |
| Admin | Admin account required; some operations also require a current bearer session. |
| Worker | Enrolled worker credentials required. |

## Health, search, and discovery

| Method | Path | Access | Parameters | Response/behavior |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Public | None | `{ "status": "ok" }` |
| `GET` | `/search` | Public | `q` required; `page` defaults to `1` | Object with `results`, `total`, `page`, and `per_page`. Results can be videos, channels, movies, or series. |
| `GET` | `/search/suggest` | Public | `q`; `limit` defaults to `8`, maximum `12` | `{ "suggestions": [...] }`; can include prior search terms and catalog entities. |
| `GET` | `/categories` | Public | `limit`, `offset` | Public category list. |
| `GET` | `/categories/all` | Public | None | All categories, including categories used by management interfaces. |
| `GET` | `/categories/{slug}/videos` | Public | `limit`, `offset` | Ready, visible videos in the category. |
| `GET` | `/recommendations/home` | Optional user | `limit`, `offset`; optional bearer token | Personalized or general home recommendations. |
| `GET` | `/featured` | Public | None | `{ "items": [...] }`: up to five enabled featured items ordered by `position`. |

A featured item has `id`, `content_type` (`video`, `live`, `movie`, or
`series`), `content_id`, `header`, `description`, `action_text`, `position`,
`title`, `image_url`, `channel_id`, `channel_name`, `target_url`, `is_live`,
`scheduled_for`, `created_at`, and `updated_at`.

Search result fields vary by `type`. Common fields include:

```json
{
  "type": "video",
  "id": "VIDEO_ID",
  "title": "Example title",
  "description": "...",
  "channel": "Example channel",
  "channel_id": "CHANNEL_ID",
  "thumbnail": "/path/to/image.jpg",
  "views": 42,
  "verified": false
}
```

## Videos

### Reading and playback

| Method | Path | Access | Parameters | Response/behavior |
| --- | --- | --- | --- | --- |
| `GET` | `/videos` | Public | `limit` defaults to `12`, maximum `100`; `offset` defaults to `0` | Array of ready, visible videos ordered newest first. |
| `GET` | `/videos/{id}` | Public | None | Video detail with channel and category information. |
| `GET` | `/videos/{id}/related` | Public | `limit` | Ranked related videos. |
| `GET` | `/videos/{id}/clips` | Public | None | Published clips derived from the video. |
| `POST` | `/videos/{id}/view` | Public | No body | Increments the view counter. |
| `GET` | `/videos/{id}/stream/{filepath}` | Public | HLS file path | Returns a playlist or media segment. Use the `hls_path` returned by the API when possible. |
| `GET` | `/videos/{id}/download` | Public | Optional `quality` | Returns `200` when ready or `202` while a downloadable file is prepared. |
| `GET` | `/videos/{id}/download-status` | Public | Optional `quality` | Download preparation status and `file_url` when ready. |
| `GET` | `/downloads/{videoId}/{quality}` | Public | None | Serves a prepared download. |
| `GET` | `/my-videos` | User | `channel_id` required | Videos owned by one of the user's channels. |

A list item contains the video fields and a nested channel:

```json
{
  "id": "VIDEO_ID",
  "title": "Example video",
  "description": "Description",
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
    "name": "Example channel",
    "description": "",
    "avatar_url": "/avatars/example.jpg",
    "verified": false
  }
}
```

Clients must tolerate additional fields and absent optional fields.

### Likes, comments, and clips

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `POST` | `/videos/{id}/like` | Channel actor | Query: `channel_id` |
| `DELETE` | `/videos/{id}/like` | Channel actor | Query: `channel_id` |
| `GET` | `/videos/{id}/liked` | Channel actor | Query: `channel_id` |
| `GET` | `/videos/{id}/comments` | Public | Optional query `channel_id` adds actor-specific like state. |
| `POST` | `/videos/{id}/comments` | Channel actor | Multipart: `channel_id`, `text`, optional `parent_comment_id`. Text maximum: 500 characters. |
| `DELETE` | `/comments/{commentId}` | Channel actor | No body. |
| `POST` | `/comments/{commentId}/like` | Channel actor | Query: `channel_id` |
| `DELETE` | `/comments/{commentId}/like` | Channel actor | Query: `channel_id` |
| `GET` | `/comments/{commentId}/liked` | Channel actor | Query: `channel_id` |
| `POST` | `/videos/{id}/clips` | User | JSON: `start_seconds`, `end_seconds`, optional `title`, optional `channel_id`. |

Create a top-level comment:

```bash
curl --fail-with-body \
  -X POST \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  -F "channel_id=$GILTUBE_CHANNEL_ID" \
  -F "text=Great video" \
  "https://giltube.gilservers.com/api/v1/videos/$VIDEO_ID/comments"
```

### Watch progress

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `GET` | `/videos/{id}/progress` | User | No body. |
| `PUT` | `/videos/{id}/progress` | User | JSON: `position_seconds`, `duration_seconds`. |
| `GET` | `/watch-progress/videos` | User | Query `ids`: comma-separated video IDs, maximum 100. |
| `GET` | `/watch-progress/recent` | User | Query `limit`. |
| `GET` | `/series/{id}/progress` | User | Series resume/progress state. |
| `POST` | `/videos/{id}/intro-suggestions` | User | JSON: `intro_start_seconds`, `intro_end_seconds`, optional `note`. |

```bash
curl --fail-with-body \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GILTUBE_ACCESS_TOKEN" \
  --data '{"position_seconds":125.5,"duration_seconds":600}' \
  "https://giltube.gilservers.com/api/v1/videos/$VIDEO_ID/progress"
```

### Uploading and managing videos

| Method | Path | Access | Content type/behavior |
| --- | --- | --- | --- |
| `POST` | `/videos/upload-chunk` | User | Multipart chunk upload. |
| `POST` | `/videos/finalize-upload` | User | Multipart metadata; assembles an uploaded file and starts processing. |
| `POST` | `/videos` | User | Legacy direct multipart upload. |
| `PUT` | `/videos/{id}` | User | Updates an owned video. |
| `DELETE` | `/videos/{id}` | User | Deletes an owned video. |
| `POST` | `/videos/{id}/re-encode` | User | Starts re-encoding. |

The recommended upload flow uses chunks of at most 50 MiB. Send every chunk to
`/videos/upload-chunk` with these multipart fields:

| Field | Description |
| --- | --- |
| `chunk` | Binary slice. |
| `chunkIndex` | Zero-based chunk index. |
| `totalChunks` | Total number of chunks. |
| `uploadSessionId` | Client-generated ID unique to this upload. |
| `fileName` | Original file name. |

After all chunks succeed, call `/videos/finalize-upload` with:

| Field | Required | Description |
| --- | --- | --- |
| `uploadSessionId` | Yes | Same ID used for every chunk. |
| `fileName` | Yes | Same original file name. |
| `title` | Yes | Video title. |
| `description` | No | Video description. |
| `channel_id` | Yes | Publishing channel. |
| `explicit` | No | `true` marks explicit content. |
| `hidden` | No | `true` hides the video from public feeds. |
| `category_ids[]` | No | Repeat for each category ID. |
| `thumbnail` | No | Custom image file. |

### Subtitle and alternate-audio management

These routes require ownership of the video or admin access.

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `GET` | `/videos/{id}/subtitles` | User | None |
| `POST` | `/videos/{id}/subtitles` | User | Multipart subtitle plus metadata. |
| `PUT` | `/videos/{id}/subtitles/{trackId}` | User | Multipart file and/or metadata. |
| `DELETE` | `/videos/{id}/subtitles/{trackId}` | User | None |
| `GET` | `/videos/{id}/audio` | User | None |
| `POST` | `/videos/{id}/audio` | User | Multipart audio plus metadata. |
| `PUT` | `/videos/{id}/audio/{trackId}` | User | Multipart file and/or metadata. |
| `GET` | `/videos/{id}/audio/{trackId}/download-wav` | User | WAV download. |
| `DELETE` | `/videos/{id}/audio/{trackId}` | User | None |

Track metadata fields are `label`, `language`, `default`, and `delay_ms`.
Subtitle files use the `subtitle` part; audio files use the `audio` part.

## Channels and users

| Method | Path | Access | Input/response |
| --- | --- | --- | --- |
| `POST` | `/users` | Public | JSON: `username`, `email`, `password`; returns the created user without a password. |
| `GET` | `/user/{userId}` | Public | Public user record. |
| `GET` | `/users/{userId}/channels` | Public | User channels and default-channel information. |
| `POST` | `/channels` | User | Multipart: `name`, `description`, optional `avatar`, optional `background`. The token supplies `user_id`; the legacy field remains accepted only when it matches. |
| `GET` | `/channels/{channelId}/info` | Public | Channel profile and customization fields. |
| `GET` | `/channels/{channelId}/videos` | Public | Channel videos. |
| `GET` | `/channels/{channelId}/clips` | Public | Channel clips. |
| `GET` | `/channels/{channelId}/music` | Public | Published artist and releases associated with the channel. |
| `GET` | `/channels/{channelId}/analytics` | Public | Channel analytics. |
| `PUT` | `/channels/{channelId}` | User | Multipart profile/customization update. |
| `DELETE` | `/channels/{channelId}` | User | Deletes an owned channel. |
| `GET` | `/channels/{channelId}/block` | User | Query: `blocker_channel_id` (an owned channel). Returns `{ "blocked": bool }`. |
| `POST` | `/channels/{channelId}/block` | User | `blocker_channel_id` as a query parameter or JSON field. Returns `{ "blocked": true }`. |
| `DELETE` | `/channels/{channelId}/block` | User | `blocker_channel_id` as a query parameter or JSON field. Returns `{ "blocked": false }`. |

Channel updates accept `name`, `description`, `avatar`, `background`,
`remove_avatar`, `remove_background`, `background_position_x`,
`background_position_y`, `background_scale`, `custom_header_html`,
`custom_header_css`, `custom_content_html`, and `custom_content_css`.

Blocks are channel-to-channel. A blocked channel cannot comment on the blocking
channel's videos (`403`), and its existing and future notifications to the
blocking channel's owner are suppressed. A channel cannot block itself.

## Authentication and account

### Password registration and login

```bash
curl --fail-with-body \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"username":"developer","email":"developer@example.com","password":"choose-a-strong-password"}' \
  https://giltube.gilservers.com/api/v1/users
```

```bash
curl --fail-with-body \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"email":"developer@example.com","password":"choose-a-strong-password"}' \
  https://giltube.gilservers.com/api/v1/login
```

### Account endpoints

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `POST` | `/auth/token` | Public | JSON: `email`, `password`; returns a 30-day bearer access token. |
| `DELETE` | `/auth/token` | User | Revokes the bearer token used for the request. |
| `POST` | `/login` | Public | JSON: `email`, `password`. |
| `POST` | `/oauth/gilid/start` | Public | JSON: `mode` (`login` or `link`), `return_to`, optional `client` (`web` or `mobile`); mobile clients also send `app_redirect_uri` and a PKCE `code_challenge`. |
| `POST` | `/oauth/gilid/callback` | Public | JSON: authorization `code` and `state`. |
| `POST` | `/oauth/gilid/mobile/exchange` | Public | JSON: one-time handoff `code`, PKCE `code_verifier`; returns a login response with `session_token`. |
| `GET` | `/account/me` | User | Current account profile. |
| `PUT` | `/account/default-channel` | User | JSON: `channel_id`. |
| `PUT` | `/account/music-quality` | User | JSON `quality`: `auto`, `low`, `medium`, `high`, or `maximum`. |
| `PUT` | `/account/playback-languages` | User | JSON: `audio_language`, `caption_language`. |
| `PUT` | `/account/email` | User | JSON: `email`, `current_password`. |
| `PUT` | `/account/password` | User | JSON: `current_password`, `new_password`. |
| `DELETE` | `/account` | User | JSON body: `current_password`; the field may be empty for GILid-linked accounts, but a JSON object is still required. |

GILid authorization is a browser redirect flow. Open the returned
`authorize_url`; do not attempt to collect GILid credentials in your app.

For the GilTube mobile app, start with `client: "mobile"`, the registered
`app_redirect_uri` (`giltube://auth/callback`), and an S256 PKCE
`code_challenge`. The callback then returns `app_redirect_url` instead of a
session; it carries a one-time `code` valid for five minutes, which the app
exchanges at `/oauth/gilid/mobile/exchange` with the matching `code_verifier`.

### Passkeys

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `GET` | `/passkeys` | User | Lists the user's registered passkeys. |
| `POST` | `/passkeys/register/begin` | User | JSON: optional passkey `name`; returns WebAuthn options and a short-lived `session_token`. |
| `POST` | `/passkeys/register/finish` | User | Query: registration `session_token`; body: serialized WebAuthn credential. |
| `POST` | `/passkeys/login/begin` | Public | Empty JSON body; returns WebAuthn options and a short-lived `session_token`. |
| `POST` | `/passkeys/login/finish` | Public | Query: login `session_token`; body: serialized WebAuthn credential; returns a login response. |
| `DELETE` | `/passkeys/{id}` | User | Deletes an owned passkey. |

The passkey flow token is not the same as the bearer token returned after a
successful login.

## Subscriptions

Subscriptions are channel-to-channel relationships.

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `GET` | `/channels/{channelId}/subscription` | Optional user | Without user headers, returns the subscriber count and `subscribed: false`. With user headers, optional query `subscriber_channel_id` falls back to the user's default channel. |
| `POST` | `/channels/{channelId}/subscription` | User | JSON: optional `subscriber_channel_id`. |
| `DELETE` | `/channels/{channelId}/subscription` | User | Optional query `subscriber_channel_id`. |
| `GET` | `/subscriptions` | User | Optional query `subscriber_channel_id`. |
| `GET` | `/subscriptions/feed` | User | Optional `subscriber_channel_id`; `limit` is per subscribed channel, clamped to 1–24. |

Subscription state:

```json
{
  "subscribed": true,
  "subscriber_count": 128
}
```

## Playlists

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `GET` | `/playlists` | Public/optional user | Exactly one of `user_id` or `channel_id`; optional `page`. User headers reveal owned private playlists. |
| `GET` | `/playlists/{id}` | Public/optional user | Public/unlisted playlist; private playlists require owner identity. |
| `POST` | `/playlists` | User | JSON: `title`, `description`, `visibility`, optional `channel_id`. |
| `PUT` | `/playlists/{id}` | User | JSON: `title`, `description`, `visibility`. |
| `DELETE` | `/playlists/{id}` | User | None |
| `POST` | `/playlists/{id}/videos` | User | JSON: `video_id`. |
| `DELETE` | `/playlists/{id}/videos/{videoId}` | User | None |
| `PUT` | `/playlists/{id}/videos/reorder` | User | JSON: `videos`, an array of `{ "video_id": "...", "position": number }`. |

Valid visibility values are `public`, `private`, and `unlisted`.

## Movies, series, and music

### Movies and series

| Method | Path | Access | Response |
| --- | --- | --- | --- |
| `GET` | `/movies` | Public | Published movie catalog. |
| `GET` | `/movies/{id}` | Public | Movie detail. |
| `GET` | `/movie-videos/{videoId}` | Public | Movie context for a feature video. |
| `GET` | `/movie-trailers/{videoId}` | Public | Movie context for a trailer video. |
| `GET` | `/series` | Public | Published series catalog. |
| `GET` | `/series/{id}` | Public | Series detail and episodes. |
| `GET` | `/series-episodes/{videoId}` | Public | Series/episode context for a video. |
| `GET` | `/series-trailers/{videoId}` | Public | Series context for a trailer video. |

Movie and series detail responses can include `media_capabilities` with
`audio_languages`, `caption_languages`, `max_quality`, `hdr`, and `surround`.
`hdr` is `true` when the movie, or any episode of the series, has an HDR
rendition; `surround` is `true` when one has 5.1 or wider audio.

### Playback intro

A short branded intro clip can be played before movies and series episodes.

| Method | Path | Access | Response/behavior |
| --- | --- | --- | --- |
| `GET` | `/playback-intro` | Public | Optional query `video_id`. Returns `enabled`, `allow_skip`, `url`, `version`, `size`, `content_type`, `updated_at`, and `play`. |
| `GET`, `HEAD` | `/playback-intro/files/{filename}` | Public | Serves the intro video file. |

`play` is `true` only when an intro is enabled and uploaded and, if `video_id`
is supplied, that video is a movie or series episode (never a trailer or a
regular upload). The file name embeds a content hash, so the URL changes when
the intro is replaced and the file can be cached indefinitely. Honor
`allow_skip` when deciding whether to show a skip control.

### Music

| Method | Path | Access | Response/behavior |
| --- | --- | --- | --- |
| `GET` | `/music` | Public | Published artists and releases. |
| `GET` | `/music/artists/{slug}` | Public | Artist and releases. |
| `GET` | `/music/releases/{slug}` | Public | Release and tracks. |
| `GET` | `/music/tracks/{slug}` | Public | Track metadata. |
| `GET`, `HEAD` | `/music/audio/{trackId}/{quality}` | Public | Streams the selected encoded audio quality. |
| `GET` | `/music-videos/{videoId}` | Public | Music-track context for an official video. |

Use the audio URLs/quality fields returned by a track response instead of
guessing whether a particular quality exists.

## Live streaming and chat

### Public live endpoints

| Method | Path | Access | Input/response |
| --- | --- | --- | --- |
| `GET` | `/live/active` | Public | Active live streams. |
| `GET` | `/live/channels/{channelId}` | Public | Current channel live state. |
| `GET` | `/live/channels/{channelId}/chat` | Public | Optional `limit`; recent messages. |
| `POST` | `/live/channels/{channelId}/chat` | User | JSON: actor `channel_id`, `message` (maximum 500 characters). |
| `GET` | `/live/channels/{channelId}/poll` | Public | Optional query `channel_id` (actor) adds `selected_option_id`. Returns the channel's most recent poll, or `204` if it has none. |
| `POST` | `/live/channels/{channelId}/polls` | User | JSON: `channel_id` (must equal the path channel, owned by the user), `question` (maximum 120 characters), `options` (2–4 unique strings, maximum 80 characters each). Returns `201` with the poll `id`. |
| `POST` | `/live/channels/{channelId}/polls/{pollId}/vote` | User | JSON: actor `channel_id`, `option_id`. One vote per channel; returns `409` if the poll is closed or already voted. |
| `POST` | `/live/channels/{channelId}/polls/{pollId}/end` | User | JSON: `channel_id` (the live channel). Only the channel owner can end a poll. |
| `POST` | `/live/{videoId}/presence` | Public | Joins presence tracking. |
| `DELETE` | `/live/{videoId}/presence` | Public | Leaves presence tracking. |
| `GET` | `/live/{videoId}/presence/stream` | Public | Server-sent event stream for presence. |

Live state can include `id`, `status`, `is_live`, `started_at`,
`scheduled_for`, `ended_at`, `waiting_for_publisher`,
`adaptive_transcoding_enabled`, `playback_url`, `playback_url_fallback`,
`thumbnail_url`, and a nested `channel`. When adaptive transcoding is enabled
and its multi-quality playlist is healthy, `playback_url` points to it;
otherwise it is the direct stream, which is always available as
`playback_url_fallback`. Owner responses (`/live/me`) can
additionally contain `dvr_enabled`, `has_custom_thumbnail`, and ingest
credentials.

A poll has `id`, `question`, `status`, `total_votes`, `created_at`, `ended_at`,
`creator` (channel summary), and `options` (each with `id`, `text`, `votes`,
and `percentage`). Creating a poll ends the stream's previous active poll, and
active polls end when the stream stops.

### Channel-owner live endpoints

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `GET` | `/live/me` | User | Query: `channel_id`. |
| `PUT` | `/live/me/settings` | User | JSON: `channel_id`, `title`, `description`, optional `dvr_enabled`, `adaptive_transcoding_enabled`, `scheduled_for` (RFC 3339), and `clear_schedule`. |
| `POST` | `/live/me/thumbnail` | User | Multipart: `channel_id`, `thumbnail` image. Returns `thumbnail_url` and `has_custom_thumbnail: true`. |
| `DELETE` | `/live/me/thumbnail` | User | Query: `channel_id`. Removes the custom live thumbnail. |
| `POST` | `/live/me/key/rotate` | User | JSON: `channel_id`. Treat the returned stream key as a secret. |
| `POST` | `/live/me/start` | User | JSON: `channel_id`, `title`, `description`, optional `dvr_enabled` and `adaptive_transcoding_enabled`. |
| `POST` | `/live/me/stop` | User | JSON: `channel_id`. |
| `POST` | `/live/me/publisher-presence` | User | JSON: `channel_id`, `enabled`. |
| `POST` | `/live/me/whip` | User | WHIP proxy request. |
| `DELETE` | `/live/me/whip/session` | User | Ends the proxied WHIP session. |

`/live/me/start` does not always go live immediately. Its response includes
`armed`, `public_live`, and, when relevant, `scheduled_for` or
`waiting_for_publisher`: a stream with a future `scheduled_for` is armed for that
time, and a scheduled or publisher-gated stream waits until the encoder
connects.

## Watch parties

| Method | Path | Access | Input |
| --- | --- | --- | --- |
| `GET` | `/watch-parties/public` | Public | Lists public parties. |
| `GET` | `/watch-parties/{id}` | Public | Party state, participants, chat, playback, and queue. |
| `GET` | `/watch-parties/saved-progress` | User | Query: `media_type` (`movie` or `series`), `media_id`. |
| `GET` | `/watch-parties/active` | User | `{ "party": ... }` with the most recent active party the user participates in, or `{ "party": null }`. |
| `POST` | `/watch-parties` | User | Creates a party; body described below. |
| `POST` | `/watch-parties/{id}/join` | User | JSON: optional `channel_id`. |
| `POST` | `/watch-parties/{id}/invite` | User | Host only. JSON: `channel_id` to invite, optional `actor_channel_id`. Sends a `watch_party_invite` notification; returns `201` `{ "status": "invited" }` or `200` `{ "status": "already_invited" }`. |
| `POST` | `/watch-parties/{id}/leave` | User | None |
| `POST` | `/watch-parties/{id}/save-progress` | User | None |
| `POST` | `/watch-parties/{id}/transfer-host` | User | JSON: `user_id`. |
| `PUT` | `/watch-parties/{id}/suggest-permission` | User | JSON: `user_id`, `can_suggest`. |
| `PUT` | `/watch-parties/{id}/sync-mode` | User | JSON `mode`: `host-only` or `open`. |
| `GET` | `/watch-parties/{id}/events` | User | Server-sent events. Query `user_id` is supported for `EventSource`. |
| `POST` | `/watch-parties/{id}/chat` | User | JSON: optional `message`, `gif_url`, `reaction`, `channel_id`. |
| `POST` | `/watch-parties/{id}/playback` | User | JSON: `action`, `current_time`, optional `channel_id`. |
| `POST` | `/watch-parties/{id}/queue` | User | JSON: `video_id`. |
| `PUT` | `/watch-parties/{id}/queue/reorder` | User | JSON: `item_ids`. |
| `POST` | `/watch-parties/{id}/queue/{itemId}/play` | User | None |
| `DELETE` | `/watch-parties/{id}/queue/{itemId}` | User | None |

Create-party body:

```json
{
  "video_id": "VIDEO_ID",
  "visibility": "public",
  "title": "Friday watch party",
  "channel_id": "CHANNEL_ID",
  "party_type": "queue",
  "media_type": "movie",
  "media_id": "MOVIE_ID",
  "queue_video_ids": ["VIDEO_ID"],
  "start_time_seconds": 0
}
```

## Notifications and push

All notification routes require user headers.

| Method | Path | Input/response |
| --- | --- | --- |
| `GET` | `/notifications` | Query: `limit`, `offset`, optional `unread_only`; returns `items`, `limit`, and `offset`. |
| `GET` | `/notifications/unread-count` | `{ "unread_count": number }` |
| `PATCH` | `/notifications/{id}/read` | JSON: `is_read`. |
| `POST` | `/notifications/read-all` | Marks every notification read. |
| `GET` | `/notifications/push/config` | Push availability and VAPID public key. |
| `POST` | `/notifications/push/subscribe` | JSON Push API subscription: `endpoint`, `keys.p256dh`, `keys.auth`. |
| `POST` | `/notifications/push/unsubscribe` | JSON: `endpoint`. |
| `GET` | `/notifications/preferences` | `{ "preferences": { "<type>": bool, ... } }`; every type defaults to `true`. |
| `PUT` | `/notifications/preferences` | JSON: `type`, `enabled`. Returns the saved `type` and `enabled`. |
| `POST` | `/notifications/mobile/register` | JSON: device `token` (FCM), optional `platform` (`android`, the default, or `ios`), optional `device_name`. Returns `fcm_enabled`. |
| `DELETE` | `/notifications/mobile/unregister` | JSON: device `token`. |

Notification types currently include `comment_video`, `reply_comment`,
`like_video`, `like_comment`, `live_started`, `new_video`, `video_ready`,
`watch_party_invite`, `watch_party_host`, `new_subscriber`, and
`featured_content`.

## Advertising integration

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/ads/serve` | Public | Requests an ad for a supported GilAds placement. |
| `POST` | `/ads/events` | Public | Reports an ad delivery or interaction event. |

Ad request and event payloads follow the current GilAds integration contract.
Unknown placement names are normalized to a supported placement or rejected.

## Admin API

Routes under `/admin` require an admin user ID. Worker enrollment, scheduling,
role, and release-management endpoints additionally validate the bearer session.
These endpoints are operational interfaces and are not a stable third-party
integration contract.

The current admin surface is grouped as follows:

| Area | Endpoints |
| --- | --- |
| Overview | `GET /admin/stats`, `GET /admin/users`, `GET /admin/channels`, `GET /admin/videos`, `GET /admin/channels/{id}/videos` |
| User moderation | `POST /admin/users/{id}/toggle-admin`, `suspend`, `ban`, `unban`, `unsuspend`; `DELETE /admin/users/{id}` |
| Channel moderation | `POST /admin/channels/{id}/suspend`, `ban`, `unban`, `unsuspend` |
| Video moderation | `PUT /admin/videos/{id}/verify` |
| Metadata | `GET /admin/metadata/search`, `GET /admin/metadata/details` |
| Music | `/admin/music/overview`, `/admin/music/artists`, `/admin/music/releases`, `/admin/music/tracks` plus their upload, publish, unpublish, artwork, lyrics, and video-association actions |
| Featured content | `GET`/`POST /admin/featured`, `PUT`/`DELETE /admin/featured/{id}`, `GET /admin/featured/candidates` (query `type`, `q`, `limit`); at most five items can be enabled at once |
| Series | `/admin/series`, `GET /admin/series/{id}` (includes episodes still processing), episode ordering/metadata, and episode subtitle/audio routes |
| Intro detection | `GET /admin/series/{id}/detect-intros` (job state), `POST /admin/series/{id}/detect-intros` (start; `409` while a job is running) |
| Playback intro | `GET`, `POST` (multipart `video`: `.mp4`, `.m4v`, or `.webm`, maximum 500 MB), `PUT` (JSON `enabled`, `allow_skip`), and `DELETE /admin/playback-intro` |
| Movies | `/admin/movies`, trailer/video assignment, and movie subtitle/audio routes |
| Intro review | `GET /admin/intro-suggestions`; approve/reject actions by ID. Suggestions include `source` (user or automatic detection) and `confidence` |
| YouTube mirrors | `/admin/youtube-mirrors/channels` and `/admin/youtube-mirrors/import` |
| Media ingest | `/admin/media-ingests` plus upload, retry, pause, preview, import, attach, and cleanup operations |
| Transcoding | `/admin/transcode-jobs` plus start, restart, pause, and cancel actions |
| Workers | `/admin/workers`, releases, enrollment codes, enable/revoke, scheduling, role assignment (`PUT /admin/workers/{id}/roles`), and delete operations |

Admin clients should be developed alongside the backend version they target.

## Worker and internal APIs

The following are intentionally outside the public developer contract:

- `/workers/*` remote encoding protocol
- `/worker-releases/*` release distribution
- `/internal/gilid/account` trusted GILid service integration

Worker calls use enrollment secrets and lease/job credentials rather than a
normal user login. Worker deployment and enrollment guidance is maintained in
the private backend repository. Never expose worker credentials, the internal
GILid token, stream keys, or admin bearer tokens in browser code.

## Compatibility guidance

- Ignore unknown JSON properties so additive responses do not break clients.
- Do not rely on array ordering unless the endpoint documents it.
- Do not construct media paths; use URLs returned by the API.
- Use bounded retries with exponential backoff for `429`, `502`, `503`, and
  `504` responses and for idempotent network failures.
- Do not automatically retry non-idempotent `POST` requests unless your client
  can prove the original request was not accepted.
- Poll asynchronous download/upload state with a delay instead of a tight loop.
- Keep bearer tokens, stream keys, worker secrets, and WebAuthn flow tokens out
  of logs and URLs.

## Source of truth

This guide documents the routes and contracts of the GilTube backend. When a
deployment-specific admin or worker operation differs, the backend version
deployed at `https://giltube.gilservers.com/api/v1` is authoritative.
