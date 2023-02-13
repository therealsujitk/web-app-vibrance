import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CircularProgress, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import React from "react";
import validator from "validator";
import { Button, Dialog, DialogTitle, EmptyState, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface DaysPanelState {
  /**
   * The list of days
   */
  days: Map<number, Day>;

  /**
   * The current day details for the dialog
   */
  currentDay?: Day;

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

interface Day {
  /**
   * The unique id of the day
   */
  id: number;

  /**
   * The title of the day
   */
  title: string;

  /**
   * The date of the day
   */
  date: Date;
}

export default class DaysPanel extends React.Component<{}, DaysPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  page: number;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      days: new Map(),
      currentDay: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.page = 1;

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/days';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getDays(this.onError!);
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
      this.getDays(this.onError!);
    }
  }

  render() {
    const panelInfo = Drawer.items.days;

    const DayCard = (props: Day) => (
      <Card sx={{ display: 'flex', flexDirection: 'row' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h5">{props.title}</Typography>
          <Typography variant="body1">{format(props.date, 'do LLL yyyy')}</Typography>
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
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Day</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.days.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
                {Array.from(this.state.days).map(([k, day]) => <DayCard {...day} />)}
              </Masonry>) 
            : (<EmptyState>No days have been added yet.</EmptyState>)
          }
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
        </Box>
        <AddEditDialog
          day={this.state.currentDay}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveDay} />
        <DeleteDialog
          day={this.state.currentDay}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteDay} />
      </Box>
    );
  }

  openAddDialog() {
    this.setState({currentDay: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(day: Day) {
    this.setState({currentDay: day});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(day: Day) {
    this.setState({currentDay: day});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getDays = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network(this.apiKey).doGet(this.apiBaseUrl, { query: { page: this.page } });
      const days = response.days;

      for (var i = 0; i < days.length; ++i) {
        if (i === 0) {
          this.page = response.next_page;
        }

        const day: Day = {
          id: days[i].id,
          title: validator.unescape(days[i].title),
          date: new Date(days[i].date)
        };

        this.state.days.set(day.id, day);
      }

      this.setState({ 
        days: this.state.days,
        isLoading: false
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getDays(onError) });
    }
  }

  saveDay = (day: Day) => {
    this.state.days.set(day.id, day);
    this.setState({ days: this.state.days });
  }

  deleteDay = (day: Day) => {
    this.state.days.delete(day.id);
    this.setState({ days: this.state.days });
  }
}

interface DayDialogProps {
  /**
   * The day being edited or deleted
   * @default undefined
   */
  day?: Day;

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
  onUpdate: (day: Day) => void;
}

interface DayDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;
}

class AddEditDialog extends React.Component<DayDialogProps, DayDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;

  constructor(props: DayDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/days';

    this.formRef = React.createRef();
  }
  
  render() {
    const id = this.props.day?.id;
    const title = this.props.day ? this.props.day.title : '';
    const date = this.props.day ? format(this.props.day.date, 'yyyy-MM-dd') : '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>{this.props.day ? 'Edit' : 'Add'} Day</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={id} type="hidden" />
            <Stack spacing={1} mt={0.5}>
              <TextField placeholder="Title" name="title" defaultValue={title} disabled={this.state.isLoading} />
              <TextField placeholder="Date" type="date" name="date" defaultValue={date} disabled={this.state.isLoading} />
              <AppContext.Consumer>
                {({ displayError }) => (
                  <Button type="submit" isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEditDay(displayError)}>Save Day</Button>
                )}
              </AppContext.Consumer>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  addEditDay = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      var response;

      if (formData.get('id')) {
        response = await new Network(this.apiKey).doPatch(`${this.apiBaseUrl}/edit`, { body: formData });
      } else {
        response = await new Network(this.apiKey).doPut(`${this.apiBaseUrl}/add`, { body: formData });
      }
      
      this.props.onUpdate({
        id: response.day.id,
        title: validator.unescape(response.day.title),
        date: new Date(response.day.date)
      });
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<DayDialogProps, DayDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: DayDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/days';
  }
  
  render() {
    const id = this.props.day?.id;
    const title = this.props.day ? this.props.day.title : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete Day</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{title}</b>?</Typography>
            <AppContext.Consumer>
              {({ displayError }) => (
                <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.deleteDay(displayError)}>Delete Day</Button>
              )}
            </AppContext.Consumer>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  deleteDay = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData();
      formData.append("id", this.props.day!.id.toString());

      await new Network(this.apiKey).doDelete(`${this.apiBaseUrl}/delete`, { body: formData });
      
      this.props.onUpdate(this.props.day!);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
