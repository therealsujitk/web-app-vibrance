import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, DialogContent, Grid, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { format } from 'date-fns';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, TextField } from '../../../components';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface DaysPanelState {
  /**
   * If `true`, the AddEditDialog is open
   */
  isAddEditDialogOpen: boolean;

  /**
   * If `true`, the DeleteDialog is open
   */
  isDeleteDialogOpen: boolean;

  /**
   * The current day details for the dialog
   */
  currentDay?: DayProps;
}

interface DayProps {
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

  constructor(props : {}) {
    super(props);

    this.state = {
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
    };

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
  }

  render() {
    const panelInfo = Drawer.items.days;

    const DayCard = (props: DayProps) => (
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

    const AddEditDialog = () => (
      <Dialog onClose={() => this.toggleAddEditDialog(false)} open={this.state.isAddEditDialogOpen}>
        <DialogTitle onClose={() => this.toggleAddEditDialog(false)}>{typeof this.state.currentDay === 'undefined' ? 'Add' : 'Edit'} Day</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            <TextField placeholder="Title" value={this.state.currentDay?.title} />
            <TextField placeholder="Date" type="date" value={this.state.currentDay ? format(this.state.currentDay.date, 'yyyy-MM-dd') : ''} />
            <Button variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })}>Save Day</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );

    const DeleteDialog = () => (
      <Dialog onClose={() => this.toggleDeleteDialog(false)} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={() => this.toggleDeleteDialog(false)}>Delete Day</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{this.state.currentDay?.title}</b>?</Typography>
            <Button variant="contained">Delete Day</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );

    var days : DayProps[] = [
      // {
      //   id: 1,
      //   title: 'Day 1',
      //   date: new Date(),
      // },
      // {
      //   id: 2,
      //   title: 'Day 2',
      //   date: new Date(),
      // },
      // {
      //   id: 3,
      //   title: 'Day 3',
      //   date: new Date(),
      // },
      // {
      //   id: 4,
      //   title: 'Sports',
      //   date: new Date(),
      // },
    ];

    return (
      <Box>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Day</MaterialButton>} />
        {days.length != 0 ?
          <Grid spacing={2} sx={{p: 2}} container>
            {days.map(day => 
              <Grid key={day.id} xs={12} sm={6} md={4} lg={3} xl={2} item>
                <DayCard {...day} />
              </Grid>
            )}
          </Grid> :
          <EmptyState>No days have been added yet.</EmptyState>
        }
        <AddEditDialog />
        <DeleteDialog />
      </Box>
    );
  }

  openAddDialog() {
    this.setState({currentDay: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(day: DayProps) {
    this.setState({currentDay: day});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(day: DayProps) {
    this.setState({currentDay: day});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }
}
