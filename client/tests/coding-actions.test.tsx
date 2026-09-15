import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { CodingWorkbench } from '../src/coding/CodingWorkbench';
import LoadingScreen from '../src/components/LoadingScreen';
import type { PlayableCodingTask } from '../../shared/coding-catalog';

vi.mock('../src/coding/Editor', () => ({
  Editor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) =>
    <textarea aria-label="Test editor" value={value} onChange={event => onChange(event.target.value)} />,
}));
vi.mock('../src/coding/api', () => ({ useCodingApproaches: () => ({ data: undefined }), submitCoding: vi.fn(), revealCoding: vi.fn() }));

const task: PlayableCodingTask = {
  id: 'js-test-editor', track: 'javascript', level: 1, tier: 1,
  focus: ['functions'], title: { en: 'Test task', cs: 'Testovací úloha' },
  prompt: { en: 'Return one.', cs: 'Vrať jedničku.' },
  starter: 'const one = () => 1;\n', hints: { en: ['Use a function.'], cs: ['Použij funkci.'] },
  verify: 'tests', estimatedMinutes: 5, tests: [],
};
function mount(onDraft = vi.fn()) {
  return { onDraft, ...render(<MemoryRouter><LanguageProvider><CodingWorkbench task={task} session={null} locked={null} signedIn={false} mode="section" onDraft={onDraft} /></LanguageProvider></MemoryRouter>) };
}

it('disables idle/empty formatting and enables it only for a real formatting change', async () => {
  mount();
  const format = screen.getByRole('button', { name: 'Format', exact: true });
  expect(screen.getByRole('button', { name: 'Reset', exact: true })).toBeDisabled();
  expect(format).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Test editor'), { target: { value: 'const one=()=>2' } });
  await waitFor(() => expect(format).toBeEnabled(), { timeout: 5000 });
  fireEvent.click(format);
  await waitFor(() => expect(screen.getByLabelText('Test editor')).toHaveValue('const one = () => 2;\n'));
  await waitFor(() => expect(format).toBeDisabled());
  fireEvent.change(screen.getByLabelText('Test editor'), { target: { value: '   ' } });
  expect(format).toBeDisabled();
});

it('Reset clears exhausted hints even when the code is unchanged', async () => {
  localStorage.setItem('devshark:coding:hints:js-test-editor', '20');
  mount();
  const reset = screen.getByRole('button', { name: 'Reset', exact: true });
  expect(reset).toBeEnabled();
  fireEvent.click(reset);
  const dialog = screen.getByRole('alertdialog', { name: 'Reset' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Reset', exact: true }));
  await waitFor(() => expect(localStorage.getItem('devshark:coding:hints:js-test-editor')).toBe('0'));
  expect(reset).toBeDisabled();
});

it('flushes edits when leaving before the draft debounce finishes', () => {
  const { unmount, onDraft } = mount();
  fireEvent.change(screen.getByLabelText('Test editor'), { target: { value: 'const one = () => 3;' } });
  unmount();
  expect(onDraft).toHaveBeenCalledWith('const one = () => 3;');
});

it('uses a visible, accessible branded loading status', () => {
  render(<LoadingScreen label="Loading task…" />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading task…');
  expect(screen.getByText('Loading task…')).toBeVisible();
});
