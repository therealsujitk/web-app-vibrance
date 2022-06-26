import { library } from "@fortawesome/fontawesome-svg-core";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import React from "react";
import { Routes } from "react-router-dom";
import { MediaQuery } from "../../components";
import { AppBar, Drawer } from "../../layouts/admin";

interface AdminHomeState {
  /**
   * If `true`, the drawer is opened
   */
  isDrawerOpen: boolean;
}

export default class AdminHome extends React.Component<{}, AdminHomeState> {

  constructor(props : {}) {
    super(props);

    this.state = {
      isDrawerOpen: false,
    };

    Object.entries(Drawer.items).map(
      ([_, item]) => "faIcon" in item && library.add(item.faIcon)
    );
  }

  render() {
    return (
      <MediaQuery query={(theme) => theme.breakpoints.up('md')}>
        {result => <Box>
          <CssBaseline />
          <AppBar showMenuIcon={!result} onMenuClick={() => this.toggleDrawer()} />
          <Box component="nav">
            <Drawer permanent={result} open={this.state.isDrawerOpen} onClose={() => this.toggleDrawer(false)} />
          </Box>
          <Box component="main" sx={{ ml: `${result ? Drawer.width : 0}px`}}>
            <Toolbar />
            <Routes>
            </Routes>
          </Box>
        </Box>}
      </MediaQuery>
    );
  }

  toggleDrawer(isOpen? : boolean) {
    this.setState({isDrawerOpen: isOpen || !this.state.isDrawerOpen});
  }
}
