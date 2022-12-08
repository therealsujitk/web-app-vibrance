import { Box, Typography } from "@mui/material";
import React from "react";
import { Button, TextField } from "../../components";
import Drawer from "../drawer/drawer";
import PanelHeader from "../panel-header/panel-header";

export default class SettingsPanel extends React.Component {

  render() {
    const panelInfo = Drawer.items.settings;

    return (
      <Box>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} />
        <Box sx={(theme) => ({
          p: 2,
          [theme.breakpoints.up("md")]: {
            width: "60%",
          },
        })}>
          <this.Label text="Site Title" mt={0} />
          <this.Input />
          <this.Label text="Site Description" />
          <this.Subtitle text="Enter a short sentence or two that describes this site. This will appear in the meta tag and show up in search engines." />
          <this.Input />
          <Button variant="contained" size="medium" sx={{mt: 2}}>Save Changes</Button>
        </Box>
      </Box>
    );
  }

  Label = (props : {text: string; mt?: number;}) => {
    return <Typography variant={'body1'} sx={{fontWeight: 'bold', mt: props.mt ?? 2}}>{props.text}</Typography>;
  }

  Subtitle = (props : {text: string}) => {
    return <Typography variant={'body2'} sx={{mt: 0.5}} color="text.secondary">{props.text}</Typography>;
  }

  Input = () => {
    return <TextField size="small" sx={{mt: 1, width: '100%'}} />;
  }
}
