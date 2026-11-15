import { chronologicalWindow } from './chat-history-window';

describe('chronologicalWindow', () => {
  it('shows the newest page from oldest to newest and reports more', () => {
    const page = chronologicalWindow([{ id: 3 }, { id: 2 }, { id: 1 }], true);
    expect(page.items.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(page.hasMore).toBe(true);
  });

  it('reports no further page when MongoDB has no continuation key', () => {
    const page = chronologicalWindow([{ id: 1 }], false);
    expect(page.items).toEqual([{ id: 1 }]);
    expect(page.hasMore).toBe(false);
  });
});
