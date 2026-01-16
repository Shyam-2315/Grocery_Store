import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Professional Blue
    },
    secondary: {
      main: '#2e7d32', // Grocery Green (Growth/Freshness)
    },
    background: {
      default: '#f4f6f8', // Light Grey background for less eye strain
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

export default theme;