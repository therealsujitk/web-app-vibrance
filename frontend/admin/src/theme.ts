import { createTheme } from '@mui/material'
import { blue } from '@mui/material/colors'

const DarkTheme = createTheme({
  typography: {
    fontFamily: 'Rubik, sans-serif',
  },
  palette: {
    mode: 'dark',
    primary: blue,
    background: {
      default: '#020817',
      paper: '#020817',
    },
  },
  shape: {
    borderRadius: 8,
  },
})

export { DarkTheme }
