import { ClearAll, CloudDownload, Error, Settings, SettingsOutlined } from '@mui/icons-material'
import {
  Box,
  Button as MaterialButton,
  CircularProgress,
  DialogContent,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { format, parse } from 'date-fns'
import Cookies from 'js-cookie'
import React, { useState } from 'react'
import { Button, Dialog, DialogTitle, TextArea, TextField, Theme } from '../../../components'
import { AppContext, AppContextInterface } from '../../../contexts/app'
import Network from '../../../utils/network'
import Drawer from '../../drawer/drawer'
import PanelHeader from '../../panel-header/panel-header'
import AnalyticsLineChart from './analytics-line-chart'
import InfoItem from './info-item'
import MetricItem from './metric-item'
import StatsButton from './stats-button'
import { BasePanel, BasePanelState } from '../base-panel/base-panel'

interface DashboardPanelState extends BasePanelState {
  /**
   * The anchor element for the settings menu
   */
  settingsMenuAnchor: HTMLElement | null

  /**
   * The server software information
   */
  softwareInfo?: { name: string; version: string }[]

  /**
   * The server hardware information
   */
  serverStats?: {
    totalMemory: number
    freeMemory: number
    totalDisk: number
    freeDisk: number
    cpuUsage: number
  }

  /**
   * The analytics data
   */
  analyticsData:
    | {
        name: string
        data: {
          date: Date
          value: number
        }[]
        weekData: {
          oldValue: number
          newValue: number
        }
      }[]
    | null

  /**
   * The index of the selected graph in the analytics panel
   * @default 0
   */
  selectedAnalyticsIndex: number

  /**
   * If `true`, the Configure Analytics Dialog is open
   * @default false
   */
  isConfigureAnalyticsDialogOpen: boolean

  /**
   * If `true`, analytics is still loading
   * @default true
   */
  isDashboardLoading: boolean
}

export default class DashboardPanel extends BasePanel<{}, DashboardPanelState> {
  apiEndpoint = '/api/latest/dashboard/analytics'
  apiKey = Cookies.get('apiKey')
  loadOnScroll = false

  onSuccess?: AppContextInterface['displaySuccess']

  constructor(props: {}) {
    super(props)

    this.state = {
      isDashboardLoading: true,
      settingsMenuAnchor: null,
      analyticsData: null,
      selectedAnalyticsIndex: 0,
      isConfigureAnalyticsDialogOpen: false,
      isLoading: true,
    }
  }

  componentDidMount() {
    this.getDashboard()
  }

  putEndpoint = () => this.apiEndpoint + '/configuration/set'
  deleteEndpoint = () => this.apiEndpoint + '/configuration/delete'

  handleGetResponse(response: any): void {
    const analyticsData: DashboardPanelState['analyticsData'] = []

    if (response.analytics !== null) {
      for (var i = 0; i < response.analytics.length; ++i) {
        analyticsData.push({
          name: response.analytics[i].name,
          data: response.analytics[i].data.map((d: any) => ({
            date: parse(d.date, 'yyyyMMdd', new Date()),
            value: d.value,
          })),
          weekData: response.analytics[i].weekData,
        })
      }
    }

    this.setState({
      analyticsData: analyticsData.length === 0 ? null : analyticsData,
      selectedAnalyticsIndex: 0,
    })
  }

  handlePutResponse(_: any): void {
    this.setState({ isLoading: true })
    this.getItems()
  }

  handlePatchResponse(_: any): void {
    // This function isn't used in this panel
  }

  handleDeleteResponse(_: number): void {
    this.setState({ isLoading: true })
    this.getItems()
  }

  AnalyticsSection = () => {
    if (this.state.isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
          }}
        >
          <CircularProgress />
        </Box>
      )
    }

    if (this.state.analyticsData === null) {
      return (
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
          }}
        >
          <Error sx={{ mr: 1.5 }} />
          Analytics is disabled
        </Typography>
      )
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
              formatValue={cat.name.includes('duration') ? 'duration' : 'number'}
              onClick={() => this.setState({ selectedAnalyticsIndex: i })}
              selected={i === this.state.selectedAnalyticsIndex}
            />
          ))}
        </Stack>
        <Theme>
          {(theme) => (
            <AnalyticsLineChart
              data={{
                labels: this.state
                  .analyticsData![0].data.slice(0, 7)
                  .reverse()
                  .map((d) => format(d.date, 'd LLL')),
                datasets: [
                  {
                    label: 'Last 7 days',
                    data: this.state
                      .analyticsData![this.state.selectedAnalyticsIndex].data.slice(0, 7)
                      .reverse()
                      .map((d) => d.value),
                    borderColor: theme.palette.primary.main,
                  },
                  {
                    label: 'Preceding period',
                    data: this.state
                      .analyticsData![this.state.selectedAnalyticsIndex].data.slice(7)
                      .reverse()
                      .map((d) => d.value),
                    borderColor: theme.palette.primary.main,
                    borderDash: [5, 5],
                    borderWidth: 1,
                  },
                ],
              }}
              style={{ marginTop: '10px' }}
              type={
                this.state.analyticsData![this.state.selectedAnalyticsIndex].name.includes('duration')
                  ? 'duration'
                  : 'number'
              }
            />
          )}
        </Theme>
      </>
    )
  }

  ServerStats = () => {
    var usedMemory = this.state.serverStats!.totalMemory - this.state.serverStats!.freeMemory
    var totalMemory = this.state.serverStats!.totalMemory
    var memoryUnit = 'MB'

    if (totalMemory / 1024 > 0) {
      usedMemory /= 1024
      totalMemory /= 1024
      memoryUnit = 'GB'
    }

    var usedDisk = this.state.serverStats!.totalDisk - this.state.serverStats!.freeDisk
    var totalDisk = this.state.serverStats!.totalDisk
    var diskUnit = 'MB'

    if (totalDisk / 1024 > 0) {
      usedDisk /= 1024
      totalDisk /= 1024
      diskUnit = 'GB'
    }

    return (
      <div style={{ width: '100%', overflow: 'auto' }}>
        <Stack direction="row" spacing={5} sx={{ margin: 'auto', width: 'fit-content' }}>
          <MetricItem name="Disk Usage" value={usedDisk} total={totalDisk} unit={diskUnit} />
          <MetricItem name="Memory Usage" value={usedMemory} total={totalMemory} unit={memoryUnit} />
          <MetricItem name="CPU Usage" value={this.state.serverStats!.cpuUsage} total={100} />
        </Stack>
      </div>
    )
  }

  SoftwareInfo = () => {
    const isSettingsMenuOpen = Boolean(this.state.settingsMenuAnchor)

    return (
      <Grid container spacing={2} columns={{ xs: 12, sm: 12 }} sx={{ alignItems: 'center' }}>
        <Grid item xs={12} sm>
          <Stack direction="row" spacing={3}>
            {this.state.softwareInfo!.map((s) => (
              <InfoItem key={s.name} package={s.name} version={s.version} />
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} sm sx={{ textAlign: 'right' }}>
          <MaterialButton
            startIcon={<SettingsOutlined />}
            variant="contained"
            onClick={(event) => this.openSettingsMenu(event)}
          >
            Settings
          </MaterialButton>
          <Menu
            open={isSettingsMenuOpen}
            anchorEl={this.state.settingsMenuAnchor}
            onClose={() => this.closeSettingsMenu()}
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
            <MenuItem
              onClick={() => {
                this.clearCache()
                this.closeSettingsMenu()
              }}
            >
              <span style={{ height: 24, marginRight: 12 }}>
                <ClearAll />
              </span>
              Clear Cache
            </MenuItem>
            <MenuItem
              onClick={() => {
                this.backupDatabase()
                this.closeSettingsMenu()
              }}
            >
              <span style={{ height: 24, marginRight: 12 }}>
                <CloudDownload />
              </span>
              Download Backup
            </MenuItem>
          </Menu>
        </Grid>
      </Grid>
    )
  }

  ConfigureAnalyticsDialog = () => {
    const [isDashboardLoading, setLoading] = useState(false)
    const onClose = () => this.setState({ isConfigureAnalyticsDialogOpen: false })

    if (this.state.analyticsData !== null) {
      return (
        <Dialog onClose={onClose} open={this.state.isConfigureAnalyticsDialogOpen}>
          <DialogTitle onClose={onClose}>Google Analytics</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={0.5}>
              <Typography>Google Analytics has already been configured, would you like to delete it?</Typography>
              <Button
                isLoading={isDashboardLoading}
                variant="contained"
                onClick={() => {
                  setLoading(true)
                  this.deleteItem(0)
                    .then((_) => onClose())
                    .finally(() => setLoading(false))
                }}
              >
                Delete Configuration
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Dialog onClose={onClose} open={this.state.isConfigureAnalyticsDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle onClose={onClose}>Google Analytics</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <Stack spacing={1}>
              <TextField name="ga_property_id" placeholder="Google Analytics Property ID" />
              <TextField name="ga_client_email" placeholder="Google Analytics Data API Client Email" />
              <TextArea
                name="ga_private_key"
                placeholder="Google Analytics Data API Private Key"
                sx={{ minHeight: 200 }}
              />
              <Button
                type="submit"
                isLoading={isDashboardLoading}
                variant="contained"
                sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })}
                onClick={() => {
                  setLoading(true)
                  this.addOrEditItem()
                    .then((_) => onClose())
                    .finally(() => setLoading(false))
                }}
              >
                Save Configuration
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  render() {
    return (
      <Box>
        <AppContext.Consumer>
          {({ displayError, displaySuccess }) => (
            <>{(this.onError = displayError) && (this.onSuccess = displaySuccess)}</>
          )}
        </AppContext.Consumer>
        <PanelHeader {...Drawer.items.dashboard} />
        {this.state.isDashboardLoading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress sx={{ mt: 10 }} />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Paper
                sx={{
                  padding: 3,
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                <this.SoftwareInfo />
              </Paper>
              <Paper sx={{ p: 3 }}>
                <this.ServerStats />
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h5" color="text.secondary">
                    Site Analytics
                  </Typography>
                  {!this.state.isLoading && (
                    <Tooltip title="Configure Analytics">
                      <IconButton onClick={() => this.setState({ isConfigureAnalyticsDialogOpen: true })}>
                        <Settings />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <this.AnalyticsSection />
              </Paper>
            </Stack>
          </Box>
        )}
        <this.ConfigureAnalyticsDialog />
      </Box>
    )
  }

  openSettingsMenu = (e: React.MouseEvent<HTMLElement>) => {
    this.setState({ settingsMenuAnchor: e.currentTarget })
  }

  closeSettingsMenu = () => {
    this.setState({ settingsMenuAnchor: null })
  }

  getDashboard = async () => {
    try {
      const response = await new Network(this.apiKey).doGet('/api/latest/dashboard')

      this.setState({
        softwareInfo: response.software_info,
        serverStats: {
          totalMemory: Number(response.server_stats.total_memory),
          freeMemory: Number(response.server_stats.total_memory),
          totalDisk: Number(response.server_stats.total_disk),
          freeDisk: Number(response.server_stats.total_disk),
          cpuUsage: 0,
        },
        isDashboardLoading: false,
      })

      setTimeout(() => {
        this.setState({
          serverStats: {
            totalMemory: Number(response.server_stats.total_memory),
            freeMemory: Number(response.server_stats.free_memory),
            totalDisk: Number(response.server_stats.total_disk),
            freeDisk: Number(response.server_stats.free_disk),
            cpuUsage: Number(response.server_stats.cpu_usage),
          },
        })
      }, 300)

      this.getItems() // After the dashboard is loaded, we get the analytics data
    } catch (err: any) {
      this.onError?.(err, { name: 'Retry', onClick: () => this.getDashboard() })
    }
  }

  clearCache = async () => {
    try {
      await new Network(this.apiKey).doPost('/api/latest/settings/clear-cache')
      this.onSuccess?.('Cache has been flushed.')
    } catch (err: any) {
      this.onError?.(err)
    }
  }

  backupDatabase = async () => {
    fetch('/api/latest/settings/backup', {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey!,
      },
    })
      .then(async (res) => {
        const blob = await res.blob()
        const fileName = res.headers.get('Content-Disposition')?.split('filename=')[1].split(';')[0]
        const file = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = file
        a.download = fileName ?? 'vibrance.sql'
        a.click()
      })
      .catch((err: any) => this.onError?.(err))
  }
}
