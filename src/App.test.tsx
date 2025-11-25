import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders a home link labeled Kodisha', () => {
  render(<App />);
  const links = screen.getAllByRole('link', { name: /Kodisha/i });
  expect(links.some(a => a.getAttribute('href') === '/')).toBe(true);
});
