import { Home, Login } from './routes';
import { BrowserRouter } from 'react-router-dom';
import { DarkTheme } from './theme';
import { Alert, AlertColor, Box, Button, Stack, ThemeProvider } from '@mui/material';
import { AppContext, AppContextInterface } from './contexts/app';
import Logo from "./assets/images/logo.png";
import React from 'react';
import Cookies from 'js-cookie';
import { CircularProgress, CssBaseline, Typography } from '@mui/material';
import Network from './utils/network';
import { MediaQuery } from './components';

interface AppState {
  apiKey?: string;
  username?: string;
  permissions?: string[];
  alerts: { 
    [x: string]: {
      type: AlertColor;
      message: string;
      action?: {
        name: string;
        onClick: () => void;
      };
    }
  };
}

export default class App extends React.Component<{}, AppState> {
  isSessionCalled: boolean;

  constructor(props: AppState) {
    super(props);

    this.state = {
      apiKey: Cookies.get('apiKey'),
      username: undefined,
      permissions: undefined,
      alerts: {}
    };

    this.isSessionCalled = false;
  }

  render() {
    const appContext: AppContextInterface = {
      apiKey: this.state.apiKey,
      username: this.state.username,
      permissions: this.state.permissions,
      initSession: (apiKey) => {
        Cookies.set('apiKey', apiKey, { expires: 7, path: '/admin' });
        this.setState({ apiKey: apiKey });
      },
      setSession: (username, permissions) => {
        this.setState({
          username: username,
          permissions: permissions
        });
      },
      destroySession: () => {
        Cookies.remove('apiKey', { path: '/admin' });
        this.setState({
          apiKey: undefined,
          username: undefined,
          permissions: undefined
        });
      },
      displayAlert: (type: AlertColor, message: string|Error, action?: { name: string, onClick: () => void }) => {
        var alertId = Math.random();

        while (alertId in this.state.alerts) {
          alertId = Math.random();
        }

        this.state.alerts[alertId] = {
          type: type,
          message: message.toString(),
          action: action
        }

        this.setState({ alerts: this.state.alerts });
      },
      displayError: (message: string|Error, action?: { name: string, onClick: () => void }) => {
        if (message.toString().toLowerCase().includes('api key has expired')) {
          action = {
            name: 'Sign In',
            onClick: () => appContext.destroySession()
          };
        }

        appContext.displayAlert('error', message, action);
      },
      displayWarning: (message: string) => {
        appContext.displayAlert('warning', message);
      }
    };

    const Splash = () => (
      <div>
        <CssBaseline />
        <div style={{ 
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '100%'
        }}>
          <img style={{ width: 'min(300px, 80%)', padding: '20px' }} src={Logo} />
          <Typography variant="h6" sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            paddingTop: 0
          }}>
            <CircularProgress sx={{ marginRight: 2 }} size={24} />
            Dashboard is loading...
          </Typography>
        </div>
      </div>
    );

    return (
      <ThemeProvider theme={DarkTheme}>
        <AppContext.Provider value={appContext}>
          <BrowserRouter basename='/admin'>
            <AppContext.Consumer>
              { ({ apiKey, username, setSession, displayError }) => {
                if (!apiKey) {
                  return <Login />
                } else if (!username) {
                  if (!this.isSessionCalled) {
                    this.isSessionCalled = true;
                    this.getSession(apiKey, setSession, displayError);
                  }
                  
                  return <Splash />;
                } else {
                  return <Home />
                }
              }}
            </AppContext.Consumer>
          </BrowserRouter>
        </AppContext.Provider>
        {Object.keys(this.state.alerts).length !== 0 &&
          <MediaQuery query={(theme) => theme.breakpoints.up('sm')}>
            {(theme) => <Stack sx={{
              position: 'fixed',
              left: 0,
              bottom: 0,
              padding: 2,
              zIndex: 1500,
              width: theme ? '400px' : '100%'
            }}
            spacing={1.5}
            >
              {Object.entries(this.state.alerts).map(([k, v]) => (
                <Alert 
                  key={k} 
                  severity={v.type} 
                  onClose={() => {
                    delete this.state.alerts[k];
                    this.setState({ alerts: this.state.alerts });
                  }}
                  { ...v.action
                    ? {action: <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', whiteSpace: 'nowrap' }}>
                      <Button color="inherit" onClick={() => {
                        delete this.state.alerts[k];
                        this.setState({ alerts: this.state.alerts });
                        v.action!.onClick();
                      }}>
                        {v.action.name}
                      </Button>
                    </Box>
                  } : {}}
                >
                  <strong>{v.type.charAt(0).toUpperCase() + v.type.slice(1)} —</strong> {v.message}
                </Alert>
              ))}
            </Stack>}
          </MediaQuery>
        }
      </ThemeProvider>
    );
  }

  getSession = async (apiKey: string, setSession: (username: string, permissions: string[]) => void, onError: (message: string, action?: { name: string, onClick: () => void }) => void) => {
    try {
      const response = await new Network(apiKey).doGet('/api/latest/session');
      const username = response.session.username;
      const permissions = response.session.permissions;

      setSession(username, permissions);
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getSession(apiKey, setSession, onError) });
    }
  }
}
