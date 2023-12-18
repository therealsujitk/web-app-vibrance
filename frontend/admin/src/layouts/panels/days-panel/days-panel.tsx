import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CircularProgress, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import { useState } from "react";
import { Button, Dialog, DialogTitle, EmptyState, TextField } from '../../../components';
import { AppContext } from '../../../contexts/app';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanel, BasePanelState } from '../base-panel/base-panel';

interface DaysPanelState extends BasePanelState {
  /**
   * The list of days
   */
  days: Map<number, Day>;

  /**
   * The day currently being edited
   * @default undefined
   */
  editingDay?: Day;

  /**
   * If `true`, the AddOrEditDialog is open
   * @default false
   */
  isAddOrEditDialogOpen: boolean;

  /**
   * If `true`, the DeleteDialog is open
   * @default false
   */
  isDeleteDialogOpen: boolean;
}

interface Day {
  id: number;
  title: string;
  date: Date;
}

export default class DaysPanel extends BasePanel<{}, DaysPanelState> {
  apiEndpoint = '/api/latest/days';
  apiKey = Cookies.get('apiKey');

  constructor(props: {}) {
    super(props);
    
    this.state = {
      days: new Map(),
      editingDay: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };
  }

  dayFromResponse = (day: any): Day => {
    return {
      id: day.id,
      title: day.title,
      date: new Date(day.date),
    };
  }

  handleGetResponse(response: any): void {
    const days = this.state.days;

    for (let i = 0; i < response.days.length; ++i) {
      const day = response.days[i];
      days.set(day.id, this.dayFromResponse(day));
    }

    this.setState({ days: days });
  }

  handlePutResponse(response: any): void {
    const days = this.state.days;
    const day = response.day;
    days.set(day.id, this.dayFromResponse(day));
    this.setState({days: days});
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response);
  }

  handleDeleteResponse(id: number): void {
    const days = this.state.days;
    days.delete(id);
    this.setState({days: days});
  }

  DayCard = (day: Day) => {
    return (
      <Card sx={{ display: 'flex', flexDirection: 'row' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h5">{day.title}</Typography>
          <Typography variant="body1">{format(day.date, 'do LLL yyyy')}</Typography>
        </CardContent>
        <CardActions disableSpacing>
          <Tooltip title="Edit">
            <IconButton onClick={() => {
              this.setState({
                editingDay: day,
                isAddOrEditDialogOpen: true,
              })
            }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => {
              this.setState({
                editingDay: day,
                isDeleteDialogOpen: true,
              })
            }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    );
  }

  AddOrEditDialog = () => {
    const [isLoading, setLoading] = useState(false);
    const onClose = () => this.setState({isAddOrEditDialogOpen: false});
    const day = this.state.editingDay;

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen}>
        <DialogTitle onClose={onClose}>{day ? 'Edit' : 'Add'} Day</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={day?.id} type="hidden" />
            <Stack spacing={1} mt={0.5}>
              <TextField placeholder="Title" name="title" defaultValue={day?.title} disabled={isLoading} />
              <TextField placeholder="Date" type="date" name="date" defaultValue={day?.date ? format(day.date, 'yyyy-MM-dd') : ''} disabled={isLoading} />
              <Button 
                type="submit" 
                isLoading={isLoading}
                variant="contained" 
                sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} 
                onClick={() => {
                  setLoading(true);
                  this.addOrEditItem().then(_ => onClose()).finally(() => setLoading(false));
                }}
              >Save Day</Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  DeleteDialog = () => {
    const [isLoading, setLoading] = useState(false);
    const onClose = () => this.setState({isDeleteDialogOpen: false});
    const day = this.state.editingDay;

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete Day</DialogTitle>
        <DialogContent>
          <input value={day?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{day?.title}</b>?</Typography>
            <Button 
              isLoading={isLoading} 
              variant="contained" 
              onClick={() => {
                setLoading(true);
                this.deleteItem(day!.id).then(_ => onClose()).finally(() => setLoading(false));
              }}
            >Delete Day</Button>
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
        <PanelHeader {...Drawer.items.days} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.setState({editingDay: undefined, isAddOrEditDialogOpen: true})}>Add Day</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.days.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
                {Array.from(this.state.days).map(([_, day]) => <this.DayCard {...day} />)}
              </Masonry>) 
            : (<EmptyState>No days have been added yet.</EmptyState>)
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
