import { SwitchAccessShortcutOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, DialogContent, IconButton, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import validator from 'validator';
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, Select, TextArea, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface SponsorsPanelState {
  /**
   * The list of sponsors
   */
  sponsors: Map<number, Sponsor>;

  /**
   * The types of sponsors
   */
  types: string[];

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
   * 
   */
  type: string;

  /**
   * The date of the categroy
   */
  description: string;

  /**
   * The image of the sponsor
   */
  image: string|null;
}

function getSponsorType(sponsorKey: string) {
  switch (sponsorKey) {
    case 'TITLE':
      return 'Title Sponsor';
    case 'PLATINUM':
      return 'Platinum Sponsor';
    case 'GOLD':
      return 'Gold Sponsor';
    case 'SILVER':
      return 'Silver Sponsor';
    case 'BRONZE':
      return 'Bronze Sponsor';
    case 'FOOD_PARTNER':
      return 'Food Partner';
    case 'MEDIA_PARTNER':
      return 'Media Partner';
    case 'BANKING_PARTNER':
      return 'Banking Partner';
    case 'MERCHANDISE_PARTNER':
      return 'Merchandise Partner';
    default:
      return 'Other';
  }
}

export default class SponsorsPanel extends React.Component<{}, SponsorsPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  page: number;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      sponsors: new Map(),
      types: [],
      currentSponsor: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.page = 1;

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/sponsors';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getSponsors(this.onError!);
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
      this.getSponsors(this.onError!);
    }
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
          <Chip size="small" sx={{ mt: 1 }} label={getSponsorType(props.type)} />
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
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Sponsor</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.sponsors.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
              {Array.from(this.state.sponsors).map(([k, sponsor]) => 
                <SponsorCard key={sponsor.id} {...sponsor} />)}
              </Masonry>)
            : (<EmptyState>No sponsors have been added yet.</EmptyState>)
          }
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
        </Box>
        <AddEditDialog
          sponsor={this.state.currentSponsor}
          types={this.state.types}
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

  getSponsors = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network(this.apiKey).doGet(this.apiBaseUrl, { query: { page: this.page } });
      const sponsors = response.sponsors;

      for (var i = 0; i < sponsors.length; ++i) {
        if (i === 0) {
          this.page = response.next_page;
        }

        const sponsor: Sponsor = {
          id: sponsors[i].id,
          title: validator.unescape(sponsors[i].title),
          type: sponsors[i].type,
          description: validator.unescape(sponsors[i].description || ''),
          image: sponsors[i].image
        };

        this.state.sponsors.set(sponsor.id, sponsor);
      }

      this.setState({ 
        sponsors: this.state.sponsors,
        types: response.types,
        isLoading: false
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getSponsors(onError) });
    }
  }

  saveSponsor = (sponsor: Sponsor) => {
    this.state.sponsors.set(sponsor.id, sponsor);
    this.setState({ sponsors: this.state.sponsors });
  }

  deleteSponsor = (sponsor: Sponsor) => {
    this.state.sponsors.delete(sponsor.id);
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
   * The types of sponsors
   */
  types?: string[];

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
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={id} type="hidden" />
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <ImageInput name="image" defaultValue={this.props.sponsor?.image ?? undefined} onError={displayError} />
                  <TextField name="title" placeholder="Title" defaultValue={title} disabled={this.state.isLoading} />
                  <Select
                    name="type"
                    defaultValue={this.props.sponsor?.type.toLowerCase() ?? 0}
                    disabled={this.state.isLoading}>
                    <MenuItem value="0" disabled>Select Type</MenuItem>
                    {this.props.types!.map((type) => <MenuItem value={type.toLowerCase()}>{getSponsorType(type)}</MenuItem>)}
                  </Select>
                  <TextArea name="description" placeholder="Add a description..." defaultValue={description} />
                  <Button type="submit" isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save Sponsor</Button>
                </Stack>
              )}
            </AppContext.Consumer>
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
        response = await new Network(this.apiKey).doPatch(`${this.apiBaseUrl}/edit`, { body: formData }, true);
      } else {
        response = await new Network(this.apiKey).doPut(`${this.apiBaseUrl}/add`, { body: formData }, true);
      }
      
      this.props.onUpdate({
        id: response.sponsor.id,
        title: validator.unescape(response.sponsor.title),
        type: response.sponsor.type,
        description: validator.unescape(response.sponsor.description || ''),
        image: response.sponsor.image
      });
      this.props.onClose();
    } catch (err: any) {
      onError(err);
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
            <AppContext.Consumer>
              {({ displayError }) => (
                <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete Sponsor</Button>
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
      formData.append("id", this.props.sponsor!.id.toString());

      await new Network(this.apiKey).doDelete(`${this.apiBaseUrl}/delete`, { body: formData });
      
      this.props.onUpdate(this.props.sponsor!);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
