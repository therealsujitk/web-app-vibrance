import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, Container, DialogContent, Grid, IconButton, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, Select, TextArea, TextField } from '../../../components';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface SponsorsPanelState {
  /**
   * The list of sponsors
   */
  sponsors: { [x: number]: Sponsor };

  /**
   * The current sponsor details for the dialog
   */
  currentSponsor?: Sponsor;

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

interface Sponsor {
  /**
   * The unique id of the sponsor
   */
  id: number;

  /**
   * The title of the sponsor
   */
  title: string;

  /**
   * The date of the categroy
   */
  description: string;

  /**
   * The image of the sponsor
   */
  image: string|null;
}

export default class SponsorsPanel extends React.Component<{}, SponsorsPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  constructor(props : {}) {
    super(props);

    this.state = {
      sponsors: [],
      currentSponsor: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/sponsors';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getSponsors();
  }

  render() {
    const panelInfo = Drawer.items.sponsors;

    const SponsorCard = (props: Sponsor) => (
      <Card>
        {props.image && <CardMedia
          component="img"
          height="120"
          image={props.image}
        />}
        <CardContent>
          <Typography variant="h5">{props.title}</Typography>
          <Typography variant="body1">{props.description}</Typography>
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
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Sponsor</MaterialButton>} />
        <Box sx={{pl: 2, pt: 2}}>
          {this.state.isLoading
            ? (<Box textAlign="center"><CircularProgress sx={{mt: 10}} /></Box>)
            : Object.keys(this.state.sponsors).length != 0
              ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
                {Object.values(this.state.sponsors).map(sponsor => 
                  <SponsorCard key={sponsor.id} {...sponsor} />)}
                </Masonry>)
              : (<EmptyState>No sponsors have been added yet.</EmptyState>)
          }
        </Box>
        <AddEditDialog
          sponsor={this.state.currentSponsor}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveSponsor} />
        <DeleteDialog
          sponsor={this.state.currentSponsor}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteSponsor} />
      </Box>
    );
  }

  openAddDialog() {
    this.setState({currentSponsor: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(sponsor: Sponsor) {
    this.setState({currentSponsor: sponsor});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(sponsor: Sponsor) {
    this.setState({currentSponsor: sponsor});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getSponsors = async () => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl);
      const sponsors = response.sponsors;

      for (var i = 0; i < sponsors.length; ++i) {
        const sponsor: Sponsor = {
          id: sponsors[i].id,
          title: sponsors[i].title,
          description: sponsors[i].description,
          image: sponsors[i].image
        };

        this.state.sponsors[sponsor.id] = sponsor;
      }

      this.setState({ 
        sponsors: this.state.sponsors,
        isLoading: false
      });
    } catch (err) {

    }
  }

  saveSponsor = (sponsor: Sponsor) => {
    this.state.sponsors[sponsor.id] = sponsor;
    this.setState({ sponsors: this.state.sponsors });
  }

  deleteSponsor = (sponsor: Sponsor) => {
    delete this.state.sponsors[sponsor.id];
    this.setState({ sponsors: this.state.sponsors });
  }
}

interface SponsorDialogProps {
  /**
   * The sponsor being edited or deleted
   * @default undefined
   */
  sponsor?: Sponsor;

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
  onUpdate: (sponsor: Sponsor) => void;
}

interface SponsorDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;
}

class AddEditDialog extends React.Component<SponsorDialogProps, SponsorDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;

  constructor(props: SponsorDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/sponsors';

    this.formRef = React.createRef();
  }
  
  render() {
    const id = this.props.sponsor?.id;
    const title = this.props.sponsor ? this.props.sponsor.title : '';
    const description = this.props.sponsor ? this.props.sponsor.description : '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>{this.props.sponsor ? 'Edit' : 'Add'} Sponsor</DialogTitle>
        <DialogContent>
          <form ref={this.formRef}>
            <input name="id" value={id} type="hidden" />
            <Stack spacing={1} mt={0.5}>
              <ImageInput name="image" defaultValue={this.props.sponsor?.image ?? undefined} />
              <TextField name="title" placeholder="Title" defaultValue={title} disabled={this.state.isLoading} />
              <TextArea name="description" placeholder="Add a description..." defaultValue={description} />
              <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={this.addEdit}>Save Sponsor</Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  addEdit = async () => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      const response = await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/${formData.get('id') ? 'edit' : 'add'}`, { body: formData }, true);
      
      this.props.onUpdate({
        id: response.sponsor.id,
        title: response.sponsor.title,
        description: response.sponsor.description,
        image: response.sponsor.image
      });
      this.props.onClose();
    } catch (err) {

    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<SponsorDialogProps, SponsorDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: SponsorDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/sponsors';
  }
  
  render() {
    const id = this.props.sponsor?.id;
    const title = this.props.sponsor ? this.props.sponsor.title : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete sponsor</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{title}</b>?</Typography>
            <Button isLoading={this.state.isLoading} variant="contained" onClick={this.delete}>Delete Sponsor</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  delete = async () => {
    this.setState({ isLoading: true });

    try {
      const sponsor = {
        id: this.props.sponsor!.id.toString()
      }

      await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/delete`, { body: sponsor });
      
      this.props.onUpdate(this.props.sponsor!);
      this.props.onClose();
    } catch (err) {

    }

    this.setState({ isLoading: false });
  }
}
