import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, DialogContent, IconButton, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React, { useState } from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, Select, TextArea, TextField } from '../../../components';
import { AppContext } from '../../../contexts/app';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanel, BasePanelState } from '../base-panel/base-panel';

interface SponsorsPanelState extends BasePanelState {
  /**
   * The list of sponsors
   */
  sponsors: Map<number, Sponsor>;

  /**
   * The types of sponsors
   */
  sponsorTypes: string[];

  /**
   * The sponsor currently being edited
   */
  editingSponsor?: Sponsor;

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

interface Sponsor {
  id: number;
  title: string;
  type: string;
  description: string;
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

export default class SponsorPanel extends BasePanel<{}, SponsorsPanelState> {
  apiEndpoint = '/api/latest/sponsors';
  apiKey = Cookies.get('apiKey');
  requireMultipart = true;

  constructor(props: {}) {
    super(props);

    this.state = {
      sponsors: new Map(),
      sponsorTypes: [],
      editingSponsor: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true,
    };
  }

  sponsorFromResponse = (sponsor: any): Sponsor => {
    return {
      id: sponsor.id,
      title: sponsor.title,
      type: sponsor.type,
      description: sponsor.description,
      image: sponsor.image,
    };
  }

  handleGetResponse(response: any): void {
    const sponsors = this.state.sponsors;

    for (let i = 0; i < response.sponsors.length; ++i) {
      const sponsor = response.sponsors[i];
      sponsors.set(sponsor.id, this.sponsorFromResponse(sponsor));
    }

    this.setState({ 
      sponsors: sponsors,
      sponsorTypes: response.types,
    });
  }

  handlePutResponse(response: any): void {
    const sponsors = this.state.sponsors;
    const sponsor = response.sponsor;
    sponsors.set(sponsor.id, this.sponsorFromResponse(sponsor));
    this.setState({sponsors: sponsors});
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response);
  }

  handleDeleteResponse(id: number): void {
    const sponsors  = this.state.sponsors;
    sponsors.delete(id);
    this.setState({sponsors: sponsors});
  }

  SponsorCard = (sponsor: Sponsor) => {
    return (
      <Card>
        {sponsor.image && <CardMedia
          component="img"
          height="120"
          image={sponsor.image}
        />}
        <CardContent>
          <Typography variant="h5">{sponsor.title}</Typography>
          <Typography variant="body1">{sponsor.description}</Typography>
          <Chip size="small" sx={{ mt: 1 }} label={getSponsorType(sponsor.type)} />
        </CardContent>
        <CardActions disableSpacing>
          <Tooltip title="Edit">
            <IconButton onClick={() => {
              this.setState({
                editingSponsor: sponsor,
                isAddOrEditDialogOpen: true,
              });
            }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => {
              this.setState({
                editingSponsor: sponsor,
                isDeleteDialogOpen: true,
              });
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
    const sponsor = this.state.editingSponsor;

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen}>
        <DialogTitle onClose={onClose}>{sponsor ? 'Edit' : 'Add'} Sponsor</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={sponsor?.id} type="hidden" />
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <ImageInput name="image" defaultValue={sponsor?.image ?? undefined} onError={displayError} disabled={isLoading} />
                  <TextField name="title" placeholder="Title" defaultValue={sponsor?.title} disabled={isLoading} />
                  <Select
                    name="type"
                    defaultValue={sponsor?.type.toLowerCase() ?? 0}
                    disabled={isLoading}>
                    <MenuItem value="0" disabled>Select Type</MenuItem>
                    {this.state.sponsorTypes!.map((type) => <MenuItem value={type.toLowerCase()}>{getSponsorType(type)}</MenuItem>)}
                  </Select>
                  <TextArea name="description" placeholder="Add a description..." defaultValue={sponsor?.description} disabled={isLoading} />
                  <Button 
                    type="submit" 
                    isLoading={isLoading} 
                    variant="contained" 
                    sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} 
                    onClick={() => {
                      setLoading(true);
                      this.addOrEditItem().then(_ => onClose()).finally(() => setLoading(false));
                    }}
                  >Save Sponsor</Button>
                </Stack>
              )}
            </AppContext.Consumer>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  DeleteDialog = () => {
    const [isLoading, setLoading] = useState(false);
    const onClose = () => this.setState({isDeleteDialogOpen: false});
    const sponsor = this.state.editingSponsor;

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete sponsor</DialogTitle>
        <DialogContent>
          <input value={sponsor?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{sponsor?.title}</b>?</Typography>
            <Button 
              isLoading={isLoading} 
              variant="contained" 
              onClick={() => {
                setLoading(true);
                this.deleteItem(sponsor!.id).then(_ => onClose()).finally(() => setLoading(false));
              }}
            >Delete Sponsor</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }
  
  render(): React.ReactNode {
    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader {...Drawer.items.sponsors} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.setState({editingSponsor: undefined, isAddOrEditDialogOpen: true})}>Add Sponsor</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.sponsors.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
              {Array.from(this.state.sponsors).map(([_, sponsor]) => 
                <this.SponsorCard key={sponsor.id} {...sponsor} />)}
              </Masonry>)
            : (<EmptyState>No sponsors have been added yet.</EmptyState>)
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
