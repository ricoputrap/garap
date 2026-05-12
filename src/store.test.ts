import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

function reset() {
  localStorage.clear();
  useStore.setState({ cards: [], tasks: [], hideCompleted: false, sidePanelOpen: true });
}

describe('store', () => {
  beforeEach(reset);

  it('adds and deletes cards', () => {
    useStore.getState().addCard('Work');
    useStore.getState().addCard('Home');
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['Work', 'Home']);

    const homeId = useStore.getState().cards[1].id;
    useStore.getState().deleteCard(homeId);
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['Work']);
  });

  it('deleting a card removes its tasks', () => {
    useStore.getState().addCard('Work');
    const cardId = useStore.getState().cards[0].id;
    useStore.getState().addTask(cardId, 'a');
    useStore.getState().addTask(cardId, 'b');
    expect(useStore.getState().tasks).toHaveLength(2);
    useStore.getState().deleteCard(cardId);
    expect(useStore.getState().tasks).toHaveLength(0);
  });

  it('reorders cards', () => {
    useStore.getState().addCard('A');
    useStore.getState().addCard('B');
    useStore.getState().addCard('C');
    const ids = useStore.getState().cards.map((c) => c.id);
    useStore.getState().reorderCards([ids[2], ids[0], ids[1]]);
    const titles = [...useStore.getState().cards]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.title);
    expect(titles).toEqual(['C', 'A', 'B']);
  });

  it('toggles complete and flags', () => {
    useStore.getState().addCard('W');
    const cId = useStore.getState().cards[0].id;
    useStore.getState().addTask(cId, 'x');
    const tId = useStore.getState().tasks[0].id;

    useStore.getState().toggleTaskComplete(tId);
    expect(useStore.getState().tasks[0].completed).toBe(true);

    useStore.getState().setTaskTodayFlag(tId, true);
    expect(useStore.getState().tasks[0].todayFlag).toBe(true);

    useStore.getState().setTaskWeekFlag(tId, true);
    expect(useStore.getState().tasks[0].weekFlag).toBe(true);
  });

  it('moves a task between cards at given index', () => {
    useStore.getState().addCard('A');
    useStore.getState().addCard('B');
    const [aId, bId] = useStore.getState().cards.map((c) => c.id);

    useStore.getState().addTask(aId, 'a1');
    useStore.getState().addTask(aId, 'a2');
    useStore.getState().addTask(bId, 'b1');

    const a1 = useStore.getState().tasks.find((t) => t.text === 'a1')!.id;
    useStore.getState().moveTaskBetweenCards(a1, bId, 0);

    const bTexts = useStore
      .getState()
      .tasks.filter((t) => t.cardId === bId)
      .sort((a, b) => a.order - b.order)
      .map((t) => t.text);
    expect(bTexts).toEqual(['a1', 'b1']);

    const aTexts = useStore
      .getState()
      .tasks.filter((t) => t.cardId === aId)
      .map((t) => t.text);
    expect(aTexts).toEqual(['a2']);
  });

  it('persists state to localStorage', () => {
    useStore.getState().addCard('Persist');
    const raw = localStorage.getItem('garap.cards');
    expect(raw).toContain('Persist');
  });

  it('does not add empty task', () => {
    useStore.getState().addCard('W');
    const cId = useStore.getState().cards[0].id;
    useStore.getState().addTask(cId, '   ');
    expect(useStore.getState().tasks).toHaveLength(0);
  });
});
