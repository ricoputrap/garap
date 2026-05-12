import { Board } from './components/Board';
import { SidePanel } from './components/SidePanel';
import { useStore } from './store';

export default function App() {
  const hideCompleted = useStore((s) => s.hideCompleted);
  const toggleHideCompleted = useStore((s) => s.toggleHideCompleted);
  const addCard = useStore((s) => s.addCard);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-3 px-6 py-3 border-b border-stone-200 bg-white shrink-0">
        <h1 className="text-lg font-semibold text-stone-900">Garap</h1>
        <span className="text-xs text-stone-400">{dateLabel}</span>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-sm text-stone-600 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={toggleHideCompleted}
            className="accent-stone-700"
          />
          Hide completed
        </label>
        <button
          type="button"
          onClick={() => addCard('New card')}
          className="text-sm bg-stone-900 text-white px-3 py-1.5 rounded hover:bg-stone-700"
        >
          + New card
        </button>
      </header>
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Board />
        <SidePanel />
      </div>
    </div>
  );
}
