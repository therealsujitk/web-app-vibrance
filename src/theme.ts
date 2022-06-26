import { createTheme } from '@mui/material/styles';
import { amber } from '@mui/material/colors';

const DarkTheme = createTheme({
  typography: {
    fontFamily: 'Rubik, sans-serif'
  },
  palette: {
    mode: 'dark',
    primary: amber,
    background: {
      default: '#212121',
      paper: '#1a1a1a',
    }
  },
  shape: {
    borderRadius: 8,
  }
});

export { DarkTheme };
