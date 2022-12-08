import { Admin } from './routes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DarkTheme } from './theme';
import { ThemeProvider } from '@emotion/react';

export default function App() {
  return (
    <ThemeProvider theme={DarkTheme}>
      <BrowserRouter basename='/admin'><Admin /></BrowserRouter>
    </ThemeProvider>
  );
}
