import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons/faRightFromBracket";
import { faUserPen } from "@fortawesome/free-solid-svg-icons/faUserPen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AccountCircleOutlined } from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar as MaterialAppBar, Button as MaterialButton, Checkbox, DialogContent, FormControlLabel, IconButton, Menu, MenuItem, Stack, Toolbar, Typography } from "@mui/material";
import Cookies from "js-cookie";
import React from "react";
import { Button, Dialog, DialogTitle, MediaQuery, TextField } from "../../components";
import { AppContext, AppContextInterface } from "../../contexts/app";
import Network from "../../utils/network";

interface AppBarProps {
  /**
   * The title to be displayed in the app bar
   * @default 'Vibrance Dashboard'
   */
  title: string;

  /**
   * If `false` the menu icon will be hidden
   * @default true
   */
  showMenuIcon: boolean;

  /**
   * OnClick listener for the menu icon
   */
  onMenuClick: () => void;
}

interface AppBarState {
  /**
   *
   */
  isSignOutDialogOpen: boolean;

  /**
   * 
   */
  isEditProfileDialogOpen: boolean;
}

export default class AppBar extends React.Component<AppBarProps, AppBarState> {
  static defaultProps : Partial<AppBarProps> = {
    title: 'Vibrance Dashboard',
  };

  static items = {
    editProfile: {
      title: "Edit Profile",
      icon: <FontAwesomeIcon icon={["fas", "user-pen"]} />,
      faIcon: faUserPen,
      onClick: () => {}
    },
    signOut: {
      title: "Sign Out",
      icon: <FontAwesomeIcon icon={["fas", "right-from-bracket"]} />,
      faIcon: faRightFromBracket,
      onClick: () => {}
    }
  };

  apiKey: string;

  constructor(props: AppBarProps) {
    super(props);

    this.state = {
      isSignOutDialogOpen: false,
      isEditProfileDialogOpen: false
    };

    this.apiKey = Cookies.get('apiKey')!;
  }

  render() {
    const SignOutDialog = () => (
      <Dialog onClose={this.closeSignOutDialog} open={this.state.isSignOutDialogOpen || false}>
        <DialogTitle onClose={this.closeSignOutDialog}>Sign Out</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <Typography>Are you sure you want to sign out?</Typography>
            <AppContext.Consumer>
              {({ destroySession }) => (
                <Button variant="contained" onClick={() => this.signOut(destroySession)}>Yes, I'm sure</Button>
              )}
            </AppContext.Consumer>
          </Stack>
        </DialogContent>
      </Dialog>
    )

    const profileItems = AppBar.items;
    profileItems.signOut.onClick = () => this.openSignOutDialog();
    profileItems.editProfile.onClick = () => this.openEditProfileDialog();

    return (
      <>
        <MaterialAppBar position="fixed" sx={{zIndex: 1300}} enableColorOnDark>
          <Toolbar>
            {this.props.showMenuIcon && <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 1 }}
              onClick={() => this.props.onMenuClick()}
            >
              <MenuIcon />
            </IconButton>}
            <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
              { this.props.title }
            </Typography>
            <MediaQuery query={(theme) => theme.breakpoints.up('sm')}>
              {(theme) => theme ? <ProfileButton items={profileItems} /> : <></>}
            </MediaQuery>
          </Toolbar>
        </MaterialAppBar>
        <AppContext.Consumer>
          {({ username, setSession }) => (
            <EditProfileDialog username={username} opened={this.state.isEditProfileDialogOpen} onClose={() => this.closeEditProfileDialog()} onUpdate={setSession} />
          )}
        </AppContext.Consumer>
        <SignOutDialog />
      </>
    );
  }

  openSignOutDialog = () => {
    this.setState({ isSignOutDialogOpen: true });
  }

  closeSignOutDialog = () => {
    this.setState({ isSignOutDialogOpen: false });
  }

  openEditProfileDialog = () => {
    this.setState({ isEditProfileDialogOpen: true });
  }

  closeEditProfileDialog = () => {
    this.setState({ isEditProfileDialogOpen: false });
  }

  signOut = (destroySession: AppContextInterface['destroySession']) => {
    new Network(this.apiKey).doPost('/api/latest/session/logout');
    destroySession();
  }
}

interface ProfileButtonProps {
  items: typeof AppBar.items;
}

interface ProfileButtonState {
  profileMenuAnchor: HTMLElement|null;
}

class ProfileButton extends React.Component<ProfileButtonProps, ProfileButtonState> {

  constructor(props: ProfileButtonProps) {
    super(props);

    this.state = {
      profileMenuAnchor: null
    };
  }

  render() {
    const isOpen = Boolean(this.state.profileMenuAnchor);
    const buttonStyle = {
      color: 'black',
      textTransform: 'none',
      borderRadius: 28,
      paddingLeft: 2,
      paddingRight: 2,
    };

    return (
      <>
        <MaterialButton
          startIcon={<AccountCircleOutlined sx={{ color: 'black' }} />}
          variant="text"
          sx={buttonStyle}
          onClick={this.openProfileMenu}
        >
          <AppContext.Consumer>{({username}) => <span>{username}</span>}</AppContext.Consumer>
        </MaterialButton>
        <Menu 
          open={isOpen}
          anchorEl={this.state.profileMenuAnchor}
          onClose={this.closeProfileMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{ zIndex: 99999 }}
        >
          {Object.entries(this.props.items).map(([key, item]) => (
            <MenuItem key={key} onClick={() => { item.onClick(); this.closeProfileMenu(); }}>
              <span style={{ width: 24, marginRight: 12 }}>{item.icon}</span>{item.title}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  openProfileMenu = (e: React.MouseEvent<HTMLElement>) => {
    this.setState({ profileMenuAnchor: e.currentTarget });
  }

  closeProfileMenu = () => {
    this.setState({ profileMenuAnchor: null });
  }
}

interface EditProfileDialogProps {
  /**
   * The username of the user
   */
  username?: string;

  /**
   * `true` if the dialog is in it's opened state
   * @default false
   */
  opened?: boolean;

  /**
   * On close callback function
   */
  onClose: () => void;

  /**
   * On update callback function
   */
  onUpdate: (username: string, permissions: string[]) => void;
}

interface EditProfileDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;

  isPasswordEditable?: boolean;
}

class EditProfileDialog extends React.Component<EditProfileDialogProps, EditProfileDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;

  constructor(props: EditProfileDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/session';

    this.formRef = React.createRef();
  }
  
  render() {
    const username = this.props.username ?? '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>Edit Profile</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <Stack spacing={1} mt={0.5}>
              <TextField name="username" placeholder="Username" defaultValue={username} disabled={this.state.isLoading} />
              {this.state.isPasswordEditable && <>
                <TextField name="old_password" placeholder="Old Password" type="password" disabled={this.state.isLoading} />
                <TextField name="password" placeholder="New Password" type="password" disabled={this.state.isLoading} />
                <TextField name="repeat_password" placeholder="Repeat Password" type="password" disabled={this.state.isLoading} />
              </>}
              <FormControlLabel
                control={
                  <Checkbox defaultChecked={this.state.isPasswordEditable} />
                }
                onChange={this.togglePassword}
                label="Edit Password"
              />
              <AppContext.Consumer>
                {({ displayError }) => (
                  <Button type="submit" isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save Profile</Button>
                )}
              </AppContext.Consumer>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  togglePassword = () => {
    this.setState({ isPasswordEditable: !this.state.isPasswordEditable });
  }

  addEdit = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);

      if (formData.get('password') !== formData.get('repeat_password')) {
        throw 'Passwords do not match.';
      }

      var response = await new Network(this.apiKey).doPatch(`${this.apiBaseUrl}/edit`, { body: formData });
      
      this.props.onUpdate(response.user.username, response.user.permissions);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
