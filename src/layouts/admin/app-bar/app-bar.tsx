import MenuIcon from "@mui/icons-material/Menu";
import { AppBar as MaterialAppBar, IconButton, Toolbar, Typography } from "@mui/material";
import React from "react";

interface AppBarProps {
  /**
   * The title to be displayed in the app bar
   * @default 'VIT Vibrance'
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
    title: 'VIT Vibrance',
  };

  render() {
    return (
      <MaterialAppBar position="fixed" sx={{zIndex: 9999}} enableColorOnDark>
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
        </Toolbar>
      </MaterialAppBar>
    );
  }
}
