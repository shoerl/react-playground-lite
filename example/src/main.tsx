import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, Container, Stack, Box, Typography, ThemeProvider, createTheme } from '@mui/material';
import {
  PrimaryButton,
  InfoCard,
  MetricBadge,
  ToggleSetting,
  AvatarList,
} from '@rplite/mui-demo';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Box textAlign="center">
            <Typography variant="h3" component="h1" gutterBottom>
              React Playground Lite
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Explore components at{' '}
              <a href="/__rplite" style={{ color: theme.palette.primary.main }}>
                /__rplite
              </a>
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent="center">
            <PrimaryButton />
            <MetricBadge status="positive" label="Active sessions" value={128} suffix="today" />
          </Stack>
          <InfoCard />
          <ToggleSetting />
          <AvatarList />
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
