import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { SAMPLE_EVENTS } from './data/sampleEvents';

describe('App', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('renders the active event and the overview tab panel', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: SAMPLE_EVENTS[0].title })).toBeInTheDocument();
    expect(document.getElementById('main-content')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-overview');
  });

  it('lazy-loads the tab named in the URL hash', async () => {
    window.history.replaceState(null, '', '/#budget');
    render(<App />);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-budget');
    expect(await screen.findByText(/Paid So Far/i)).toBeInTheDocument();
  });

  it('switches tabs from the hero metric cards', async () => {
    render(<App />);
    await act(async () => {
      screen.getByRole('button', { name: /To-Do/i }).click();
    });
    expect(window.location.hash).toBe('#tasks');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-tasks');
  });
});
