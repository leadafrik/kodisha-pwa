import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Kodisha home link', () => {
  render(<App />);
  const homeLink = screen.getByRole('link', { name: /Kodisha/i });
  expect(homeLink).toBeInTheDocument();
});
