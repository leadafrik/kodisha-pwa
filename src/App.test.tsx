import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Kodisha brand in navbar', () => {
  render(<App />);
  const brand = screen.getByText(/Kodisha/i);
  expect(brand).toBeInTheDocument();
});
