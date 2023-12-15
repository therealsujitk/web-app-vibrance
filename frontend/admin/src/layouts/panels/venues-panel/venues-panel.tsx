import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, Chip, CircularProgress, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import validator from 'validator';
import { Button, Dialog, DialogTitle, EmptyState, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface VenuesPanelState {
  /**
   * The list of venues
   */
  venues: Map<number, Venue>;

  /**
   * The current venue details for the dialog
   */
  currentVenue?: Venue;

  /**
   * The current room details for the dialog
   */
  currentRoom?: Room;

  /**
   * If `true`, the AddEditDialog is open
   * @default false
   */
  isAddEditDialogOpen: boolean;

  /**
   * If `true`, the DeleteDialog is open
   * @default false
   */
  isDeleteDialogOpen: boolean;

  /**
   * 
   */
  isRoomAction: boolean;

  /**
   * If `true`, the panel is in a loading state
   * @default true
   */
  isLoading: boolean;
}

interface Venue {
  /**
   * The unique id of the venue
   */
  id: number;

  /**
   * The title of the venue
   */
  title: string;

  /**
   * The rooms inside the venue
   */
  rooms: { [x: number]: Room };
}

interface Room {
  /**
   * The unique id of the room
   */
  id: number;

  /**
   * The title of the room
   */
  title: string;
}

export default class VenuesPanel extends React.Component<{}, VenuesPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  page: number;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      venues: new Map(),
      currentVenue: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isRoomAction: false,
      isLoading: true
    };

    this.page = 1;

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/venues';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getVenues(this.onError!);
    document.addEventListener('scroll', this.loadMore);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.loadMore);
  }

  loadMore = (event: Event) => {
    if (this.state.isLoading) {
      return;
    }

    const document = event.target as Document;
    const scrollingElement = document.scrollingElement || document.body;

    if (scrollingElement.scrollTop + scrollingElement.clientHeight >= scrollingElement.scrollHeight - 300) {
      this.setState({ isLoading: true });
      this.getVenues(this.onError!);
    }
  }

  render() {
    const panelInfo = Drawer.items.venues;

    const VenueCard = (props: Venue) => (
      <Card>
        <CardContent>
          <Typography variant="h5">{props.title}</Typography>
          <Stack direction="row" sx={{ pt: 1, flexWrap: 'wrap', gap: 1 }}>
            <Chip icon={<AddIcon />} label="Add room" variant="outlined" onClick={() => this.openAddDialog(props)} />
            {Object.values(props.rooms).flatMap((r, i) => 
              r.title != null ? <Chip key={i} label={r.title} onClick={() => this.openEditDialog(props, r)} onDelete={() => this.openDeleteDialog(props, r)} /> : []
            )}
          </Stack>
        </CardContent>
        <CardActions disableSpacing>
          <Tooltip title="Edit">
            <IconButton onClick={() => this.openEditDialog(props)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => this.openDeleteDialog(props)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    );

    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Venue</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.venues.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
              {Array.from(this.state.venues).map(([_, venue]) => 
                <VenueCard key={venue.id} {...venue} />)}
              </Masonry>)
              : (<EmptyState>No venues have been added yet.</EmptyState>)
          }
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
        </Box>
        <AddEditDialog
          venue={this.state.currentVenue}
          room={this.state.currentRoom}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveVenueOrRoom}
          roomAction={this.state.isRoomAction} />
        <DeleteDialog
          venue={this.state.currentVenue}
          room={this.state.currentRoom}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteVenueOrRoom}
          roomAction={this.state.isRoomAction} />
      </Box>
    );
  }

  openAddDialog(venue?: Venue) {
    this.setState({currentVenue: venue, currentRoom: undefined, isRoomAction: venue !== undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(venue: Venue, room?: Room) {
    this.setState({currentVenue: venue, currentRoom: room, isRoomAction: room !== undefined});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(venue: Venue, room?: Room) {
    this.setState({currentVenue: venue, currentRoom: room, isRoomAction: room !== undefined});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getVenues = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network(this.apiKey).doGet(this.apiBaseUrl, { query: { page: this.page } });
      const venues = response.venues;

      for (var i = 0; i < venues.length; ++i) {
        if (i === 0) {
          this.page = response.next_page;
        }

        const venue: Venue = {
          id: venues[i].id,
          title: validator.unescape(venues[i].title),
          rooms: {}
        };

        for (var j = 0; j < venues[i].rooms.length; ++j) {
          const room = venues[i].rooms[j];
          room.title = room.title ? validator.unescape(room.title) : null;
          venue.rooms[room.id] = room;
        }

        this.state.venues.set(venue.id, venue);
      }

      this.setState({ 
        venues: this.state.venues,
        isLoading: false
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getVenues(onError) });
    }
  }

  saveVenueOrRoom = (venue: Venue, room?: Room) => {
    if (room) {
      this.state.venues.get(venue.id)!.rooms[room.id] = room;
    } else {
      this.state.venues.set(venue.id, {
        ...venue,
        rooms: venue.rooms ?? this.state.venues.get(venue.id)?.rooms ?? {}
      });
    }

    this.setState({ venues: this.state.venues });
  }

  deleteVenueOrRoom = (venue: Venue, room?: Room) => {
    if (room) {
      delete this.state.venues.get(venue.id)!.rooms[room.id];
    } else {
      this.state.venues.delete(venue.id);
    }

    this.setState({ venues: this.state.venues });
  }
}

interface VenueDialogProps {
  /**
   * The venue being edited or deleted
   * @default undefined
   */
  venue?: Venue;

  room?: Room;

  roomAction: boolean;

  /**
   * `true` if the dialog is in it's opened state
   * @default false
   */
  opened?: boolean;

  /**
   * On close callback function
   */
  onClose: () => void;

  /**
   * On update callback function
   */
  onUpdate: (venue: Venue, room?: Room) => void;
}

interface DialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;
}

class AddEditDialog extends React.Component<VenueDialogProps, DialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;

  constructor(props: VenueDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiBaseUrl = '/api/latest/venues';
    this.apiKey = Cookies.get('apiKey')!;

    this.formRef = React.createRef();
  }
  
  render() {
    this.apiBaseUrl = '/api/latest/venues';

    if (this.props.roomAction) {
      this.apiBaseUrl = '/api/latest/venues/rooms';
    }

    const venueId = this.props.venue?.id;
    const roomId = this.props.room?.id;
    const venue = this.props.venue ? this.props.venue.title : '';
    const room = this.props.room ? this.props.room.title : '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>
          {roomId || (venueId && !this.props.roomAction) ? 'Edit' : 'Add'} {this.props.roomAction ? 'Room' : 'Venue'}
        </DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="venue_id" value={venueId} type="hidden" />
            <input name="id" value={this.props.roomAction ? roomId : venueId} type="hidden" />
              <Stack spacing={1} mt={0.5}>
                {this.props.roomAction && <TextField defaultValue={venue} disabled />}
                <TextField placeholder="Title" name="title" defaultValue={this.props.roomAction ? room : venue} disabled={this.state.isLoading} />
                <AppContext.Consumer>
                  {({ displayError }) => (
                    <Button type="submit" isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save {this.props.roomAction ? 'Room' : 'Venue'}</Button>
                  )}
                </AppContext.Consumer>
              </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  addEdit = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      var response;

      if (formData.get('id')) {
        response = await new Network(this.apiKey).doPatch(`${this.apiBaseUrl}/edit`, { body: formData });
      } else {
        response = await new Network(this.apiKey).doPut(`${this.apiBaseUrl}/add`, { body: formData });
      }
      
      if (this.props.roomAction) {
        this.props.onUpdate(this.props.venue!, {
          id: response.room.id,
          title: response.room.title,
        });
      } else {
        this.props.onUpdate({
          id: response.venue.id,
          title: response.venue.title,
          rooms: response.venue.rooms
        });
      }
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<VenueDialogProps, DialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;

  constructor(props: VenueDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiBaseUrl = '/api/latest/venues';
    this.apiKey = Cookies.get('apiKey')!;

    this.formRef = React.createRef();
  }
  
  render() {
    this.apiBaseUrl = '/api/latest/venues';

    if (this.props.roomAction) {
      this.apiBaseUrl = '/api/latest/venues/rooms';
    }

    const venueId = this.props.venue?.id;
    const roomId = this.props.room?.id;
    const venue = this.props.venue ? this.props.venue.title : '';
    const room = this.props.room ? this.props.room.title : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete {this.props.roomAction ? 'Room' : 'Venue'}</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={this.props.roomAction ? roomId : venueId} type="hidden" />
            <Stack spacing={2} mt={0.5}>
              <Typography>Are you sure you want to delete {this.props.roomAction && <><b>{room}</b> under </>}<b>{venue}</b>?</Typography>
              <AppContext.Consumer>
                {({ displayError }) => (
                  <Button type="submit" isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete {this.props.roomAction ? 'Room' : 'Venue'}</Button>
                )}
              </AppContext.Consumer>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  delete = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      await new Network(this.apiKey).doDelete(`${this.apiBaseUrl}/delete`, { body: formData });
      
      this.props.onUpdate(this.props.venue!, this.props.room);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
