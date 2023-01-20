import { Box, CircularProgress, Typography } from "@mui/material";
import Cookies from "js-cookie";
import React from "react";
import validator from 'validator';
import { Button, TextArea, TextField } from "../../../components";
import { AppContext, AppContextInterface } from "../../../contexts/app";
import Network from "../../../utils/network";
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface SettingsPanelState {
  /**
   * The list of settings
   */
  settings: { [x: string]: string };

  /**
   * If `true`, the panel is in a loading state
   * @default true
   */
  isLoading: boolean;

  /**
   * If `true`, the panel is in a saving state
   */
  isSaving: boolean;
}

export default class SettingsPanel extends React.Component<{}, SettingsPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  onError?: AppContextInterface['displayError'];

  constructor(props: {}) {
    super(props);

    this.state = {
      settings: {},
      isLoading: true,
      isSaving: false,
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/settings';
  }

  componentDidMount() {
    this.getSettings(this.onError!);
  }

  render() {
    const panelInfo = Drawer.items.settings;

    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} />
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
            <this.Input settingsKey="SITE_TITLE" />
            <this.Label text="Site Description" />
            <this.Subtitle text="Enter a short sentence or two that describes this site. This will appear in the meta tag and show up in search engines." />
            <TextArea value={this.state.settings.SITE_DESCRIPTION ?? ''} sx={{ mt: 1, p: 1, height: '75px' }} onChange={(event) => this.handleChange(event, "SITE_DESCRIPTION")} />
            <Button variant="contained" size="medium" sx={{mt: 2}} onClick={() => this.saveSettings(this.onError!)} isLoading={this.state.isSaving}>Save Changes</Button>
          </Box>
        }
      </Box>
    );
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
    settingsKey in this.state.settings && (this.state.settings[settingsKey] = e.target.value);
    this.setState({ settings: this.state.settings });
  }

  getSettings = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network(this.apiKey).doGet(this.apiBaseUrl);
      const settings = response.settings;

      for (const key in settings) {
        settings[key] = validator.unescape(settings[key]);
      }

      this.setState({
        isLoading: false,
        settings: settings
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getSettings(onError) });
    }
  }

  saveSettings = async (onError: AppContextInterface['displayError']) => {
    this.setState({isSaving: true});

    try {
      const response = await new Network(this.apiKey).doPatch(`${this.apiBaseUrl}/edit`, { body: this.state.settings });
      const settings = response.settings;

      for (const key in settings) {
        settings[key] = validator.unescape(settings[key]);
      }

      this.setState({settings: settings});
    } catch (err: any) {
      onError(err);
    }

    this.setState({isSaving: false});
  }
}
