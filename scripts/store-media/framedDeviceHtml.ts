/**
 * Builds a self-contained HTML document that shows a screenshot inside a simple
 * phone-style frame (CSS only — not an official device asset).
 */
export function buildFramedDeviceHtml(
  imageBase64Png: string,
  screenWidthPx: number,
  screenHeightPx: number,
): string {
  const safeB64 = imageBase64Png.replace(/[^A-Za-z0-9+/=]/g, '');
  const shellW = screenWidthPx + 88;
  const shellH = screenHeightPx + 160;
  const dataUrl = `data:image/png;base64,${safeB64}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at 30% 20%, #2a2d3a 0%, #0f1014 55%, #070708 100%);
    }
    .phone {
      width: ${shellW}px;
      height: ${shellH}px;
      padding: 36px 28px 48px;
      background: linear-gradient(145deg, #1c1d22 0%, #0a0a0c 100%);
      border-radius: 56px;
      box-shadow:
        0 32px 80px rgba(0, 0, 0, 0.55),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      border: 2px solid rgba(255, 255, 255, 0.06);
      position: relative;
    }
    .notch {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      width: 160px;
      height: 28px;
      background: #050506;
      border-radius: 0 0 18px 18px;
      box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.04);
    }
    .screen {
      width: ${screenWidthPx}px;
      height: ${screenHeightPx}px;
      border-radius: 32px;
      overflow: hidden;
      background: #000;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    .screen img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .home-indicator {
      position: absolute;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 5px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="phone">
    <div class="notch" aria-hidden="true"></div>
    <div class="screen">
      <img src="${dataUrl}" width="${screenWidthPx}" height="${screenHeightPx}" alt="" />
    </div>
    <div class="home-indicator" aria-hidden="true"></div>
  </div>
</body>
</html>`;
}

/** iPhone 6.7" App Store portrait asset size (CSS px × deviceScaleFactor 3). */
export const APP_STORE_67_WIDTH = 1290;
export const APP_STORE_67_HEIGHT = 2796;
