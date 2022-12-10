import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CircularProgress, DialogContent, Grid, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, TextField } from '../../../components';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface DaysPanelState {
  /**
   * The list of days
   */
  days: { [x: number]: Day };

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

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  constructor(props : {}) {
    super(props);

    this.state = {
      days: [],
      currentDay: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/days';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getDays();
  }

  render() {
    const panelInfo = Drawer.items.days;

    const DayCard = (props: Day) => (
      <Card>
        <CardContent>
          <Typography variant="h5">{props.title}</Typography>
          <Typography variant="body1">{format(props.date, 'do LLL yyyy')}</Typography>
        </CardContent>
        <CardActions>
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
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Day</MaterialButton>} />
        {this.state.isLoading
          ? (<Box sx={{p: 2, textAlign: 'center'}}>
            <CircularProgress sx={{mt: 10}} />
          </Box>)
          : Object.keys(this.state.days).length != 0 ?
            (<Grid spacing={2} sx={{p: 2}} container>
              {Object.values(this.state.days).map(day => 
                <Grid key={day.id} xs={12} sm={6} md={4} lg={3} xl={2} item>
                  <DayCard {...day} />
                </Grid>
              )}
            </Grid>) :
            (<EmptyState>No days have been added yet.</EmptyState>)
        }
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

  getDays = async () => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl);
      const days = response.days;

      for (var i = 0; i < days.length; ++i) {
        const day: Day = {
          id: days[i].id,
          title: days[i].title,
          date: new Date(days[i].date)
        };

        this.state.days[day.id] = day;
      }

      this.setState({ 
        days: this.state.days,
        isLoading: false
      });
    } catch (err) {

    }
  }

  saveDay = (day: Day) => {
    this.state.days[day.id] = day;
    this.setState({ days: this.state.days });
  }

  deleteDay = (day: Day) => {
    delete this.state.days[day.id];
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

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  constructor(props: DayDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/days';

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();
  }
  
  render() {
    const id = this.props.day?.id;
    const title = this.props.day ? this.props.day.title : '';
    const date = this.props.day ? format(this.props.day.date, 'yyyy-MM-dd') : '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>{this.props.day ? 'Edit' : 'Add'} Day</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={1} mt={0.5}>
            <TextField placeholder="Title" defaultValue={title} inputRef={this.titleInput} disabled={this.state.isLoading} />
            <TextField placeholder="Date" type="date" defaultValue={date} inputRef={this.dateInput} disabled={this.state.isLoading} />
            <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={this.addEditDay}>Save Day</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  addEditDay = async () => {
    this.setState({ isLoading: true });

    try {
      const day = {
        id: this.props.day?.id.toString(),
        title: this.titleInput.current?.value,
        date: this.dateInput.current?.value
      };

      const response = await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/${day.id ? 'edit' : 'add'}`, { body: day });
      
      this.props.onUpdate({
        id: response.day.id,
        title: response.day.title,
        date: new Date(response.day.date)
      });
      this.props.onClose();
    } catch (err) {

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
            <Button isLoading={this.state.isLoading} variant="contained" onClick={this.deleteDay}>Delete Day</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  deleteDay = async () => {
    this.setState({ isLoading: true });

    try {
      const day = {
        id: this.props.day!.id.toString()
      }

      await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/delete`, { body: day });
      
      this.props.onUpdate(this.props.day!);
      this.props.onClose();
    } catch (err) {

    }

    this.setState({ isLoading: false });
  }
}
