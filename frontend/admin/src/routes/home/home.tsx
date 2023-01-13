import { library } from "@fortawesome/fontawesome-svg-core";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MediaQuery } from "../../components";
import { AppBar, Drawer } from "../../layouts";
import { AuditLogPanel, CategoriesPanel, DashboardPanel, DaysPanel, GalleryPanel, MerchandisePanel, SettingsPanel, SponsorsPanel, TeamPanel, UsersPanel, VenuesPanel } from "../../layouts/panels";

interface HomeState {
  /**
   * If `true`, the drawer is opened
   */
  isDrawerOpen: boolean;
}

export default class Home extends React.Component<{}, HomeState> {

  constructor(props : {}) {
    super(props);

    this.state = {
      isDrawerOpen: false,
    };

    Object.entries(AppBar.items).map(
      ([_, item]) => "faIcon" in item && library.add(item.faIcon)
    );

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
              <Route path="/dashboard" element={<DashboardPanel />}></Route>
              <Route path="/settings" element={<SettingsPanel />}></Route>
              <Route path="/audit-log" element={<AuditLogPanel />}></Route>
              <Route path="/users" element={<UsersPanel />}></Route>
              <Route path="/days" element={<DaysPanel />}></Route>
              <Route path="/categories" element={<CategoriesPanel />}></Route>
              <Route path="/venues" element={<VenuesPanel />}></Route>
              <Route path="/gallery" element={<GalleryPanel />}></Route>
              <Route path="/merchandise" element={<MerchandisePanel />}></Route>
              <Route path="/sponsors" element={<SponsorsPanel />}></Route>
              <Route path="/team" element={<TeamPanel />}></Route>
              <Route path="/" element={<Navigate to="/dashboard" />} />
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
