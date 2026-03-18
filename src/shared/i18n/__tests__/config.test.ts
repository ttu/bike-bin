import i18n from '../config';

describe('i18n config', () => {
  it('initializes successfully', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('uses English as default language', () => {
    expect(i18n.language).toBe('en');
  });

  it('uses English as fallback language', () => {
    const fallbackLng = i18n.options.fallbackLng;
    // i18next normalizes fallbackLng to an array internally
    expect(fallbackLng).toEqual(['en']);
  });

  it('exports a t function', () => {
    expect(typeof i18n.t).toBe('function');
  });

  it('returns the key for missing translations', () => {
    const result = i18n.t('nonexistent.key.that.does.not.exist');
    expect(result).toBe('nonexistent.key.that.does.not.exist');
  });

  it('translates known common keys', () => {
    expect(i18n.t('common:app.name')).toBe('Bike Bin');
  });

  it('translates tab labels', () => {
    expect(i18n.t('common:tabs.inventory')).toBe('Inventory');
    expect(i18n.t('common:tabs.search')).toBe('Search');
    expect(i18n.t('common:tabs.messages')).toBe('Messages');
    expect(i18n.t('common:tabs.profile')).toBe('Profile');
  });

  it('translates common actions', () => {
    expect(i18n.t('common:actions.save')).toBe('Save');
    expect(i18n.t('common:actions.cancel')).toBe('Cancel');
    expect(i18n.t('common:actions.delete')).toBe('Delete');
    expect(i18n.t('common:actions.edit')).toBe('Edit');
    expect(i18n.t('common:actions.back')).toBe('Back');
    expect(i18n.t('common:actions.done')).toBe('Done');
    expect(i18n.t('common:actions.close')).toBe('Close');
    expect(i18n.t('common:actions.retry')).toBe('Retry');
  });
});
