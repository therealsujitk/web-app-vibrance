import { ExpandLess, ExpandMore, NotInterested } from "@mui/icons-material";
import { Avatar, Box, CircularProgress, Collapse, List, ListItemAvatar, ListItemButton, ListItemText, Paper } from "@mui/material";
import { green, orange, red } from "@mui/material/colors";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { useState } from "react";
import ReactDiffViewer from 'react-diff-viewer';
import { EmptyState } from "../../../components";
import { AppContext } from "../../../contexts/app";
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanel, BasePanelState } from "../base-panel/base-panel";

interface AuditLogPanelState extends BasePanelState {
  /**
   * The list of log entries
   * This is a map instead of an array to prevent duplicates
   */
  auditLog: Map<number, LogEntry>;
}

interface LogEntry {
  id: number;
  actor: string|null;
  action: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

export default class AuditLogPanel extends BasePanel<{}, AuditLogPanelState> {
  apiEndpoint = '/api/latest/audit-log';
  apiKey = Cookies.get('apiKey');

  constructor(props: {}) {
    super(props);

    this.state = {
      auditLog: new Map(),
      isLoading: true,
    };
  }

  logFromResponse = (log: any): LogEntry => {
    return {
      id: log.id,
      actor: log.actor,
      action: log.action,
      oldValue: JSON.parse(log.old || '{}'),
      newValue: JSON.parse(log.new || '{}'),
      timestamp: new Date(log.timestamp),
    };
  }

  handleGetResponse(response: any): void {
    const auditLog = this.state.auditLog;

    for (let i = 0; i < response.audit_log.length; ++i) {
      const log = response.audit_log[i];
      auditLog.set(log.id, this.logFromResponse(log));
    }

    this.setState({ auditLog: auditLog });
  }

  handlePutResponse(_: any): void {
    // This function isn't used in this panel
  }

  handlePatchResponse(_: any): void {
    // This function isn't used in this panel
  }

  handleDeleteResponse(_: number): void {
    // This function isn't used in this panel
  }

  LogItem = (log: LogEntry) => {
    const [isExpanded, toggle] = useState(false);
    const getBgColor = () => {
      const action = log.action;
  
      if (action.includes('ADD')) {
        return green[500];
      } else if (action.includes('DELETE')) {
        return red[500];
      }
  
      return orange[500];
    };
    const getAvatar = () => {
      const action = log.action;
  
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
        return Drawer.items['pro-shows'].icon;
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
    };
    const createPrimaryText = (username?: string) => {
      var actor = log.actor ?? '[deleted]';
      var message = 'performed an action';
  
      if (username === log.actor) {
        actor = `${actor} [you]`;
      }
  
      switch (log.action) {
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
    };

    return (
      <>
        <ListItemButton onClick={() => toggle(!isExpanded)} selected={isExpanded}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: getBgColor() }}>
              {getAvatar()}
            </Avatar>
          </ListItemAvatar>
          <AppContext.Consumer>
            {({username}) => <ListItemText
              primary={createPrimaryText(username)}
              secondary={format(log.timestamp, 'MMM d yyyy, h:mm a')}
            />}
          </AppContext.Consumer>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isExpanded} unmountOnExit>
          <ReactDiffViewer
            oldValue={JSON.stringify(log.oldValue, null, 2)}
            newValue={JSON.stringify(log.newValue, null, 2)}
            hideLineNumbers
            useDarkTheme
          />
        </Collapse>
      </>
    );
  }

  render() {
    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader {...Drawer.items["audit-log"]} />
        <Paper sx={{display: 'flex', flexDirection: 'column', m: 2}}>
          { this.state.isLoading || this.state.auditLog.size != 0 
            ? <List sx={{width: '100%'}}>
                {Array.from(this.state.auditLog).map(([_, log]) => <this.LogItem key={log.id} {...log} />)}
              </List>
            : <EmptyState>User actions will show up here.</EmptyState>
          }
          {this.state.isLoading && <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>}
        </Paper>
      </Box>
    );
  }
}
