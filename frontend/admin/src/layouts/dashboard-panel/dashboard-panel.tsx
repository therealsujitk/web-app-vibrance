import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import Drawer from "../drawer/drawer";
import PanelHeader from "../panel-header/panel-header";

function SystemInfo() {
  const InfoItem = (props : {package : string; version : string;}) => {
    return (
      <Box sx={{display: 'flex', flexDirection: 'column', pr: 3}}>
        <Typography color="text.secondary" variant="subtitle2" sx={{fontWeight: 'bolder'}}>{props.package}</Typography>
        <Typography color="text.secondary" variant="subtitle2">{props.version}</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{display: 'flex', p: 3}}>
      <InfoItem package="Release" version="2022.0.0" />
      <InfoItem package="Node.JS" version="16.14.2" />
      <InfoItem package="MySQL" version="MariaDB 10.4.24" />
    </Paper>
  );
}

export default class DashboardPanel extends React.Component {

  render() {
    const panelInfo = Drawer.items.dashboard;

    return (
      <Box>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} />
        <Box sx={{p: 2}}>
          <SystemInfo />
        </Box>
      </Box>
    );
  }
}
