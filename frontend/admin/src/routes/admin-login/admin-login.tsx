import { DialogContent, Link, Stack, Theme, Typography } from "@mui/material";
import React from "react";
import { Button, Dialog, DialogTitle, TextField } from "../../components";
import './admin-login.css';

interface AdminLoginProps { }

interface AdminLoginState {
  isLoading: boolean;
}

export default class AdminLogin extends React.Component<AdminLoginProps, AdminLoginState> {
  usernameInput: React.RefObject<HTMLInputElement>;
  passwordInput: React.RefObject<HTMLInputElement>;

  constructor(props: AdminLoginProps) {
    super(props);

    this.state = {
      isLoading: false,
    };

    this.usernameInput = React.createRef();
    this.passwordInput = React.createRef();

    this.signIn.bind(this);
  }

  render() {
    return (
      <Dialog open={true}>
        <DialogTitle>Sign In</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5} mb={1}>
            <TextField inputRef={this.usernameInput} inputProps={{ onKeyDown: this.handleEnter }} placeholder="Username" name="username" type="text" variant="outlined" disabled={this.state.isLoading} centerAlign autoFocus />
            <TextField inputRef={this.passwordInput} inputProps={{ onKeyDown: this.handleEnter }} placeholder="Password" name="password" type="password" variant="outlined" disabled={this.state.isLoading} centerAlign />
            <Button variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} isLoading={this.state.isLoading} onClick={() => this.signIn()}>Sign In</Button>
            <Typography sx={{ textAlign: 'center' }} pt={1} variant="subtitle2">
              Built by <Link href="https://therealsuji.tk" underline="none" target="_blank">@therealsujitk</Link>
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  async signIn() {
    this.setLoading(true);

    const credentials = {
      username: this.usernameInput.current?.value,
      password: this.usernameInput.current?.value,
    };

    this.setLoading(false);
  }

  setLoading = (isLoading : boolean) => {
    this.setState({ isLoading: isLoading });
  }

  handleEnter = (event : React.KeyboardEvent) => {
    if (event.key != 'Enter') {
      return;
    }

    const inputName = event.currentTarget.getAttribute("name");

    if (inputName == 'username') {
      this.passwordInput.current?.focus();
    } else if (inputName == 'password') {
      this.signIn();
    }
  }
}
