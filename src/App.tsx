import { Board } from './components/Board';
import { SidePanel } from './components/SidePanel';
import { BottomNavbar } from './components/BottomNavbar';
import { TaskListView } from './components/TaskListView';
import { useStore } from './store';

export default function App() {
  const hideCompleted = useStore((s) => s.hideCompleted);
  const toggleHideCompleted = useStore((s) => s.toggleHideCompleted);
  const addCard = useStore((s) => s.addCard);
  const currentTab = useStore((s) => s.currentTab);

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
        <label className="hidden md:flex items-center gap-2 text-sm text-stone-600 select-none cursor-pointer">
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
          className="hidden md:block text-sm bg-stone-900 text-white px-3 py-1.5 rounded hover:bg-stone-700"
        >
          + New card
        </button>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Board: always visible on desktop, visible on mobile only when board tab active */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${currentTab !== 'board' ? 'hidden md:flex' : 'flex'}`}>
          <Board />
        </div>

        {/* Mobile Today view */}
        <div className={`flex-1 overflow-y-auto p-4 pb-20 md:hidden ${currentTab === 'today' ? 'block' : 'hidden'}`}>
          <TaskListView tab="today" />
        </div>

        {/* Mobile Week view */}
        <div className={`flex-1 overflow-y-auto p-4 pb-20 md:hidden ${currentTab === 'week' ? 'block' : 'hidden'}`}>
          <TaskListView tab="week" />
        </div>

        {/* Desktop SidePanel only */}
        <div className="hidden md:block">
          <SidePanel />
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
}
