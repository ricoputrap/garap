import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useStore } from './store';

function reset() {
  localStorage.clear();
  useStore.setState({ cards: [], tasks: [], hideCompleted: false, sidePanelOpen: true });
}

describe('board integration', () => {
  beforeEach(reset);

  it('adds a card via the new-card input', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText(/new card title/i);
    await user.type(input, 'Work{enter}');
    expect(screen.getByRole('heading', { name: 'Work' })).toBeInTheDocument();
  });

  it('adds a task to a card', async () => {
    const user = userEvent.setup();
    useStore.getState().addCard('Home');
    render(<App />);
    const taskInput = screen.getByLabelText(/add task to home/i);
    await user.type(taskInput, 'buy milk{enter}');
    expect(screen.getByText('buy milk')).toBeInTheDocument();
  });

  it('completing a task shows strikethrough', async () => {
    const user = userEvent.setup();
    useStore.getState().addCard('C');
    const cId = useStore.getState().cards[0].id;
    useStore.getState().addTask(cId, 'task1');
    render(<App />);
    const cb = screen.getByLabelText('Complete task1') as HTMLInputElement;
    await user.click(cb);
    expect(cb.checked).toBe(true);
    expect(screen.getByText('task1').className).toMatch(/line-through/);
  });

  it('hide completed toggle removes completed tasks from board', async () => {
    const user = userEvent.setup();
    useStore.getState().addCard('C');
    const cId = useStore.getState().cards[0].id;
    useStore.getState().addTask(cId, 'done-task');
    const tId = useStore.getState().tasks[0].id;
    useStore.getState().toggleTaskComplete(tId);
    render(<App />);
    expect(screen.getByText('done-task')).toBeInTheDocument();
    await user.click(screen.getByLabelText(/hide completed/i));
    expect(screen.queryByText('done-task')).not.toBeInTheDocument();
  });

  it('flagging a task as today shows it in Today panel grouped by card', async () => {
    const user = userEvent.setup();
    useStore.getState().addCard('Work');
    const cId = useStore.getState().cards[0].id;
    useStore.getState().addTask(cId, 'ship feature');
    const tId = useStore.getState().tasks[0].id;
    render(<App />);
    useStore.getState().setTaskTodayFlag(tId, true);
    const panel = await screen.findByTestId('panel-today');
    expect(within(panel).getByText('ship feature')).toBeInTheDocument();
    expect(within(panel).getByText('Work')).toBeInTheDocument();

    // completed tasks hidden from panel
    await user.click(within(panel).getByLabelText('Complete ship feature'));
    expect(within(panel).queryByText('ship feature')).not.toBeInTheDocument();
  });

  it('week panel only shows week-flagged incomplete tasks', async () => {
    const user = userEvent.setup();
    useStore.getState().addCard('Learn');
    const cId = useStore.getState().cards[0].id;
    useStore.getState().addTask(cId, 'read book');
    useStore.getState().addTask(cId, 'other');
    const readId = useStore.getState().tasks.find((t) => t.text === 'read book')!.id;
    useStore.getState().setTaskWeekFlag(readId, true);
    render(<App />);
    const sidebar = screen.getByTestId('side-panel');
    await user.click(within(sidebar).getByRole('button', { name: 'Week' }));
    const panel = screen.getByTestId('panel-week');
    expect(within(panel).getByText('read book')).toBeInTheDocument();
    expect(within(panel).queryByText('other')).not.toBeInTheDocument();
  });
});
