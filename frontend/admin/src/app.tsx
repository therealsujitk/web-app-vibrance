import { Home, Login } from './routes';
import { BrowserRouter } from 'react-router-dom';
import { DarkTheme } from './theme';
import { ThemeProvider } from '@mui/material';
import { AppContext, AppContextInterface } from './contexts/app';
import Logo from "./assets/images/logo.png";
import React from 'react';
import Cookies from 'js-cookie';
import { CircularProgress, CssBaseline, Typography } from '@mui/material';
import Network from './utils/network';

interface AppState {
  apiKey?: string;
  username?: string;
  permissions?: string[];
}

export default class App extends React.Component<{}, AppState> {

  constructor(props: AppState) {
    super(props);

    this.state = {
      apiKey: Cookies.get('apiKey'),
      username: undefined,
      permissions: undefined
    };
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
              { ({ apiKey, username, setSession }) => {
                if (!apiKey) {
                  return <Login />
                } else if (!username) {
                  this.getSession(apiKey, setSession);
                  return <Splash />;
                } else {
                  return <Home />
                }
              }}
            </AppContext.Consumer>
          </BrowserRouter>
        </AppContext.Provider>
      </ThemeProvider>
    );
  }

  getSession = async (apiKey: string, setSession: (username: string, permissions: string[]) => void) => {
    try {
      const response = await new Network(apiKey).doGet('/api/latest/session');
      const username = response.session.username;
      const permissions = response.session.permissions;

      setSession(username, permissions);
    } catch (err) {

    }
  }
}
