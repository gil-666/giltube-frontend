# Sabrina Carpenter Channel Header Theme

Paste the first block into `Header HTML` and the second block into `Header CSS`.

Replace `CUTOUT_IMAGE_URL_HERE` with the uploaded transparent cutout URL.

For the matching lower page background, paste the `Content background HTML` and `Content background CSS`
blocks into the channel editor's content theme fields.

The content stickers are positioned for the current desktop channel grid: mostly in the right rail
and lower whitespace so they do not sit under the video cards.

## Header HTML

```html
<div class="sab-stage">
  <div class="sab-glow sab-glow-a"></div>
  <div class="sab-glow sab-glow-b"></div>
  <div class="sab-ribbon sab-ribbon-a"></div>
  <div class="sab-ribbon sab-ribbon-b"></div>

  <div class="sab-heart sab-heart-a"></div>
  <div class="sab-heart sab-heart-b"></div>
  <div class="sab-heart sab-heart-c"></div>
  <div class="sab-heart sab-heart-d"></div>
  <div class="sab-heart sab-heart-e"></div>
  <div class="sab-heart sab-heart-f"></div>

  <div class="sab-sparkle sab-sparkle-a"></div>
  <div class="sab-sparkle sab-sparkle-b"></div>
  <div class="sab-sparkle sab-sparkle-c"></div>
  <div class="sab-sparkle sab-sparkle-d"></div>

  <div class="sab-copy">
    <p class="sab-kicker">official giltube channel</p>
    <h2>sabrina carpenter</h2>
    <p class="sab-subtitle">sweet, sparkly, and a little chaotic</p>
  </div>

  <div class="sab-cutout-wrap">
    <img class="sab-cutout" src="https://i.ibb.co/JjtnXd2J/sabrina-cutout.png" alt="">
  </div>
</div>
```

## Content background HTML

```html
<div class="sab-content-stage">
  <div class="sab-content-orb sab-content-orb-a"></div>
  <div class="sab-content-orb sab-content-orb-b"></div>
  <div class="sab-content-orb sab-content-orb-c"></div>

  <div class="sab-content-heart sab-content-heart-a"></div>
  <div class="sab-content-heart sab-content-heart-b"></div>
  <div class="sab-content-heart sab-content-heart-c"></div>
  <div class="sab-content-heart sab-content-heart-d"></div>
  <div class="sab-content-heart sab-content-heart-e"></div>

  <div class="sab-content-sparkle sab-content-sparkle-a"></div>
  <div class="sab-content-sparkle sab-content-sparkle-b"></div>
  <div class="sab-content-sparkle sab-content-sparkle-c"></div>
  <div class="sab-content-sparkle sab-content-sparkle-d"></div>

  <div class="sab-content-wave sab-content-wave-a"></div>
  <div class="sab-content-wave sab-content-wave-b"></div>

  <div class="sab-sticker sab-sticker-a">
    <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Sabrina%20Carpenter%202019.jpg?width=260" alt="">
  </div>
  <div class="sab-sticker sab-sticker-b">
    <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Sabrina%20Carpenter%20Feb%2010%202015.jpg?width=260" alt="">
  </div>
  <div class="sab-sticker sab-sticker-c">
    <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Sabrina%20Carpenter%202017b%20(cropped).jpg?width=250" alt="">
  </div>
  <div class="sab-sticker sab-sticker-d">
    <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Sabrina%20Carpenter%20in%202018.jpg?width=250" alt="">
  </div>
  <div class="sab-sticker sab-sticker-e">
    <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Sabrina%20Carpenter%20-%20O2%20Arena%202025%20-%20102%20(portrait).jpg?width=260" alt="">
  </div>
  <div class="sab-sticker sab-sticker-f">
    <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Sabrina%20Carpenter%20at%20California%202%20December%202016%20(cropped).jpg?width=260" alt="">
  </div>

  <p class="sab-sticker-credit">
    Photos: Phillip Mansfield, Red Carpet Report, DarkGlow, MTV UK, Raph_PH, Justin Higuchi via Wikimedia Commons
  </p>
</div>
```

## Content background CSS

```css
:root {
  color-scheme: light;
}

body {
  min-height: 100vh;
  background: transparent;
}

.sab-content-stage {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 16% 14%, rgba(255, 216, 140, 0.42), transparent 26%),
    radial-gradient(circle at 82% 18%, rgba(255, 150, 194, 0.36), transparent 28%),
    radial-gradient(circle at 58% 90%, rgba(255, 184, 210, 0.28), transparent 32%),
    linear-gradient(145deg, #fffaf5 0%, #fff4fa 44%, #fff 100%);
}

.sab-content-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255, 91, 143, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 91, 143, 0.09) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.32));
}

.sab-content-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 229, 242, 0.38)),
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.72), transparent 42%);
  pointer-events: none;
}

.sab-content-orb {
  position: absolute;
  z-index: 1;
  border-radius: 999px;
  filter: blur(2px);
  opacity: 0.68;
  animation: sab-content-breathe 9s ease-in-out infinite;
}

.sab-content-orb-a {
  width: 34vw;
  height: 34vw;
  left: -10vw;
  top: 10vh;
  background: rgba(255, 214, 138, 0.34);
}

.sab-content-orb-b {
  width: 28vw;
  height: 28vw;
  right: -8vw;
  top: 18vh;
  background: rgba(255, 116, 174, 0.26);
  animation-delay: -4s;
}

.sab-content-orb-c {
  width: 24vw;
  height: 24vw;
  left: 44%;
  bottom: -9vw;
  background: rgba(255, 183, 208, 0.28);
  animation-delay: -6s;
}

.sab-content-wave {
  position: absolute;
  z-index: 2;
  height: 18px;
  width: 62vw;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 85, 144, 0.16), transparent);
  filter: blur(0.4px);
  animation: sab-content-wave 13s ease-in-out infinite;
}

.sab-content-wave-a {
  left: -12vw;
  top: 22vh;
  transform: rotate(-9deg);
}

.sab-content-wave-b {
  right: -18vw;
  bottom: 18vh;
  transform: rotate(8deg);
  animation-delay: -5s;
}

.sab-content-heart,
.sab-content-sparkle,
.sab-sticker {
  position: absolute;
  pointer-events: none;
}

.sab-content-heart,
.sab-content-sparkle {
  z-index: 3;
}

.sab-content-heart::before {
  content: "\2665";
  display: block;
  color: #ff477e;
  text-shadow: 0 8px 20px rgba(255, 71, 126, 0.22);
  animation: sab-content-heart-pulse 3.6s ease-in-out infinite;
}

.sab-content-heart-a {
  left: 12%;
  top: 18%;
  font-size: 19px;
  animation: sab-content-float 8s ease-in-out infinite;
}

.sab-content-heart-b {
  right: 16%;
  top: 12%;
  font-size: 24px;
  animation: sab-content-float 9s ease-in-out infinite reverse;
}

.sab-content-heart-c {
  left: 27%;
  bottom: 24%;
  font-size: 15px;
  animation: sab-content-float 7s ease-in-out infinite;
  animation-delay: -3s;
}

.sab-content-heart-d {
  right: 31%;
  bottom: 18%;
  font-size: 18px;
  animation: sab-content-float 10s ease-in-out infinite reverse;
  animation-delay: -4s;
}

.sab-content-heart-e {
  right: 7%;
  bottom: 42%;
  font-size: 14px;
  animation: sab-content-float 8.5s ease-in-out infinite;
  animation-delay: -2s;
}

.sab-content-sparkle {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ffd166;
  box-shadow:
    0 0 0 5px rgba(255, 209, 102, 0.1),
    0 0 22px rgba(255, 209, 102, 0.62);
  animation: sab-content-twinkle 2.8s ease-in-out infinite;
}

.sab-content-sparkle-a {
  left: 18%;
  top: 34%;
}

.sab-content-sparkle-b {
  left: 52%;
  top: 16%;
  animation-delay: -0.8s;
}

.sab-content-sparkle-c {
  right: 19%;
  bottom: 28%;
  animation-delay: -1.6s;
}

.sab-content-sparkle-d {
  left: 38%;
  bottom: 16%;
  animation-delay: -2.1s;
}

.sab-sticker {
  z-index: 4;
  width: clamp(72px, 8vw, 128px);
  aspect-ratio: 1;
  border: 6px solid rgba(255, 255, 255, 0.94);
  border-radius: 28% 72% 35% 65% / 64% 35% 65% 36%;
  background: #fff;
  box-shadow:
    0 18px 34px rgba(86, 31, 52, 0.18),
    0 4px 0 rgba(255, 92, 146, 0.16);
  overflow: hidden;
  opacity: 0.92;
  animation: sab-sticker-float 9s ease-in-out infinite;
}

.sab-sticker::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -8px;
  width: 42%;
  height: 18px;
  border-radius: 4px;
  background: rgba(255, 211, 226, 0.84);
  box-shadow: 0 2px 8px rgba(255, 92, 146, 0.16);
  transform: translateX(-50%) rotate(-7deg);
  z-index: 2;
}

.sab-sticker::after {
  content: "\2665";
  position: absolute;
  right: 7px;
  bottom: 3px;
  z-index: 2;
  color: #ff477e;
  font-size: 14px;
  text-shadow: 0 2px 8px rgba(255, 71, 126, 0.32);
}

.sab-sticker img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.08) contrast(1.04);
}

.sab-sticker-a {
  right: 7%;
  top: 10%;
  transform: rotate(8deg);
}

.sab-sticker-a img {
  object-position: 52% 31%;
}

.sab-sticker-b {
  left: 5%;
  top: 62%;
  width: clamp(66px, 7vw, 112px);
  border-radius: 68% 32% 62% 38% / 42% 62% 38% 58%;
  animation-delay: -3s;
}

.sab-sticker-b img {
  object-position: 50% 34%;
}

.sab-sticker-c {
  right: 20%;
  bottom: 4%;
  width: clamp(60px, 6.6vw, 104px);
  border-radius: 999px;
  animation-delay: -5s;
}

.sab-sticker-c img {
  object-position: 50% 31%;
}

.sab-sticker-d {
  left: 43%;
  bottom: 9%;
  width: clamp(58px, 6.4vw, 102px);
  border-radius: 44% 56% 48% 52% / 58% 42% 58% 42%;
  animation-delay: -6.5s;
}

.sab-sticker-d img {
  object-position: 50% 28%;
}

.sab-sticker-e {
  right: -20px;
  top: 36%;
  width: clamp(64px, 7vw, 110px);
  border-radius: 64% 36% 48% 52% / 42% 56% 44% 58%;
  animation-delay: -1.7s;
}

.sab-sticker-e img {
  object-position: 50% 30%;
}

.sab-sticker-f {
  right: 8%;
  bottom: 12%;
  width: clamp(70px, 7.4vw, 118px);
  border-radius: 999px;
  animation-delay: -4.3s;
}

.sab-sticker-f img {
  object-position: 50% 26%;
}

.sab-sticker-credit {
  position: absolute;
  right: 16px;
  bottom: 10px;
  z-index: 5;
  margin: 0;
  max-width: 260px;
  color: rgba(90, 54, 66, 0.58);
  font: 700 10px / 1.25 ui-sans-serif, system-ui, sans-serif;
  text-align: right;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.72);
}

@keyframes sab-content-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-7deg);
  }

  50% {
    transform: translate3d(12px, -18px, 0) rotate(10deg);
  }
}

@keyframes sab-sticker-float {
  0%,
  100% {
    translate: 0 0;
    rotate: -2deg;
  }

  50% {
    translate: 8px -16px;
    rotate: 3deg;
  }
}

@keyframes sab-content-heart-pulse {
  0%,
  100% {
    opacity: 0.54;
    transform: scale(1);
  }

  50% {
    opacity: 0.95;
    transform: scale(1.18);
  }
}

@keyframes sab-content-twinkle {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.78);
  }

  50% {
    opacity: 1;
    transform: scale(1.24);
  }
}

@keyframes sab-content-breathe {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}

@keyframes sab-content-wave {
  0%,
  100% {
    translate: 0 0;
  }

  50% {
    translate: 34px -12px;
  }
}

@media (max-width: 720px) {
  .sab-content-orb-a {
    width: 64vw;
    height: 64vw;
  }

  .sab-content-orb-b {
    width: 58vw;
    height: 58vw;
  }

  .sab-content-wave {
    width: 110vw;
  }

  .sab-content-heart-b,
  .sab-content-heart-d,
  .sab-sticker-c,
  .sab-sticker-d,
  .sab-sticker-f,
  .sab-sticker-credit {
    display: none;
  }

  .sab-sticker-a {
    right: -18px;
    top: 12%;
  }

  .sab-sticker-b {
    left: -12px;
    bottom: 24%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sab-content-stage *,
  .sab-content-stage *::before,
  .sab-content-stage *::after {
    animation-duration: 0.001ms;
    animation-iteration-count: 1;
  }
}
```

## Header CSS

```css
:root {
  color-scheme: light;
}

body {
  background: transparent;
}

.sab-stage {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 72% 28%, rgba(255, 201, 222, 0.78), transparent 28%),
    radial-gradient(circle at 18% 72%, rgba(255, 236, 180, 0.72), transparent 31%),
    linear-gradient(135deg, #fff 0%, #fff7fb 48%, #fff 100%);
}

.sab-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255, 123, 172, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 123, 172, 0.12) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent 82%);
}

.sab-glow {
  position: absolute;
  z-index: 1;
  border-radius: 999px;
  filter: blur(4px);
  opacity: 0.82;
  animation: sab-breathe 7s ease-in-out infinite;
}

.sab-glow-a {
  width: 34vw;
  height: 34vw;
  right: 12%;
  top: 5%;
  background: rgba(255, 164, 196, 0.38);
}

.sab-glow-b {
  width: 24vw;
  height: 24vw;
  left: 10%;
  bottom: 8%;
  background: rgba(255, 220, 138, 0.34);
  animation-delay: -3s;
}

.sab-ribbon {
  position: absolute;
  z-index: 2;
  width: 48vw;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 97, 158, 0.2), transparent);
  filter: blur(0.4px);
  transform: rotate(-12deg);
  animation: sab-ribbon-drift 12s ease-in-out infinite;
}

.sab-ribbon-a {
  left: -8%;
  top: 24%;
}

.sab-ribbon-b {
  right: -11%;
  bottom: 28%;
  transform: rotate(10deg);
  animation-delay: -5s;
}

.sab-cutout-wrap {
  position: absolute;
  z-index: 5;
  right: clamp(18px, 8vw, 160px);
  bottom: -18%;
  width: min(44vw, 540px);
  min-width: 280px;
  transform-origin: 50% 82%;
  animation: sab-parallax-float 6.5s ease-in-out infinite;
}

.sab-cutout {
  display: block;
  width: 100%;
  height: auto;
  filter:
    drop-shadow(0 28px 34px rgba(92, 30, 55, 0.24))
    drop-shadow(0 0 20px rgba(255, 178, 213, 0.34));
}

.sab-cutout-wrap::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 16%;
  bottom: 4%;
  height: 18px;
  z-index: -1;
  border-radius: 999px;
  background: rgba(98, 31, 57, 0.13);
  filter: blur(10px);
  animation: sab-shadow 6.5s ease-in-out infinite;
}

.sab-copy {
  position: absolute;
  z-index: 4;
  left: clamp(22px, 12vw, 210px);
  top: 48%;
  max-width: 430px;
  transform: translateY(-50%);
  color: #24131b;
  text-shadow: 0 1px 0 #fff;
}

.sab-kicker {
  margin: 0 0 10px;
  color: #e53064;
  font: 800 clamp(11px, 1.2vw, 14px) / 1.1 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.sab-copy h2 {
  margin: 0;
  color: #1f1218;
  font: 900 clamp(42px, 7vw, 92px) / 0.84 ui-serif, Georgia, serif;
  letter-spacing: -0.07em;
  text-transform: lowercase;
}

.sab-subtitle {
  display: inline-flex;
  margin: 16px 0 0;
  padding: 9px 14px;
  border: 1px solid rgba(229, 48, 100, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  color: #7b344d;
  font: 700 clamp(12px, 1.3vw, 15px) / 1.2 ui-sans-serif, system-ui, sans-serif;
  box-shadow: 0 12px 30px rgba(229, 48, 100, 0.08);
  backdrop-filter: blur(10px);
}

.sab-heart,
.sab-sparkle {
  position: absolute;
  z-index: 3;
  pointer-events: none;
}

.sab-heart::before {
  content: "\2665";
  display: block;
  color: #ff477e;
  text-shadow: 0 8px 20px rgba(255, 71, 126, 0.24);
  animation: sab-heart-pulse 3.4s ease-in-out infinite;
}

.sab-heart-a {
  right: 42%;
  top: 18%;
  font-size: 28px;
  animation: sab-heart-drift 8s ease-in-out infinite;
}

.sab-heart-b {
  right: 11%;
  top: 21%;
  font-size: 18px;
  animation: sab-heart-drift 7s ease-in-out infinite reverse;
}

.sab-heart-c {
  right: 35%;
  bottom: 23%;
  font-size: 16px;
  animation: sab-heart-drift 9s ease-in-out infinite;
  animation-delay: -3s;
}

.sab-heart-d {
  left: 8%;
  top: 20%;
  font-size: 15px;
  animation: sab-heart-drift 10s ease-in-out infinite reverse;
  animation-delay: -1s;
}

.sab-heart-e {
  left: 22%;
  bottom: 21%;
  font-size: 22px;
  animation: sab-heart-drift 7.5s ease-in-out infinite;
  animation-delay: -4s;
}

.sab-heart-f {
  right: 7%;
  bottom: 34%;
  font-size: 24px;
  animation: sab-heart-drift 8.5s ease-in-out infinite reverse;
  animation-delay: -2s;
}

.sab-sparkle {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #ffd166;
  box-shadow:
    0 0 0 5px rgba(255, 209, 102, 0.12),
    0 0 26px rgba(255, 209, 102, 0.7);
  animation: sab-twinkle 2.7s ease-in-out infinite;
}

.sab-sparkle-a {
  left: 15%;
  top: 35%;
}

.sab-sparkle-b {
  right: 29%;
  top: 13%;
  animation-delay: -0.7s;
}

.sab-sparkle-c {
  right: 18%;
  bottom: 18%;
  animation-delay: -1.4s;
}

.sab-sparkle-d {
  left: 34%;
  bottom: 27%;
  animation-delay: -2s;
}

@supports (animation-timeline: view()) {
  .sab-cutout-wrap {
    animation-name: sab-scroll-lift, sab-parallax-float;
    animation-duration: 1s, 6.5s;
    animation-timing-function: linear, ease-in-out;
    animation-iteration-count: 1, infinite;
    animation-timeline: view(), auto;
    animation-range: entry 0% exit 100%;
  }
}

@keyframes sab-scroll-lift {
  from {
    translate: 0 26px;
    scale: 1.03;
  }

  to {
    translate: 0 -34px;
    scale: 0.98;
  }
}

@keyframes sab-parallax-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-0.6deg);
  }

  50% {
    transform: translate3d(-10px, -18px, 0) rotate(0.8deg);
  }
}

@keyframes sab-shadow {
  0%,
  100% {
    opacity: 0.34;
    transform: scaleX(0.92);
  }

  50% {
    opacity: 0.22;
    transform: scaleX(1.08);
  }
}

@keyframes sab-heart-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-8deg);
  }

  50% {
    transform: translate3d(12px, -18px, 0) rotate(10deg);
  }
}

@keyframes sab-heart-pulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes sab-twinkle {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.75);
  }

  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

@keyframes sab-breathe {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}

@keyframes sab-ribbon-drift {
  0%,
  100% {
    translate: 0 0;
  }

  50% {
    translate: 28px -12px;
  }
}

@media (max-width: 720px) {
  .sab-stage {
    min-height: 100vh;
  }

  .sab-copy {
    left: 18px;
    right: 18px;
    top: 24%;
    max-width: none;
  }

  .sab-copy h2 {
    max-width: 330px;
    font-size: clamp(40px, 16vw, 68px);
  }

  .sab-subtitle {
    max-width: 260px;
  }

  .sab-cutout-wrap {
    right: -40px;
    bottom: -18%;
    width: 78vw;
    min-width: 250px;
  }

  .sab-heart-a,
  .sab-heart-c {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sab-stage *,
  .sab-stage *::before,
  .sab-stage *::after {
    animation-duration: 0.001ms;
    animation-iteration-count: 1;
    scroll-behavior: auto;
  }
}
```
