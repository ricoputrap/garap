import { useStore } from '../store';
import { TaskListView } from './TaskListView';

export function SidePanel() {
  const { sidePanelOpen, toggleSidePanel, currentTab, setCurrentTab } = useStore();

  const listTab = currentTab === 'week' ? 'week' : 'today';

  if (!sidePanelOpen) {
    return (
      <aside className="border-l border-stone-200 bg-white shrink-0">
        <button
          type="button"
          onClick={toggleSidePanel}
          className="px-2 py-3 text-stone-400 hover:text-stone-700 h-full"
          aria-label="Open side panel"
          title="Open side panel"
        >
          ‹
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l border-stone-200 bg-white flex flex-col" data-testid="side-panel">
      <div className="flex items-center border-b border-stone-200">
        <button
          type="button"
          onClick={() => setCurrentTab('today')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${listTab === 'today' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setCurrentTab('week')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${listTab === 'week' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={toggleSidePanel}
          className="px-3 py-3 text-stone-400 hover:text-stone-700"
          aria-label="Collapse side panel"
          title="Collapse"
        >
          ›
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar p-4" data-testid={`panel-${listTab}`}>
        <TaskListView tab={listTab} />
      </div>
    </aside>
  );
}
