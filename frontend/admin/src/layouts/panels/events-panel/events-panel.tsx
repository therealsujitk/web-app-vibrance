import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CurrencyRupee, Schedule } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Autocomplete, Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, DialogContent, IconButton, InputAdornment, Stack, Tooltip, Typography } from "@mui/material";
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import React from "react";
import validator from "validator";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, TextArea, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import { DomEvent, sleep } from '../../../utils/helpers';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface EventsPanelState {
  /**
   * The list of events
   */
  events: { [x: number]: Event };

  /**
   * The current event details for the dialog
   */
  currentEvent?: Event;

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
   * If `true`, the panel is in a loading state
   * @default true
   */
  isLoading: boolean;
}

interface Event {
  /**
   * The unique id of the event
   */
  id: number;

  /**
   * 
   */
  dayId: number;

  /**
   * 
   */
  categoryId: number;

  /**
   * 
   */
  venueId: number;

  /**
   * 
   */
  roomId: number;

  /**
   * 
   */
  title: string;

  /**
   * 
   */
  description: string;

  /**
   * 
   */
  image: string|null;

  /**
   * 
   */
  day: string;

  /**
   * 
   */
  category: string;

  /**
   * 
   */
  venue: string;

  /**
   * 
   */
  room: string|null;

  /**
   * 
   */
  startTime: Date;

  /**
   * 
   */
  endTime: Date;

  /**
   * 
   */
  teamSizeMin: number;

  /**
   * 
   */
  teamSizeMax: number;

  /**
   * 
   */
  cost: number;
}

export default class EventsPanel extends React.Component<{}, EventsPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      events: [],
      currentEvent: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/events';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getEvents(this.onError!);
  }

  render() {
    const panelInfo = Drawer.items['events'];

    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Event</MaterialButton>} />
        <Box sx={{pl: 2, pt: 2}}>
          {this.state.isLoading
            ? (<Box textAlign="center"><CircularProgress sx={{mt: 10}} /></Box>)
            : Object.keys(this.state.events).length != 0
              ? (<Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
                {Object.values(this.state.events).map(event => 
                  <EventCard 
                    key={event.id} 
                    onEdit={this.openEditDialog} 
                    onDelete={this.openDeleteDialog} 
                    {...event} 
                  />)
                }
                </Masonry>)
              : (<EmptyState>No events have been added yet.</EmptyState>)
          }
        </Box>
        <AddEditDialog
          event={this.state.currentEvent}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveEvent} />
        <DeleteDialog
          event={this.state.currentEvent}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteEvent} />
      </Box>
    );
  }

  openAddDialog = () => {
    this.setState({currentEvent: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog = (event: Event) => {
    this.setState({currentEvent: event});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog = (event: Event) => {
    this.setState({currentEvent: event});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getEvents = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl);
      const events = response.events;

      for (var i = 0; i < events.length; ++i) {
        const event: Event = {
          id: events[i].id,
          dayId: events[i].day_id,
          categoryId: events[i].category_id,
          venueId: events[i].venue_id,
          roomId: events[i].room_id,
          title: validator.unescape(events[i].title),
          description: validator.unescape(events[i].description ?? ''),
          image: events[i].image,
          day: validator.unescape(events[i].day),
          category: validator.unescape(events[i].category),
          venue: validator.unescape(events[i].venue),
          room: events[i].room !== null ? validator.unescape(events[i].room) : null,
          teamSizeMin: events[i].team_size_min,
          teamSizeMax: events[i].team_size_max,
          startTime: new Date('2020-01-01 ' + events[i].start_time),
          endTime: new Date('2020-01-01 ' + events[i].end_time),
          cost: events[i].cost
        };

        this.state.events[event.id] = event;
      }

      this.setState({ 
        events: this.state.events,
        isLoading: false
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getEvents(onError) });
    }
  }

  saveEvent = (event: Event) => {
    this.state.events[event.id] = event;
    this.setState({ events: this.state.events });
  }

  deleteEvent = (event: Event) => {
    delete this.state.events[event.id];
    this.setState({ events: this.state.events });
  }
}

interface EventCardProps extends Event {
  onEdit: (props: Event) => void;
  onDelete: (props: Event) => void;
}

interface EventCardState {
  orientation: 'row'|'column';
  isLoaded: boolean;
}

class EventCard extends React.Component<EventCardProps, EventCardState> {

  constructor(props: EventCardProps) {
    super(props);

    this.state = {
      orientation: 'column',
      isLoaded: false
    }
  }

  render() {
    return (
      <Card sx={{ display: 'flex', flexDirection: this.state.orientation }}>
        {this.props.image && <img 
          src={this.props.image} 
          style={{ position: 'absolute', visibility: 'hidden', width: '10px' }} 
          onLoad={this.onImageLoad} 
        />}
        {this.props.image && this.state.isLoaded && <CardMedia 
          sx={{ 
            minWidth: '40%',
            maxWidth: this.state.orientation == 'row' ? '40%' : '100%',
            height: this.state.orientation == 'row' ? '100%' : '150px'
          }} 
          component="img" 
          image={this.props.image} 
        />}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent>
            <Typography variant="h5">{this.props.title}</Typography>
            <Typography variant="body1">{this.props.description}</Typography>
            <Stack direction="row" sx={{ pt: 1, flexWrap: 'wrap', gap: 1, '& svg': {width: '18px'} }}>
              <Chip 
                label={this.props.category} 
                icon={Drawer.items.categories.icon} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={this.props.day} 
                icon={Drawer.items.days.icon} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={this.props.venue + (this.props.room ? ` - ${this.props.room}` : '')} 
                icon={Drawer.items.venues.icon} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={format(this.props.startTime, 'h:mm a') + ' - ' + format(this.props.endTime, 'h:mm a')} 
                icon={<Schedule />} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={this.props.teamSizeMin + (this.props.teamSizeMin !== this.props.teamSizeMax ? ` - ${this.props.teamSizeMax}` : '')} 
                icon={<FontAwesomeIcon icon={["fas", "users"]} />} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={this.props.cost === 0 ? 'Free' : this.props.cost.toFixed(2)} 
                icon={<CurrencyRupee />} 
                sx={{ pl: 0.5 }}
              />
            </Stack>
          </CardContent>
          <CardActions disableSpacing>
            <Tooltip title="Edit">
              <IconButton onClick={() => this.props.onEdit(this.props)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => this.props.onDelete(this.props)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Box>
      </Card>
    );
  }

  onImageLoad = (e: React.SyntheticEvent<HTMLImageElement, DomEvent>) => {
    const width = e.currentTarget.naturalWidth;
    const height = e.currentTarget.naturalHeight;

    if (width > height) {
      this.setState({ orientation: 'column', isLoaded: true });
    } else {
      this.setState({ orientation: 'row', isLoaded: true });
    }
  }
}

interface EventDialogProps {
  /**
   * The event being edited or deleted
   * @default undefined
   */
  event?: Event;

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
  onUpdate: (event: Event) => void;
}

interface EventDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;

  /**
   * `true` if the days are being fetched
   * @default false
   */
  isDaysLoading?: boolean;

  /**
   * `true` if the categories are being fetched
   * @default false
   */
  isCategoriesLoading?: boolean;

  /**
   * `true` if the venues are being fetched
   * @default false
   */
  isVenuesLoading?: boolean;

  /**
   * Autofill options for days
   */
  dayOptions?: { id: number, title: string }[];

  /**
   * Autofill options for categories
   */
  categoryOptions?: { id: number, title: string }[];

  /**
   * Autofill options for venues
   */
  venueOptions?: { id: number, title: string }[];
}

class AddEditDialog extends React.Component<EventDialogProps, EventDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;
  
  selectedDay?: number|null;
  daySearchQuery: string;

  selectedVenue?: number|null;
  venueSearchQuery: string;

  selectedCategory?: number|null;
  categorySearchQuery: string;

  constructor(props: EventDialogProps) {
    super(props);

    this.state = {
      isLoading: false,
      isDaysLoading: false,
      isVenuesLoading: false,
      dayOptions: [],
      categoryOptions: [],
      venueOptions: []
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/events';

    this.formRef = React.createRef();

    this.daySearchQuery = '';
    this.selectedDay = null;

    this.venueSearchQuery = '';
    this.selectedVenue = null;

    this.categorySearchQuery = '';
    this.selectedCategory = null;
  }
  
  render() {
    const id = this.props.event?.id;
    const dayId = this.props.event?.dayId ?? -1;
    const categoryId = this.props.event?.categoryId ?? -1;
    const roomId = this.props.event?.roomId ?? -1;
    const title = this.props.event?.title ?? '';
    const description = this.props.event?.description ?? '';
    const image = this.props.event?.image ?? undefined;
    const day = this.props.event?.day ?? '';
    const category = this.props.event?.category ?? '';
    const venue = (this.props.event?.venue ?? '') + (this.props.event?.room ? ` - ${this.props.event.room}` : '');
    const teamSizeMin = this.props.event?.teamSizeMin ?? '';
    const teamSizeMax = this.props.event?.teamSizeMax ?? '';
    const startTime = this.props.event ? format(this.props.event.startTime, 'HH:mm') : '';
    const endTime = this.props.event ? format(this.props.event.endTime, 'HH:mm') : '';
    const cost = this.props.event?.cost ?? '';

    if (!this.props.opened) {
      this.daySearchQuery = '';
      this.selectedDay = null;

      this.venueSearchQuery = '';
      this.selectedVenue = null;

      this.categorySearchQuery = '';
      this.selectedCategory = null;
    }
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened || false} maxWidth="sm" fullWidth>
        <DialogTitle onClose={this.props.onClose}>{this.props.event ? 'Edit' : 'Add'} Event</DialogTitle>
        <DialogContent>
          <form ref={this.formRef}>
            <input name="id" value={id} type="hidden" />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
              <Stack spacing={1} sx={{ flexGrow: 1, maxWidth: '50%' }}>
                <ImageInput name="image" style={{ height: 'unset', flexGrow: 1 }} defaultValue={image} />
                <TextField name="title" placeholder="Title" defaultValue={title} />
                <TextArea name="description" placeholder="Add a description..." style={{ minWidth: '100%' }} defaultValue={description} />
              </Stack>
              <Stack spacing={1} sx={{ flexGrow: 1, maxWidth: '50%' }}>
                <Autocomplete
                  options={this.state.dayOptions!}
                  getOptionLabel={(day) => day.title}
                  onChange={(_, v) => this.selectedDay = v?.id}
                  onInputChange={(_, v) => (this.daySearchQuery = v, this.query('days'))}
                  onOpen={() => this.query('days')}
                  onClose={() => this.setState({dayOptions: []})}
                  filterOptions={(x) => x}
                  defaultValue={dayId !== -1 ? { id: dayId, title: day } : undefined}
                  loading={this.state.isDaysLoading}
                  renderInput={(params) => 
                    <TextField {...params} placeholder="Select a day" InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {this.state.isDaysLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }} />
                  }
                />
                <Autocomplete
                  options={this.state.categoryOptions!}
                  getOptionLabel={(category) => category.title}
                  onChange={(_, v) => this.selectedCategory = v?.id}
                  onInputChange={(_, v) => (this.categorySearchQuery = v, this.query('categories'))}
                  onOpen={() => this.query('categories')}
                  onClose={() => this.setState({categoryOptions: []})}
                  filterOptions={(x) => x}
                  defaultValue={categoryId !== -1 ? { id: categoryId, title: category } : undefined}
                  loading={this.state.isCategoriesLoading}
                  renderInput={(params) => 
                    <TextField {...params} placeholder="Select a category" InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {this.state.isCategoriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }} />
                  }
                />
                <Autocomplete
                  options={this.state.venueOptions!}
                  getOptionLabel={(venue) => venue.title}
                  onChange={(_, v) => this.selectedVenue = v?.id}
                  onInputChange={(_, v) => (this.venueSearchQuery = v, this.query('venues'))}
                  onOpen={() => this.query('venues')}
                  onClose={() => this.setState({venueOptions: []})}
                  filterOptions={(x) => x}
                  defaultValue={roomId !== -1 ? { id: roomId, title: venue } : undefined}
                  loading={this.state.isVenuesLoading}
                  renderInput={(params) => 
                    <TextField {...params} placeholder="Select a venue" InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {this.state.isVenuesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }} />
                  }
                />
                <Stack direction="row" spacing={1}>
                  <TextField name="team_size_min" placeholder="Min team size" type="number" defaultValue={teamSizeMin} sx={{ flexGrow: 1 }} />
                  <TextField name="team_size_max" placeholder="Max team size" type="number" defaultValue={teamSizeMax} sx={{ flexGrow: 1 }} />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField name="start_time" placeholder="Start Time" type="time" defaultValue={startTime} sx={{ flexGrow: 1 }} />
                  <TextField name="end_time" placeholder="End Time" type="time" defaultValue={endTime} sx={{ flexGrow: 1 }} />
                </Stack>
                <TextField 
                    name="cost" 
                    placeholder="Cost" 
                    type="number" 
                    defaultValue={cost} 
                    InputProps={{ 
                      startAdornment: (
                        <InputAdornment position="start">
                          <CurrencyRupee sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      )
                    }}
                  />
              </Stack>
            </Stack>
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save Event</Button>
                </Stack>
              )}
            </AppContext.Consumer>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  query = async (base: 'days'|'categories'|'venues') => {
    var query = '';

    if (base === 'days') {
      query = this.daySearchQuery;

      if (!this.state.isDaysLoading) {
        this.setState({ isDaysLoading: true });
      }
    } else if (base === 'categories') {
      query = this.categorySearchQuery;

      if (!this.state.isCategoriesLoading) {
        this.setState({ isCategoriesLoading: true });
      }
    } else {
      query = this.venueSearchQuery;

      if (!this.state.isVenuesLoading) {
        this.setState({ isVenuesLoading: true });
      }
    }

    if (query !== '') {
      await sleep(500);
    }

    if (base === 'days') {
      if (query !== this.daySearchQuery) {
        return;
      }
    } else if (base === 'categories') {
      if (query !== this.categorySearchQuery) {
        return;
      }
    } else {
      if (query !== this.venueSearchQuery) {
        return;
      }
    }

    try {
      const response = await new Network(this.apiKey).doGet(`/api/latest/${base}`, { query: { query: query } });

      if (base === 'days' || base === 'categories') {
        const options = [];

        for (var i = 0; i < response[base].length; ++i) {
          options.push({
            id: response[base][i].id,
            title: response[base][i].title,
          });
        }

        if (base === 'days') {
          if (query !== this.daySearchQuery) {
            return;
          }

          this.setState({dayOptions: options});
        } else {
          if (query !== this.categorySearchQuery) {
            return;
          }

          this.setState({categoryOptions: options});
        }
      } else {
        const venues = [];

        for (var i = 0; i < response.venues.length; ++i) {
          for (var j = 0; j < response.venues[i].rooms.length; ++j) {
            const room = response.venues[i].rooms[j];
            venues.push({
              id: room.id,
              title: response.venues[i].title + (room.title ? ` - ${room.title}` : ''),
            });
          }
        }

        if (query !== this.venueSearchQuery) {
          return;
        }

        this.setState({venueOptions: venues});
      }
    } catch (_) {
      // ignore errors
    }

    if (base === 'days') {
      this.setState({ isDaysLoading: false });
    } else if (base === 'categories') {
      this.setState({ isCategoriesLoading: false });
    } else {
      this.setState({ isVenuesLoading: false });
    }
  }

  addEdit = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      const dayId = this.selectedDay === null ? this.props.event?.dayId : this.selectedDay;
      const categoryId = this.selectedCategory === null ? this.props.event?.categoryId : this.selectedCategory;
      const roomId = this.selectedVenue === null ? this.props.event?.roomId : this.selectedVenue;
      var response;

      formData.append('day_id', dayId?.toString() ?? '');
      formData.append('category_id', categoryId?.toString() ?? '');
      formData.append('room_id', roomId?.toString() ?? '');

      if (formData.get('id')) {
        response = await new Network(this.apiKey).doPatch(`${this.apiBaseUrl}/edit`, { body: formData }, true);
      } else {
        response = await new Network(this.apiKey).doPut(`${this.apiBaseUrl}/add`, { body: formData }, true);
      }
      
      this.props.onUpdate({
        id: response.event.id,
        dayId: response.event.day_id,
        categoryId: response.event.category_id,
        venueId: response.event.venue_id,
        roomId: response.event.room_id,
        title: validator.unescape(response.event.title),
        description: validator.unescape(response.event.description ?? ''),
        image: response.event.image,
        day: validator.unescape(response.event.day),
        category: validator.unescape(response.event.category),
        venue: validator.unescape(response.event.venue),
        room: response.event.room ? validator.unescape(response.event.room) : null,
        teamSizeMin: response.event.team_size_min,
        teamSizeMax: response.event.team_size_max,
        startTime: new Date('2020-01-01 ' + response.event.start_time),
        endTime: new Date('2020-01-01 ' + response.event.end_time),
        cost: response.event.cost,
      });
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<EventDialogProps, EventDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: EventDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/events';
  }
  
  render() {
    const id = this.props.event?.id;
    const title = this.props.event ? this.props.event.title : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete Event</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{title}</b>?</Typography>
            <AppContext.Consumer>
              {({ displayError }) => (
                <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete Event</Button>
              )}
            </AppContext.Consumer>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  delete = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData();
      formData.append("id", this.props.event!.id.toString());

      await new Network(this.apiKey).doDelete(`${this.apiBaseUrl}/delete`, { body: formData });
      
      this.props.onUpdate(this.props.event!);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
