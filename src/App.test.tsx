import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders a home link labeled Mamamboga Digital', () => {
  render(<App />);
  const links = screen.getAllByRole('link', { name: /Mamamboga/i });
  expect(links.some(a => a.getAttribute('href') === '/')).toBe(true);
});
