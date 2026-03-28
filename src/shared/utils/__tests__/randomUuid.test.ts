import { randomUuidV4 } from '../randomUuid';

describe('randomUuidV4', () => {
  it('returns a UUID v4-shaped string', () => {
    const id = randomUuidV4();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
