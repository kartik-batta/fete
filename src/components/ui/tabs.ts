/**
 * Id convention linking the header tablist to the panels App renders:
 *   tab   -> id="tab-<key>"   aria-controls="panel-<key>"
 *   panel -> id="panel-<key>" role="tabpanel" aria-labelledby="tab-<key>"
 */
export const tabId = (key: string): string => `tab-${key}`;
export const tabPanelId = (key: string): string => `panel-${key}`;

/** Spread onto the element wrapping the active tab's content. */
export function tabPanelProps(key: string) {
  return {
    id: tabPanelId(key),
    role: 'tabpanel' as const,
    'aria-labelledby': tabId(key),
    tabIndex: 0,
  };
}
