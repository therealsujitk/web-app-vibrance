import { CallOutlined, EmailOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Autocomplete, Avatar, Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, DialogContent, IconButton, Link, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, TextArea, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import { sleep } from '../../../utils/helpers';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface ProShowsPanelState {
  /**
   * The list of proShows
   */
  proShows: { [x: number]: ProShow };

  /**
   * The current proShow details for the dialog
   */
  currentProShow?: ProShow;

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

interface ProShow {
  /**
   * The unique id of the proShow
   */
  id: number;

  /**
   * 
   */
  dayId: number;

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
  venue: string;

  /**
   * 
   */
  room: string|null;
}

export default class ProShowsPanel extends React.Component<{}, ProShowsPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      proShows: [],
      currentProShow: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/pro-shows';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getProShows(this.onError!);
  }

  render() {
    const panelInfo = Drawer.items['pro-shows'];

    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Pro Show</MaterialButton>} />
        <Box sx={{pl: 2, pt: 2}}>
          {this.state.isLoading
            ? (<Box textAlign="center"><CircularProgress sx={{mt: 10}} /></Box>)
            : Object.keys(this.state.proShows).length != 0
              ? (<Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
                {Object.values(this.state.proShows).map(proShow => 
                  <ProShowCard 
                    key={proShow.id} 
                    onEdit={this.openEditDialog} 
                    onDelete={this.openDeleteDialog} 
                    {...proShow} 
                  />)
                }
                </Masonry>)
              : (<EmptyState>No pro shows have been added yet.</EmptyState>)
          }
        </Box>
        <AddEditDialog
          proShow={this.state.currentProShow}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveProShow} />
        <DeleteDialog
          proShow={this.state.currentProShow}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteProShow} />
      </Box>
    );
  }

  openAddDialog = () => {
    this.setState({currentProShow: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog = (proShow: ProShow) => {
    this.setState({currentProShow: proShow});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog = (proShow: ProShow) => {
    this.setState({currentProShow: proShow});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getProShows = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl);
      const proShows = response.pro_shows;

      for (var i = 0; i < proShows.length; ++i) {
        const proShow: ProShow = {
          id: proShows[i].id,
          dayId: proShows[i].day_id,
          venueId: proShows[i].venue_id,
          roomId: proShows[i].room_id,
          title: proShows[i].title ?? '',
          description: proShows[i].description ?? '',
          image: proShows[i].image,
          day: proShows[i].day,
          venue: proShows[i].venue,
          room: proShows[i].room,
        };

        this.state.proShows[proShow.id] = proShow;
      }

      this.setState({ 
        proShows: this.state.proShows,
        isLoading: false
      });
    } catch (err) {
      onError(err as string, { name: 'Retry', onClick: () => this.getProShows(onError) });
    }
  }

  saveProShow = (proShow: ProShow) => {
    this.state.proShows[proShow.id] = proShow;
    this.setState({ proShows: this.state.proShows });
  }

  deleteProShow = (proShow: ProShow) => {
    delete this.state.proShows[proShow.id];
    this.setState({ proShows: this.state.proShows });
  }
}

interface ProShowCardProps extends ProShow {
  onEdit: (props: ProShow) => void;
  onDelete: (props: ProShow) => void;
}

interface ProShowCardState {
  orientation: 'row'|'column';
  isLoaded: boolean;
}

class ProShowCard extends React.Component<ProShowCardProps, ProShowCardState> {

  constructor(props: ProShowCardProps) {
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
            <Stack direction="row" sx={{ pt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={this.props.day} 
                icon={Drawer.items.days.icon} 
                sx={{ pl: 1 }}
              />
              <Chip 
                label={this.props.venue + (this.props.room ? ` - ${this.props.room}` : '')} 
                icon={Drawer.items.venues.icon} 
                sx={{ pl: 1 }}
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

  onImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const width = e.currentTarget.naturalWidth;
    const height = e.currentTarget.naturalHeight;

    if (width > height) {
      this.setState({ orientation: 'column', isLoaded: true });
    } else {
      this.setState({ orientation: 'row', isLoaded: true });
    }
  }
}

interface ProShowDialogProps {
  /**
   * The proShow being edited or deleted
   * @default undefined
   */
  proShow?: ProShow;

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
  onUpdate: (proShow: ProShow) => void;
}

interface ProShowDialogState {
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
   * `true` if the venues are being fetched
   * @default false
   */
  isVenuesLoading?: boolean;

  /**
   * Autofill options for days
   */
  dayOptions?: { id: number, title: string }[];

  /**
   * Autofill options for venues
   */
  venueOptions?: { id: number, title: string }[];
}

class AddEditDialog extends React.Component<ProShowDialogProps, ProShowDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;
  
  selectedDay?: number|null;
  daySearchQuery: string;

  selectedVenue?: number|null;
  venueSearchQuery: string;

  constructor(props: ProShowDialogProps) {
    super(props);

    this.state = {
      isLoading: false,
      isDaysLoading: false,
      isVenuesLoading: false,
      dayOptions: [],
      venueOptions: []
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/pro-shows';

    this.formRef = React.createRef();

    this.daySearchQuery = '';
    this.selectedDay = null;

    this.venueSearchQuery = '';
    this.selectedVenue = null;
  }
  
  render() {
    const id = this.props.proShow?.id;
    const dayId = this.props.proShow?.dayId ?? -1;
    const roomId = this.props.proShow?.roomId ?? -1;
    const title = this.props.proShow?.title ?? '';
    const description = this.props.proShow?.description ?? '';
    const image = this.props.proShow?.image ?? undefined;
    const day = this.props.proShow?.day ?? '';
    const venue = (this.props.proShow?.venue ?? '') + (this.props.proShow?.room ? ` - ${this.props.proShow.room}` : '');

    if (!this.props.opened) {
      this.daySearchQuery = '';
      this.selectedDay = null;

      this.venueSearchQuery = '';
      this.selectedVenue = null;
    }
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened || false} maxWidth="sm" fullWidth>
        <DialogTitle onClose={this.props.onClose}>{this.props.proShow ? 'Edit' : 'Add'} Pro Show</DialogTitle>
        <DialogContent>
          <form ref={this.formRef}>
            <input name="id" value={id} type="hidden" />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
              <ImageInput name="image" style={{ height: 'unset', flexGrow: 1 }} defaultValue={image} />
              <Stack spacing={1} sx={{ flexGrow: 1, maxWidth: '60%' }}>
                <TextField name="title" placeholder="Title" defaultValue={title} />
                <TextArea name="description" placeholder="Add a description..." style={{ minWidth: '100%' }} defaultValue={description} />
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
              </Stack>
            </Stack>
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save Pro Show</Button>
                </Stack>
              )}
            </AppContext.Consumer>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  query = async (base: 'days'|'venues') => {
    var query = '';

    if (base === 'days') {
      query = this.daySearchQuery;

      if (!this.state.isDaysLoading) {
        this.setState({ isDaysLoading: true });
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
    } else {
      if (query !== this.venueSearchQuery) {
        return;
      }
    }

    try {
      const response = await new Network(this.apiKey).doGet(`/api/latest/${base}`, { query: { query: query } });

      if (base === 'days') {
        const days = [];

        for (var i = 0; i < response.days.length; ++i) {
          days.push({
            id: response.days[i].id,
            title: response.days[i].title,
          });
        }

        if (query !== this.daySearchQuery) {
          return;
        }

        this.setState({dayOptions: days});
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
    } else {
      this.setState({ isVenuesLoading: false });
    }
  }

  addEdit = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      const dayId = this.selectedDay === null ? this.props.proShow?.dayId : this.selectedDay;
      const roomId = this.selectedVenue === null ? this.props.proShow?.roomId : this.selectedVenue;

      formData.append('day_id', dayId?.toString() ?? '');
      formData.append('room_id', roomId?.toString() ?? '');

      const response = await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/${formData.get('id') ? 'edit' : 'add'}`, { body: formData }, true);
      
      this.props.onUpdate({
        id: response.pro_show.id,
        dayId: response.pro_show.day_id,
        venueId: response.pro_show.venue_id,
        roomId: response.pro_show.room_id,
        title: response.pro_show.title,
        description: response.pro_show.description,
        image: response.pro_show.image,
        day: response.pro_show.day,
        venue: response.pro_show.venue,
        room: response.pro_show.room,
      });
      this.props.onClose();
    } catch (err) {
      onError(err as string);
    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<ProShowDialogProps, ProShowDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: ProShowDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/pro-shows';
  }
  
  render() {
    const id = this.props.proShow?.id;
    const title = this.props.proShow ? this.props.proShow.title : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete Pro Show</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{title}</b>?</Typography>
            <AppContext.Consumer>
              {({ displayError }) => (
                <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete Pro Show</Button>
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
      const proShow = {
        id: this.props.proShow!.id.toString()
      }
      const f = new FormData();
      f.append("id", this.props.proShow!.id.toString());

      await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/delete`, { body: f });
      
      this.props.onUpdate(this.props.proShow!);
      this.props.onClose();
    } catch (err) {
      onError(err as string);
    }

    this.setState({ isLoading: false });
  }
}