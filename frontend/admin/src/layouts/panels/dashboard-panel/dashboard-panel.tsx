import { Error, Settings } from "@mui/icons-material";
import { Box, CircularProgress, Divider, Grid, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { format, parse } from "date-fns";
import Cookies from "js-cookie";
import React from "react";
import { MediaQuery, Theme } from "../../../components";
import { AppContext, AppContextInterface } from "../../../contexts/app";
import Network from "../../../utils/network";
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import AnalyticsLineChart from "./analytics-line-chart";
import InfoItem from "./info-item";
import MetricItem from "./metric-item";
import StatsButton from "./stats-button";

interface DashboardPanelState {
  /**
   * `true` if the panel is in a loading state
   * @default true
   */
  isLoading: boolean;

  /**
   * 
   */
  isAnalyticsLoading: boolean;

  /**
   * 
   */
  softwareInfo?: { name: string; version: string }[];

  /**
   * 
   */
  serverStats?: { [x: string]: any };

  /**
   * 
   */
  analyticsEnabled?: boolean;

  /**
   * 
   */
  analyticsData: {
    name: string,
    data: { 
      date: Date,
      value: number,
    }[],
    weekData: {
      oldValue: number,
      newValue: number
    }
  }[];

  /**
   * 
   */
  selectedAnalyticsIndex: number;
}

export default class DashboardPanel extends React.Component<{}, DashboardPanelState> {
  apiKey: string;
  onError?: AppContextInterface['displayError'];

  constructor(props: {}) {
    super(props);

    this.state = {
      isLoading: true,
      isAnalyticsLoading: true,
      analyticsData: [],
      selectedAnalyticsIndex: 0
    };

    this.apiKey = Cookies.get('apiKey')!;
  }

  componentDidMount() {
    this.getDashboard(this.onError!);
  }

  render() {
    const panelInfo = Drawer.items.dashboard;

    const SoftwareInfo = () => (
      <Stack direction="row" spacing={3} sx={{ justifyContent: 'center' }}>
        {this.state.softwareInfo!.map((s) => (
          <InfoItem key={s.name} package={s.name} version={s.version} />
        ))}
      </Stack>
    );

    const ServerStats = () => {
      var usedMemory = this.state.serverStats!.totalMemory - this.state.serverStats!.freeMemory;
      var totalMemory = this.state.serverStats!.totalMemory;
      var unit = 'B';

      if (totalMemory / 1024 > 0) {
        usedMemory /= 1024;
        totalMemory /= 1024;
        unit = 'KB';
      }

      if (totalMemory / 1024 > 0) {
        usedMemory /= 1024;
        totalMemory /= 1024;
        unit = 'MB';
      }

      if (totalMemory / 1024 > 0) {
        usedMemory /= 1024;
        totalMemory /= 1024;
        unit = 'GB';
      }

      return (
        <Stack direction="row" spacing={4} sx={{ justifyContent: 'center' }}>
          <MetricItem
            name="Memory Usage" 
            value={usedMemory}
            total={totalMemory}
            unit={unit}
          />
          <MetricItem 
            name="CPU Usage" 
            value={62}
            total={100}
          />
        </Stack>
      );
    };

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
          : (<Box sx={{p: 2}}>
            <Stack spacing={2}>
              <Paper sx={{
                padding: 3,
                display: 'flex',
                flexDirection: 'row'
              }}>
                <Grid container spacing={2} columns={{ xs: 12, sm: 12 }} sx={{ alignItems: 'center' }}>
                  <Grid item xs={12} sm>
                    <SoftwareInfo />
                  </Grid>
                  <MediaQuery query={(theme) => theme.breakpoints.up('sm')}>
                    {(result) => (
                      <Divider 
                        sx={{ 
                          m: 2, 
                          mb: result ? 0 : 2, 
                          mr: result ? 2 : 0, 
                          flexShrink: 'unset',
                          width: result ? '1px': '100%' 
                        }} 
                        orientation={result ? "vertical" : "horizontal"} 
                        flexItem 
                      />
                    )}
                  </MediaQuery> 
                  <Grid item xs={12} sm>
                    <ServerStats />
                  </Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5" color="text.secondary">
                      Site Analytics
                    </Typography>
                    <Tooltip title="Settings">
                      <IconButton>
                        <Settings />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {(() => {
                    if (!this.state.analyticsEnabled) {
                      return (
                        <Typography variant="h5" color="text.secondary" style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: 200
                        }}>
                          <Error sx={{ mr: 1.5 }} />Analytics is disabled
                        </Typography>
                      );
                    }

                    if (this.state.isAnalyticsLoading) {
                      this.getAnalytics(this.onError!);
                      return;
                    }

                    return (
                      <>
                        <Stack direction="row" spacing={0.5} sx={{ marginTop: '10px' }}>
                          {this.state.analyticsData.map((cat, i) => (
                            <StatsButton 
                              name={cat.name} 
                              key={i}
                              oldValue={cat.weekData.oldValue} 
                              newValue={cat.weekData.newValue} 
                              onClick={() => this.setState({ selectedAnalyticsIndex: i })} 
                              selected={i === this.state.selectedAnalyticsIndex} 
                            />
                          ))}
                        </Stack>
                        <Theme>
                          {(theme) => <AnalyticsLineChart
                            data={{
                              labels: this.state.analyticsData[0].data.slice(0, 7).reverse().map(d => format(d.date, 'd LLL')),
                              datasets: [
                                {
                                  label: "Last 7 days",
                                  data: this.state.analyticsData[this.state.selectedAnalyticsIndex].data.slice(0, 7).reverse().map(d => d.value),
                                  borderColor: theme.palette.primary.main
                                },
                                {
                                  label: "Preceding period",
                                  data: this.state.analyticsData[this.state.selectedAnalyticsIndex].data.slice(7).reverse().map(d => d.value),
                                  borderColor: theme.palette.primary.main,
                                  borderDash: [5, 5],
                                  borderWidth: 1,
                                }
                              ]
                            }}
                            style={{ marginTop: '10px' }}
                          />}
                        </Theme>
                      </>
                    );
                  })()}
                </>
              </Paper>
            </Stack>
          </Box>)
        }
      </Box>
    );
  }

  getDashboard = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network(this.apiKey).doGet('/api/latest/dashboard');

      this.setState({
        softwareInfo: response.software_info,
        serverStats: response.server_stats,
        analyticsEnabled: true,
        isLoading: false
      })
    } catch (err: any) {
      onError(err);
    }
  }

  getAnalytics = async (onError: AppContextInterface['displayError']) => {
    // TODO: Replace sample data with live data
    const response = JSON.parse('[{"name":"Active users","data":[{"date":"20221218","value":"2135"},{"date":"20221217","value":"3847"},{"date":"20221216","value":"3743"},{"date":"20221215","value":"3811"},{"date":"20221214","value":"3698"},{"date":"20221213","value":"3725"},{"date":"20221212","value":"4062"},{"date":"20221211","value":"2488"},{"date":"20221210","value":"1248"},{"date":"20221209","value":"1523"},{"date":"20221208","value":"4022"},{"date":"20221207","value":"4056"},{"date":"20221206","value":"3288"},{"date":"20221205","value":"3012"}],"weekData":{"oldValue":"5700","newValue":"6260"}},{"name":"New users","data":[{"date":"20221218","value":"39"},{"date":"20221217","value":"354"},{"date":"20221216","value":"112"},{"date":"20221215","value":"131"},{"date":"20221214","value":"135"},{"date":"20221213","value":"184"},{"date":"20221212","value":"332"},{"date":"20221211","value":"226"},{"date":"20221210","value":"57"},{"date":"20221209","value":"58"},{"date":"20221208","value":"268"},{"date":"20221207","value":"451"},{"date":"20221206","value":"271"},{"date":"20221205","value":"188"}],"weekData":{"oldValue":"1519","newValue":"1287"}},{"name":"User engagement duration","data":[{"date":"20221218","value":"3440458"},{"date":"20221217","value":"9132827"},{"date":"20221216","value":"6182405"},{"date":"20221215","value":"7650843"},{"date":"20221214","value":"7685549"},{"date":"20221213","value":"7966044"},{"date":"20221212","value":"8708247"},{"date":"20221211","value":"4458946"},{"date":"20221210","value":"2046895"},{"date":"20221209","value":"2432301"},{"date":"20221208","value":"6752901"},{"date":"20221207","value":"8201402"},{"date":"20221206","value":"6004288"},{"date":"20221205","value":"5523166"}],"weekData":{"oldValue":"35419899","newValue":"50766373"}}]');
    const analyticsData: DashboardPanelState['analyticsData'] = [];

    for (var i = 0; i < response.length; ++i) {
      analyticsData.push({
        name: response[i].name,
        data: response[i].data.map((d: any) => ({
          date: parse(d.date, 'yyyyMMdd', new Date()),
          value: d.value
        })),
        weekData: response[i].weekData
      });
    }

    this.setState({ 
      analyticsData: analyticsData,
      selectedAnalyticsIndex: 0,
      isAnalyticsLoading: false,
    });
  }
}
