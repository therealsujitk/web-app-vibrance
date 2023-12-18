import { Box, CircularProgress, FormControlLabel, Switch, Typography } from "@mui/material";
import Cookies from "js-cookie";
import React from "react";
import { Button, TextArea, TextField } from "../../../components";
import { AppContext, AppContextInterface } from "../../../contexts/app";
import Network from "../../../utils/network";
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanelState } from "../base-panel/base-panel";

interface SettingsPanelState extends BasePanelState {
  /**
   * The list of settings
   */
  settings: { [x: string]: any };

  /**
   * If `true`, the panel is in a saving state
   * @default false
   */
  isSaving: boolean;
}

export default class SettingsPanel extends React.Component<{}, SettingsPanelState> {
  apiEndpoint = '/api/latest/settings';
  apiKey = Cookies.get('apiKey');
  onError?: AppContextInterface['displayError'];

  constructor(props: {}) {
    super(props);

    this.state = {
      settings: {},
      isLoading: true,
      isSaving: false,
    };
  }

  componentDidMount() {
    this.getSettings();
  }

  Label = (props : {text: string; mt?: number;}) => {
    return <Typography variant={'body1'} sx={{fontWeight: 'bold', mt: props.mt ?? 2}}>{props.text}</Typography>;
  }

  Subtitle = (props : {text: string}) => {
    return <Typography variant={'body2'} sx={{mt: 0.5}} color="text.secondary">{props.text}</Typography>;
  }

  Input = (props: { settingsKey: string }) => {
    return <TextField size="small" sx={{mt: 1, width: '100%'}} value={this.state.settings[props.settingsKey] ?? ''} onChange={(event) => this.handleChange(event, props.settingsKey)} />;
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>, settingsKey: string) => {
    this.state.settings[settingsKey] = e.target.value;
    this.setState({ settings: this.state.settings });
  }

  getSettings = async () => {
    try {
      const response = await new Network(this.apiKey).doGet(this.apiEndpoint);
      const settings = response.settings;

      this.setState({
        isLoading: false,
        settings: settings,
      });
    } catch (err: any) {
      this.onError?.(err, { name: 'Retry', onClick: () => this.getSettings() });
    }
  }

  saveSettings = async () => {
    this.setState({isSaving: true});

    try {
      const response = await new Network(this.apiKey).doPatch(`${this.apiEndpoint}/edit`, { body: this.state.settings });
      const settings = response.settings;

      this.setState({settings: settings});
    } catch (err: any) {
      this.onError?.(err);
    }

    this.setState({isSaving: false});
  }

  render() {
    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader {...Drawer.items.settings} />
        {this.state.isLoading
          ? (<Box sx={{p: 2, textAlign: 'center'}}>
            <CircularProgress sx={{mt: 10}} />
          </Box>)
          : <Box sx={(theme) => ({
            p: 2,
            [theme.breakpoints.up("md")]: {
              width: "60%",
            },
          })}>
            <this.Label text="Site Title" mt={0} />
            <this.Input settingsKey="site_title" />
            <this.Label text="Site Description" />
            <this.Subtitle text="Enter a short sentence or two that describes this site. This will appear in the meta tag and show up in search engines." />
            <TextArea value={this.state.settings.site_description ?? ''} sx={{ mt: 1, p: 1, height: '75px' }} onChange={(event) => this.handleChange(event, "site_description")} />
            <this.Label text="Read Only Mode" />
            <FormControlLabel control={<Switch defaultChecked={this.state.settings.read_only} onChange={(event) => this.state.settings.read_only = event.target.checked} />} label={<this.Subtitle text="If true, users will not be allowed to make any changes to the data." />} /><br />
            <Button variant="contained" size="medium" sx={{mt: 2}} onClick={() => this.saveSettings()} isLoading={this.state.isSaving}>Save Changes</Button>
          </Box>
        }
      </Box>
    );
  }
}
