import { useState } from 'react';
import { Board } from './components/Board';
import { SidePanel } from './components/SidePanel';
import { BottomNavbar } from './components/BottomNavbar';
import { TaskListView } from './components/TaskListView';
import { UpdatePrompt, InstallButton } from './components/PWAPrompts';
import { useStore } from './store';

export default function App() {
  const hideCompleted = useStore((s) => s.hideCompleted);
  const toggleHideCompleted = useStore((s) => s.toggleHideCompleted);
  const addCard = useStore((s) => s.addCard);
  const currentTab = useStore((s) => s.currentTab);
  const [searchQuery, setSearchQuery] = useState('');

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-200 bg-white shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded bg-stone-900 text-white text-xs font-bold flex items-center justify-center select-none">
            G
          </div>
          <span className="font-semibold text-stone-900 text-sm">Garap</span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-400">{dateLabel}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="text-sm border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400 w-28 sm:w-40 md:w-48"
          />
          <button
            type="button"
            onClick={toggleHideCompleted}
            className={`text-sm px-2.5 py-1 rounded border whitespace-nowrap ${
              hideCompleted
                ? 'bg-stone-900 text-white border-stone-900'
                : 'border-stone-200 text-stone-600 hover:border-stone-400'
            }`}
          >
            Hide completed
          </button>
          <InstallButton />
          <button
            type="button"
            onClick={() => addCard('New list')}
            className="text-sm bg-stone-900 text-white px-3 py-1.5 rounded hover:bg-stone-700 whitespace-nowrap"
          >
            + New list
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${currentTab !== 'board' ? 'hidden md:flex' : 'flex'}`}>
          <Board searchQuery={searchQuery} />
        </div>

        <div className={`flex-1 overflow-y-auto p-4 pb-20 md:hidden ${currentTab === 'today' ? 'block' : 'hidden'}`}>
          <TaskListView tab="today" searchQuery={searchQuery} />
        </div>

        <div className={`flex-1 overflow-y-auto p-4 pb-20 md:hidden ${currentTab === 'week' ? 'block' : 'hidden'}`}>
          <TaskListView tab="week" searchQuery={searchQuery} />
        </div>

        <div className="hidden md:block">
          <SidePanel />
        </div>
      </div>

      <BottomNavbar />
      <UpdatePrompt />
    </div>
  );
}
