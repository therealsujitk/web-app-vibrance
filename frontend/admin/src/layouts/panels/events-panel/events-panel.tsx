import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CurrencyRupee, Face, Schedule } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Autocomplete, Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, DialogContent, IconButton, InputAdornment, Stack, Tooltip, Typography } from "@mui/material";
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, TextArea, TextField } from '../../../components';
import { AppContext } from '../../../contexts/app';
import { DOMEvent } from '../../../utils/helpers';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanel, BasePanelState } from '../base-panel/base-panel';

interface EventsPanelState extends BasePanelState {
  /**
   * The list of events
   */
  events: Map<number, Event>;

  /**
   * The event currently being edited
   */
  editingtEvent?: Event;

  /**
   * If `true`, the AddEditDialog is open
   * @default false
   */
  isAddOrEditDialogOpen: boolean;

  /**
   * If `true`, the DeleteDialog is open
   * @default false
   */
  isDeleteDialogOpen: boolean;
}

interface Event {
  id: number;
  dayId: number;
  categoryId: number;
  venueId: number;
  roomId: number;
  day: string;
  category: string;
  venue: string;
  room: string|null;
  title: string;
  description: string|null;
  image: string|null;
  teamSizeMin: number;
  teamSizeMax: number;
  startTime: Date;
  endTime: Date;
  cost: number;
  facultyCoordinatorName: string|null;
  facultyCoordinatorMobile: string|null;
  studentCoordinatorName: string|null;
  studentCoordinatorMobile: string|null;
  eventId: number;
}

export default class EventsPanel extends BasePanel<{}, EventsPanelState> {
  apiEndpoint = '/api/latest/events';
  apiKey = Cookies.get('apiKey');
  requireMultipart = true;

  constructor(props: {}) {
    super(props);
    
    this.state = {
      events: new Map(),
      editingtEvent: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true,
    };
  }

  eventFromResponse = (event: any): Event => {
    return {
      id: event.id,
      dayId: event.day_id,
      categoryId: event.category_id,
      venueId: event.venue_id,
      roomId: event.room_id,
      day: event.day,
      category: event.category,
      venue: event.venue,
      room: event.room,
      title: event.title,
      description: event.description,
      image: event.image,
      teamSizeMin: event.team_size_min,
      teamSizeMax: event.team_size_max,
      startTime: new Date('2020-01-01 ' + event.start_time),
      endTime: new Date('2020-01-01 ' + event.end_time),
      cost: event.cost,
      facultyCoordinatorName: event.faculty_coordinator_name,
      facultyCoordinatorMobile: event.faculty_coordinator_mobile,
      studentCoordinatorName: event.student_coordinator_name,
      studentCoordinatorMobile: event.student_coordinator_mobile,
      eventId: event.event_id,
    };
  }

  handleGetResponse(response: any): void {
    const events = this.state.events;

    for (let i = 0; i < response.events.length; ++i) {
      const event = response.events[i];
      events.set(event.id, this.eventFromResponse(event));
    }

    this.setState({ events: events });
  }

  handlePutResponse(response: any): void {
    const events = this.state.events;
    const event = response.event;
    events.set(event.id, this.eventFromResponse(event));
    this.setState({events: events});
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response);
  }

  handleDeleteResponse(id: number): void {
    const events = this.state.events;
    events.delete(id);
    this.setState({events: events});
  }

  EventCard = (event: Event) => {
    const [orientation, setOrientation] = useState<'row'|'column'>('column');
    const [isLoaded, setLoaded] = useState(false);
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement, DOMEvent>) => {
      const width = e.currentTarget.naturalWidth;
      const height = e.currentTarget.naturalHeight;
  
      if (width > height) {
        setOrientation('column');
      } else {
        setOrientation('row');
      }

      setLoaded(true);
    }

    return (
      <Card sx={{ display: 'flex', flexDirection: orientation }}>
        {event.image && <img 
          src={event.image} 
          style={{ position: 'absolute', visibility: 'hidden', width: '10px' }} 
          onLoad={onImageLoad} 
        />}
        {event.image && isLoaded && <CardMedia 
          sx={{ 
            minWidth: '40%',
            maxWidth: orientation == 'row' ? '40%' : '100%',
            height: orientation == 'row' ? '100%' : '150px'
          }} 
          component="img" 
          image={event.image} 
        />}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent>
            <Typography variant="h5">{event.title}</Typography>
            <Typography variant="body1">{event.description}</Typography>
            <Stack direction="row" sx={{ pt: 1, flexWrap: 'wrap', gap: 1, '& svg': {width: '18px'} }}>
              <Chip 
                label={event.category} 
                icon={Drawer.items.categories.icon} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={event.day} 
                icon={Drawer.items.days.icon} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={event.venue + (event.room ? ` - ${event.room}` : '')} 
                icon={Drawer.items.venues.icon} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={format(event.startTime, 'h:mm a') + ' - ' + format(event.endTime, 'h:mm a')} 
                icon={<Schedule />} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={event.teamSizeMin + (event.teamSizeMin !== event.teamSizeMax ? ` - ${event.teamSizeMax}` : '')} 
                icon={<FontAwesomeIcon icon={["fas", "users"]} />} 
                sx={{ pl: 0.5 }}
              />
              <Chip 
                label={event.cost === 0 ? 'Free' : event.cost.toFixed(2)} 
                icon={<CurrencyRupee />} 
                sx={{ pl: 0.5 }}
              />
              {event.facultyCoordinatorName && <Chip 
                label={event.facultyCoordinatorName + (event.facultyCoordinatorMobile ? ` - ${event.facultyCoordinatorMobile}` : '')} 
                icon={<Face />} 
                sx={{ pl: 0.5 }}
              />}
              {event.studentCoordinatorName && <Chip 
                label={event.studentCoordinatorName + (event.studentCoordinatorMobile ? ` - ${event.studentCoordinatorMobile}` : '')} 
                icon={<Face />} 
                sx={{ pl: 0.5 }}
              />}
            </Stack>
          </CardContent>
          <CardActions disableSpacing>
            <Tooltip title="Edit">
              <IconButton onClick={() => {
                this.setState({
                  editingtEvent: event,
                  isAddOrEditDialogOpen: true,
                });
              }}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => {
                this.setState({
                  editingtEvent: event,
                  isDeleteDialogOpen: true,
                });
              }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Box>
      </Card>
    );
  }

  AddOrEditDialog = () => {
    const [isLoading, setLoading] = useState(false);
    const [isDaysLoading, setDaysLoading] = useState(false);
    const [isCategoriesLoading, setCategoriesLoading] = useState(false);
    const [isVenuesLoading, setVenuesLoading] = useState(false);
    const [dayOptions, setDayOptions] = useState<any[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [venueOptions, setVenueOptions] = useState<any[]>([]);
    const [dayQuery, setDayQuery] = useState('');
    const [categoryQuery, setCategoryQuery] = useState('');
    const [venueQuery, setVenueQuery] = useState('');
    const [selectedDayId, setDayId] = useState<number>();
    const [selectedCategoryId, setCategoryId] = useState<number>();
    const [selectedVenueId, setVenueId] = useState<number>();
    const onClose = () => this.setState({isAddOrEditDialogOpen: false});
    const event = this.state.editingtEvent;

    const fetchResults = async (type: 'days'|'categories'|'venues') => {
      try {
        const baseUrl = '/api/latest/' + type;
        const query = type === 'days' ? dayQuery : type === 'categories' ? categoryQuery : venueQuery;
        const response = await new Network(this.apiKey).doGet(baseUrl, { query: { query: query } });
        const options: any[] = [];

        for (let i = 0; i < response[type].length; ++i) {
          if (type === 'days') {
            options.push({
              id: response.days[i].id,
              title: response.days[i].title,
              date: new Date(response.days[i].date),
            });
          } else if (type === 'categories') {
            options.push({
              id: response.categories[i].id,
              title: response.categories[i].title,
            });
          } else {
            for (let j = 0; j < response.venues[i].rooms.length; ++j) {
              const room = response.venues[i].rooms[j];
              options.push({
                id: room.id,
                title: response.venues[i].title + (room.title ? ' - ' + room.title : ''),
              });
            }
          }
        }

        if (type === 'days') {
          if (query !== dayQuery) return;
        } else if (type === 'categories') {
          if (query !== categoryQuery) return;
        } else {
          if (query !== venueQuery) return;
        }

        if (type === 'days') {
          setDayOptions(options);
          setDaysLoading(false);
        } else if (type === 'categories') {
          setCategoryOptions(options);
          setCategoriesLoading(false);
        } else {
          setVenueOptions(options);
          setVenuesLoading(false);
        }
      } catch (err: any) {
        this.onError?.(err);
      }
    }

    useEffect(() => {
      setDaysLoading(true);
      const timeout = setTimeout(() => fetchResults('days'), 500);
      return () => clearTimeout(timeout);
    }, [dayQuery]);

    useEffect(() => {
      setCategoriesLoading(true);
      const timeout = setTimeout(() => fetchResults('categories'), 500);
      return () => clearTimeout(timeout);
    }, [categoryQuery]);

    useEffect(() => {
      setVenuesLoading(true);
      const timeout = setTimeout(() => fetchResults('venues'), 500);
      return () => clearTimeout(timeout);
    }, [venueQuery]);

    useEffect(() => {
      setDayId(event?.dayId);
      setCategoryId(event?.categoryId);
      setVenueId(event?.venueId);
    }, [this.state.isAddOrEditDialogOpen]);

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle onClose={onClose}>{event ? 'Edit' : 'Add'} Event</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={event?.id} type="hidden" />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
              <Stack spacing={1} sx={{ flexGrow: 1, maxWidth: '50%' }}>
                <ImageInput name="image" style={{ height: 'unset', flexGrow: 1 }} defaultValue={event?.image ?? undefined} />
                <TextField name="title" placeholder="Title" defaultValue={event?.title} />
                <TextArea name="description" placeholder="Add a description..." style={{ minWidth: '100%' }} defaultValue={event?.description ?? undefined} />
              </Stack>
              <Stack spacing={1} sx={{ flexGrow: 1, maxWidth: '50%' }}>
              <Autocomplete
                  options={dayOptions}
                  getOptionLabel={(day) => day?.title}
                  onInputChange={(_, v) => setDayQuery(v)}
                  onChange={(_, v) => setDayId(v?.id)}
                  onOpen={() => fetchResults('days')}
                  onClose={() => setDayOptions([])}
                  filterOptions={x => x}
                  defaultValue={event ? { id: event.dayId, title: event.day, date: new Date() } : undefined}
                  loading={isDaysLoading}
                  renderInput={(params) => 
                    <>
                      <TextField {...params} placeholder="Select a day" InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {isDaysLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }} />
                      <input name="day_id" value={selectedDayId ?? ''} hidden />
                    </>
                  }
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <span>{option.title}</span>
                      <span style={{ color: 'grey', marginLeft: 'auto', textAlign: 'right' }}>{format(option.date, 'yyyy-MM-dd')}</span>
                    </Box>
                  )}
                  disabled={isLoading}
                />
                <Autocomplete
                  options={categoryOptions}
                  getOptionLabel={(category) => category?.title}
                  onInputChange={(_, v) => setCategoryQuery(v)}
                  onChange={(_, v) => setCategoryId(v?.id)}
                  onOpen={() => fetchResults('categories')}
                  onClose={() => setCategoryOptions([])}
                  filterOptions={x => x}
                  defaultValue={event ? { id: event.categoryId, title: event.category } : undefined}
                  loading={isCategoriesLoading}
                  renderInput={(params) => 
                    <>
                      <TextField {...params} placeholder="Select a category" InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {isCategoriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }} />
                      <input name="category_id" value={selectedCategoryId ?? ''} hidden />
                    </>
                  }
                  disabled={isLoading}
                />
                <Autocomplete
                  options={venueOptions}
                  getOptionLabel={(venue) => venue?.title}
                  onInputChange={(_, v) => setVenueQuery(v)}
                  onChange={(_, v) => setVenueId(v?.id)}
                  onOpen={() => fetchResults('venues')}
                  onClose={() => setVenueOptions([])}
                  filterOptions={x => x}
                  defaultValue={event ? { id: event.roomId, title: event.venue + (event.room ? ' - ' + event.room : '') } : undefined}
                  loading={isVenuesLoading}
                  renderInput={(params) => 
                    <>
                      <TextField {...params} placeholder="Select a venue" InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {isVenuesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }} />
                      <input name="room_id" value={selectedVenueId ?? ''} hidden />
                    </>
                  }
                  disabled={isLoading}
                />
                <Stack direction="row" spacing={1}>
                  <TextField name="team_size_min" placeholder="Min team size" type="number" defaultValue={event?.teamSizeMin} sx={{ flexGrow: 1 }} />
                  <TextField name="team_size_max" placeholder="Max team size" type="number" defaultValue={event?.teamSizeMax} sx={{ flexGrow: 1 }} />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField name="start_time" placeholder="Start Time" type="time" defaultValue={event ? format(event.startTime, 'HH:mm') : ''} sx={{ flexGrow: 1 }} />
                  <TextField name="end_time" placeholder="End Time" type="time" defaultValue={event ? format(event.endTime, 'HH:mm') : ''} sx={{ flexGrow: 1 }} />
                </Stack>
                <TextField 
                  name="cost" 
                  placeholder="Cost" 
                  type="number" 
                  defaultValue={event?.cost} 
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyRupee sx={{ fontSize: 20 }} />
                      </InputAdornment>
                    )
                  }}
                />
                <TextField name="faculty_coordinator_name" placeholder="Faculty Coordinator Name" defaultValue={event?.facultyCoordinatorName} />
                <TextField name="faculty_coordinator_mobile" type="number" placeholder="Faculty Coordinator Mobile" defaultValue={event?.facultyCoordinatorMobile} />
                <TextField name="student_coordinator_name" placeholder="Student Coordinator Name" defaultValue={event?.studentCoordinatorName} />
                <TextField name="student_coordinator_mobile" type="number" placeholder="Student Coordinator Mobile" defaultValue={event?.studentCoordinatorMobile} />
                <TextField name="event_id" type="number" placeholder="Event ID" defaultValue={event?.eventId} />
              </Stack>
            </Stack>
            <Stack spacing={1} mt={0.5}>
                <Button 
                  type="submit" 
                  isLoading={isLoading} 
                  variant="contained" 
                  sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} 
                  onClick={() => {
                    console.log(selectedDayId);
                    setLoading(true);
                    this.addOrEditItem().then(_ => onClose()).finally(() => setLoading(false));
                  }}
                >Save Event</Button>
              </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  DeleteDialog = () => {
    const [isLoading, setLoading] = useState(false);
    const onClose = () => this.setState({isDeleteDialogOpen: false});
    const event = this.state.editingtEvent;

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete Event</DialogTitle>
        <DialogContent>
          <input value={event?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{event?.title}</b>?</Typography>
            <Button 
              isLoading={isLoading} 
              variant="contained" 
              onClick={() => {
                setLoading(true);
                this.deleteItem(event!.id).then(_ => onClose()).finally(() => setLoading(false));
              }}
            >Delete Event</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  render() {
    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader {...Drawer.items.events} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.setState({editingtEvent: undefined, isAddOrEditDialogOpen: true})}>Add Event</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.events.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
              {Array.from(this.state.events).map(([_, event]) => 
                <div><this.EventCard key={event.id} {...event} /></div>)
              }
              </Masonry>)
            : (<EmptyState>No events have been added yet.</EmptyState>)
          }
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
        </Box>
        <this.AddOrEditDialog />
        <this.DeleteDialog />
      </Box>
    );
  }
}
