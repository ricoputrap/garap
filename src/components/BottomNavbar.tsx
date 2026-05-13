import React from 'react';
import { useStore, type NavTab } from '../store';

function BoardIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function TodayIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

function WeekIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="8" cy="15" r="1" fill="currentColor" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
      <circle cx="16" cy="15" r="1" fill="currentColor" />
      <circle cx="8" cy="19" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

const items: { tab: NavTab; label: string; Icon: () => React.ReactElement }[] = [
  { tab: 'board', label: 'Board', Icon: BoardIcon },
  { tab: 'today', label: 'Today', Icon: TodayIcon },
  { tab: 'week', label: 'Week', Icon: WeekIcon },
];

export function BottomNavbar() {
  const { currentTab, setCurrentTab } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex md:hidden z-50">
      {items.map(({ tab, label, Icon }) => {
        const active = currentTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => setCurrentTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              active ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Icon />
            <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
