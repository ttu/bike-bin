import { APP_STORE_67_HEIGHT, APP_STORE_67_WIDTH, buildFramedDeviceHtml } from './framedDeviceHtml';

describe('buildFramedDeviceHtml', () => {
  it('embeds sanitized base64 and target dimensions', () => {
    const html = buildFramedDeviceHtml('ab+/=', APP_STORE_67_WIDTH, APP_STORE_67_HEIGHT);
    expect(html).toContain(`width: ${APP_STORE_67_WIDTH}px`);
    expect(html).toContain(`height: ${APP_STORE_67_HEIGHT}px`);
    expect(html).toContain('data:image/png;base64,ab+/=');
    expect(html).not.toContain('<script');
    expect(html).toContain('background: transparent');
    expect(html).not.toContain('radial-gradient');
  });

  it('strips invalid base64 characters from the data URL payload', () => {
    const html = buildFramedDeviceHtml('a\nb\t<c>', 100, 200);
    const dataUrlPattern = /data:image\/png;base64,([A-Za-z0-9+/=]+)/;
    const m = dataUrlPattern.exec(html);
    expect(m?.[1]).toBe('abc');
  });
});
