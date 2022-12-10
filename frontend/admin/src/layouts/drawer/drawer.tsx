import { faCalendarDay } from "@fortawesome/free-solid-svg-icons/faCalendarDay";
import { faCalendarWeek } from "@fortawesome/free-solid-svg-icons/faCalendarWeek";
import { faChartColumn } from "@fortawesome/free-solid-svg-icons/faChartColumn";
import { faImages } from "@fortawesome/free-solid-svg-icons/faImages";
import { faLandmark } from "@fortawesome/free-solid-svg-icons/faLandmark";
import { faSackDollar } from "@fortawesome/free-solid-svg-icons/faSackDollar";
import { faStore } from "@fortawesome/free-solid-svg-icons/faStore";
import { faTheaterMasks } from "@fortawesome/free-solid-svg-icons/faTheaterMasks";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faUsersGear } from "@fortawesome/free-solid-svg-icons/faUsersGear";
import { faWrench } from "@fortawesome/free-solid-svg-icons/faWrench";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ManageSearch } from "@mui/icons-material";
import CategoryIcon from "@mui/icons-material/Category";
import MaterialDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import React from "react";
import { Link } from "react-router-dom";

interface DrawerProps {
  /**
   * If `true`, the drawer will be permanent
   */
  permanent?: boolean;

  /**
   * If `true`, the drawer will be open
   */
  open?: boolean;

  /**
   * onClose listener
   */
  onClose: () => void;
}

interface DrawerState {
  /**
   * The key of the selected item
   */
  selected: keyof typeof Drawer.items;
}

export default class Drawer extends React.Component<DrawerProps, DrawerState> {
  static items = {
    dashboard: {
      title: "Dashboard",
      description: "Performance, statistics and other information.",
      icon: <FontAwesomeIcon icon={["fas", "chart-column"]} />,
      faIcon: faChartColumn,
    },
    settings: {
      title: "Basic Settings",
      description: "General site settings.",
      icon: <FontAwesomeIcon icon={["fas", "wrench"]} />,
      faIcon: faWrench,
    },
    'audit-log': {
      title: "Audit Log",
      description: "Record of all user activities.",
      icon: <ManageSearch />,
    },
    users: {
      title: "Users",
      description: "Add, edit or remove users.",
      icon: <FontAwesomeIcon icon={["fas", "users-gear"]} />,
      faIcon: faUsersGear,
    },
    days: {
      title: "Days",
      description: "Add, edit or remove days.",
      icon: <FontAwesomeIcon icon={["fas", "calendar-day"]} />,
      faIcon: faCalendarDay,
    },
    categories: {
      title: "Categories",
      description: "Add, edit or remove event categories.",
      icon: <CategoryIcon />,
    },
    venues: {
      title: "Venues",
      description: "Add, edit or remove venues.",
      icon: <FontAwesomeIcon icon={["fas", "landmark"]} />,
      faIcon: faLandmark,
    },
    events: {
      title: "Events",
      description: "Add, edit or remove events.",
      icon: <FontAwesomeIcon icon={["fas", "calendar-week"]} />,
      faIcon: faCalendarWeek,
    },
    shows: {
      title: "Pro Shows",
      description: "Add, edit or remove pro shows.",
      icon: <FontAwesomeIcon icon={["fas", "theater-masks"]} />,
      faIcon: faTheaterMasks,
    },
    gallery: {
      title: "Gallery",
      description: "Add, edit or remove gallery images.",
      icon: <FontAwesomeIcon icon={["fas", "images"]} />,
      faIcon: faImages,
    },
    merchandise: {
      title: "Merchandise",
      description: "Add, edit or remove merchandise.",
      icon: <FontAwesomeIcon icon={["fas", "store"]} />,
      faIcon: faStore,
    },
    sponsors: {
      title: "Sponsors",
      description: "Add, edit or remove gallery sposors.",
      icon: <FontAwesomeIcon icon={["fas", "sack-dollar"]} />,
      faIcon: faSackDollar,
    },
    team: {
      title: "Team Vibrance",
      description: "Add, edit or remove team members.",
      icon: <FontAwesomeIcon icon={["fas", "users"]} />,
      faIcon: faUsers,
    },
  };
  static width = 260;

  constructor(props : DrawerProps) {
    super(props);

    this.state = {
      selected: 'dashboard'
    };

    this.handleClick.bind(this);
  }

  render() {
    return (
      <MaterialDrawer
        variant={this.props.permanent ? 'permanent' : 'temporary'}
        anchor="left"
        open={this.props.open}
        onClose={() => this.props.onClose()}
        sx={{
          "& .MuiPaper-root": {
            backgroundImage: "none",
            bgcolor: "background.default",
            width: Drawer.width,
          },
        }}
      >
        <Toolbar />
        <List>
          {Object.entries(Drawer.items).map(([key, item]) => (
            <Link key={key} to={`/${key}`} style={{color: 'inherit', textDecoration: 'none'}}>
              <ListItemButton selected={key === this.state.selected} onClick={() => this.handleClick(key)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </Link>
          ))}
        </List>
      </MaterialDrawer>
    );
  }

  handleClick(selected: string) {
    this.setState({selected: selected as keyof typeof Drawer.items});
    this.props.onClose();
  }
}
