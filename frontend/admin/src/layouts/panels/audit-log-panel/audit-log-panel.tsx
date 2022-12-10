import { ExpandLess, ExpandMore, NotInterested } from "@mui/icons-material";
import { Avatar, Box, CircularProgress, Collapse, List, ListItemAvatar, ListItemButton, ListItemText, Paper, Typography } from "@mui/material";
import { green, orange, red } from "@mui/material/colors";
import { format } from "date-fns";
import Cookies from "js-cookie";
import React from "react";
import ReactDiffViewer from 'react-diff-viewer';
import Network from "../../../utils/network";
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface AuditLogPanelState {
  /**
   * 
   */
  auditLog: Map<number, LogEntry>;
  /**
   * `true` if the panel is in a loading state
   * @default true
   */
  isLoading: boolean;
}

interface LogEntry {
  key: number;
  actor: string|null;
  action: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

export default class AuditLogPanel extends React.Component<{}, AuditLogPanelState> {
  apiKey: string;

  constructor(props: {}) {
    super(props);

    this.state = {
      auditLog: new Map(),
      isLoading: true
    };

    this.apiKey = Cookies.get('apiKey')!;
  }

  componentDidMount() {
    this.getAuditLog();
  }

  render() {
    const panelInfo = Drawer.items["audit-log"];

    const Logs = () => {

      return (
        <Paper sx={{display: 'flex', m: 2}}>
          <List sx={{width: '100%'}}>
            {Array.from(this.state.auditLog).map(([k, l]) => <LogItem key={l.key} log={l} />)}
          </List>
        </Paper>
      );
    };

    return (
      <Box>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} />
        {this.state.isLoading
          ? (<Box sx={{p: 2, textAlign: 'center'}}>
            <CircularProgress sx={{mt: 10}} />
          </Box>)
          : (<Logs />)
        }
      </Box>
    );
  }

  getAuditLog = async () => {
    try {
      const response = await new Network(this.apiKey).doGet('/api/latest/audit-log');
      const auditLogs = response.audit_log;

      for (var i = 0; i < auditLogs.length; ++i) {
        const log: LogEntry = {
          key: auditLogs[i].id,
          actor: auditLogs[i].actor,
          action: auditLogs[i].action,
          oldValue: JSON.parse(auditLogs[i].old || '{}'),
          newValue: JSON.parse(auditLogs[i].new || '{}'),
          timestamp: new Date(auditLogs[i].timestamp)
        };

        this.state.auditLog.set(log.key, log);
      }

      this.setState({
        auditLog: this.state.auditLog,
        isLoading: false
      })
    } catch (err) {

    }
  }
}

class LogItem extends React.Component<{ log: LogEntry }, { isExpanded: boolean }> {

  constructor(props: { log: LogEntry }) {
    super(props);

    this.state = {
      isExpanded: false
    }
  }

  render() {
    return (
      <>
        <ListItemButton onClick={this.toggle} selected={this.state.isExpanded}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: this.getBgColor() }}>
              {this.getAvatar()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={this.createPrimaryText()}
            secondary={format(this.props.log.timestamp, 'MMM d yyyy, h:mm a')}
          />
          {this.state.isExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={this.state.isExpanded} unmountOnExit>
          <ReactDiffViewer
            oldValue={JSON.stringify(this.props.log.oldValue, null, 2)}
            newValue={JSON.stringify(this.props.log.newValue, null, 2)}
            hideLineNumbers
            useDarkTheme
          />
        </Collapse>
      </>
    );
  }

  toggle = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  getBgColor = () => {
    const action = this.props.log.action;

    if (action.includes('ADD')) {
      return green[500];
    } else if (action.includes('DELETE')) {
      return red[500];
    }

    return orange[500];
  }

  getAvatar = () => {
    const action = this.props.log.action;

    if (action.includes('SETTING')) {
      return Drawer.items.settings.icon;
    } else if (action.includes('USER')) {
      return Drawer.items.users.icon;
    } else if (action.includes('DAY')) {
      return Drawer.items.days.icon;
    } else if (action.includes('CATEGORY')) {
      return Drawer.items.categories.icon;
    } else if (action.includes('VENUE')) {
      return Drawer.items.venues.icon;
    } else if (action.includes('EVENT')) {
      return Drawer.items.events.icon;
    } else if (action.includes('PRO_SHOW')) {
      return Drawer.items.shows.icon;
    } else if (action.includes('GALLERY')) {
      return Drawer.items.gallery.icon;
    } else if (action.includes('MERCHANDISE')) {
      return Drawer.items.merchandise.icon;
    } else if (action.includes('SPONSOR')) {
      return Drawer.items.sponsors.icon;
    } else if (action.includes('TEAM')) {
      return Drawer.items.team.icon;
    }

    return <NotInterested />
  }

  createPrimaryText = () => {
    const actor = this.props.log.actor ?? '[deleted]';
    var message = 'performed an action';

    switch (this.props.log.action) {
      case 'SETTINGS_EDIT':
        message = 'eddited site settings';
        break;
      case 'USER_ADD':
        message = 'added a user';
        break;
      case 'USER_EDIT':
        message = 'edited a user';
        break;
      case 'USER_DELETE':
        message = 'deleted a user';
        break;
      case 'DAY_ADD':
        message = 'added a day';
        break;
      case 'DAY_EDIT':
        message = 'edited a day';
        break;
      case 'DAY_DELETE':
        message = 'deleted a day';
        break;
      case 'CATEGORY_ADD':
        message = 'added a category';
        break;
      case 'CATEGORY_EDIT':
        message = 'edited a category';
        break;
      case 'CATEGORY_DELETE':
        message = 'deleted a category';
        break;
      case 'VENUE_ADD':
        message = 'added a venue';
        break;
      case 'VENUE_EDIT':
        message = 'edited a venue';
        break;
      case 'VENUE_DELETE':
        message = 'deleted a venue';
        break;
      case 'ROOM_ADD':
        message = 'added a room';
        break;
      case 'ROOM_EDIT':
        message = 'edited a room';
        break;
      case 'ROOM_DELETE':
        message = 'deleted a room';
        break;
      case 'EVENT_ADD':
        message = 'added a event';
        break;
      case 'EVENT_EDIT':
        message = 'edited a event';
        break;
      case 'EVENT_DELETE':
        message = 'deleted a event';
        break;
      case 'PRO_SHOW_ADD':
        message = 'added a pro show';
        break;
      case 'PRO_SHOW_EDIT':
        message = 'edited a pro show';
        break;
      case 'PRO_SHOW_DELETE':
        message = 'deleted a pro show';
        break;
      case 'GALLERY_ADD':
        message = 'added one or more gallery images';
        break;
      case 'GALLERY_DELETE':
        message = 'deleted a gallery image';
        break;
      case 'MERCHANDISE_ADD':
        message = 'added a merchandise item';
        break;
      case 'MERCHANDISE_EDIT':
        message = 'edited a merchandise item';
        break;
      case 'MERCHANDISE_DELETE':
        message = 'deleted a merchandise item';
        break;
      case 'SPONSOR_ADD':
        message = 'added a sponsor';
        break;
      case 'SPONSOR_EDIT':
        message = 'edited a sponsor';
        break;
      case 'SPONSOR_DELETE':
        message = 'deleted a sponsor';
        break;
      case 'TEAM_ADD':
        message = 'added a team member';
        break;
      case 'TEAM_EDIT':
        message = 'edited a team member';
        break;
      case 'TEAM_DELETE':
        message = 'deleted a team member';
        break;
    }

    return (<><b>{actor}</b> {message}</>);
  }
}
