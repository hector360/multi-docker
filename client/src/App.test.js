import { render, screen } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock de axios
jest.mock('axios');

test('renders learn react link', () => {
  // Mock de la respuesta de la API
  axios.get.mockResolvedValue({ data: { /* tus datos mockeados */ } });

  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});