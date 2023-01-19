import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons/faRightFromBracket";
import { faUserPen } from "@fortawesome/free-solid-svg-icons/faUserPen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AccountCircleOutlined } from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar as MaterialAppBar, Button, Icon, IconButton, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import React from "react";
import { MediaQuery } from "../../components";
import { AppContext } from "../../contexts/app";

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

export default class AppBar extends React.Component<AppBarProps> {
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

  render() {
    return (
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
            {(theme) => theme ? <ProfileButton /> : <></>}
          </MediaQuery>
        </Toolbar>
      </MaterialAppBar>
    );
  }
}

interface ProfileButtonState {
  profileMenuAnchor: HTMLElement|null;
}

class ProfileButton extends React.Component<{}, ProfileButtonState> {

  constructor(props: {}) {
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
      <div>
        <Button
          startIcon={<AccountCircleOutlined sx={{ color: 'black' }} />}
          variant="text"
          sx={buttonStyle}
          onClick={this.openProfileMenu}
        >
          <AppContext.Consumer>{({username}) => <span>{username}</span>}</AppContext.Consumer>
        </Button>
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
          {Object.entries(AppBar.items).map(([key, item]) => (
            <MenuItem key={key} onClick={() => { item.onClick(); this.closeProfileMenu(); }}>
              <span style={{ width: 24, marginRight: 12 }}>{item.icon}</span>{item.title}
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  }

  openProfileMenu = (e: React.MouseEvent<HTMLElement>) => {
    this.setState({ profileMenuAnchor: e.currentTarget });
  }

  closeProfileMenu = () => {
    this.setState({ profileMenuAnchor: null });
  }
}
