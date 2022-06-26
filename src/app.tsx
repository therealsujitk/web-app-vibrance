import { Admin, Home, NotFound } from './routes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DarkTheme } from './theme';
import { ThemeProvider } from '@emotion/react';

export default function App() {
  return (
    <ThemeProvider theme={DarkTheme}>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/admin' element={<Admin />} />
          <Route path='/*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
