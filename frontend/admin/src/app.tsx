import { Home, Login } from './routes';
import { BrowserRouter } from 'react-router-dom';
import { DarkTheme } from './theme';
import { ThemeProvider } from '@emotion/react';
import { AppContext, AppContextInterface } from './contexts/app';
import React from 'react';
import Cookies from 'js-cookie';

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
    var appContext: AppContextInterface = {
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

    return (
      <ThemeProvider theme={DarkTheme}>
        <AppContext.Provider value={appContext}>
          <BrowserRouter basename='/admin'>
            <AppContext.Consumer>
              { ({ apiKey }) => apiKey ? <Home /> : <Login /> }
            </AppContext.Consumer>
          </BrowserRouter>
        </AppContext.Provider>
      </ThemeProvider>
    );
  }
}
