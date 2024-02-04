import { CurrencyRupee } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, CircularProgress, DialogContent, IconButton, InputAdornment, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import { useState } from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, TextField } from '../../../components';
import { AppContext } from '../../../contexts/app';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanel, BasePanelState } from '../base-panel/base-panel';

interface MerchandisePanelState extends BasePanelState {
  /**
   * The list of merchandise
   */
  merchandise: Map<number, Merchandise>;

  /**
   * The murchandise currently being edited
   */
  editingMerchandise?: Merchandise;

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

interface Merchandise {
  id: number;
  title: string;
  cost: number;
  image: string|null;
}

export default class MerchandisePanel extends BasePanel<{}, MerchandisePanelState> {
  apiEndpoint = '/api/latest/merchandise';
  apiKey = Cookies.get('apiKey');
  requireMultipart = true;

  constructor(props: {}) {
    super(props);

    this.state = {
      merchandise: new Map(),
      editingMerchandise: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };
  }

  merchandiseFromResponse = (merchandise: any) : Merchandise => {
    return {
      id: merchandise.id,
      title: merchandise.title,
      cost: merchandise.cost,
      image: merchandise.image,
    };
  }

  handleGetResponse(response: any): void {
    const merchandise = this.state.merchandise;

    for (let i = 0; i < response.merchandise.length; ++i) {
      const merch = response.merchandise[i];
      merchandise.set(merch.id, this.merchandiseFromResponse(merch));
    }

    this.setState({ merchandise: merchandise });
  }
  handlePutResponse(response: any): void {
    const merchandise = this.state.merchandise;
    const merch = response.merchandise;
    merchandise.set(merch.id, this.merchandiseFromResponse(merch));
    this.setState({merchandise: merchandise});
  }
  handlePatchResponse(response: any): void {
    this.handlePutResponse(response);
  }
  handleDeleteResponse(id: number): void {
    const merchandise = this.state.merchandise;
    merchandise.delete(id);
    this.setState({merchandise: merchandise});
  }

  MerchandiseCard = (merchandise: Merchandise) => {
    return (
      <Card>
        {merchandise.image && <CardMedia
          component="img"
          height="120"
          image={merchandise.image}
        />}
        <CardContent>
          <Typography variant="h5">{merchandise.title}</Typography>
          <Typography variant="body1" sx={{display: 'flex', alignItems: 'center'}}>
            {merchandise.cost != 0
              ? <><CurrencyRupee sx={{ fontSize: 20 }} />&nbsp;{merchandise.cost.toFixed(2)}</>
              : 'Free'
            }
          </Typography>
        </CardContent>
        <CardActions disableSpacing>
          <Tooltip title="Edit">
            <IconButton onClick={() => {
              this.setState({
                editingMerchandise: merchandise,
                isAddOrEditDialogOpen: true,
              });
            }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => {
              this.setState({
                editingMerchandise: merchandise,
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
    const merchandise = this.state.editingMerchandise;

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen}>
        <DialogTitle onClose={onClose}>{merchandise ? 'Edit' : 'Add'} Merchandise</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={merchandise?.id} type="hidden" />
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <ImageInput name="image" defaultValue={merchandise?.image ?? undefined} onError={displayError} disabled={isLoading} />
                  <TextField name="title" placeholder="Title" defaultValue={merchandise?.title} disabled={isLoading} />
                  <TextField 
                    name="cost" 
                    placeholder="Cost" 
                    type="number" 
                    defaultValue={merchandise?.cost} 
                    disabled={isLoading}
                    InputProps={{ 
                      startAdornment: (
                        <InputAdornment position="start">
                          <CurrencyRupee sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button 
                    type="submit" 
                    isLoading={isLoading} 
                    variant="contained" 
                    sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} 
                    onClick={() => {
                      setLoading(true);
                      this.addOrEditItem().then(_ => onClose()).finally(() => setLoading(false));
                    }}
                  >Save Merchandise</Button>
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
    const merchandise = this.state.editingMerchandise;

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete Merchandise</DialogTitle>
        <DialogContent>
          <input value={merchandise?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{merchandise?.title}</b>?</Typography>
            <Button 
              isLoading={isLoading} 
              variant="contained" 
              onClick={() => {
                setLoading(true);
                this.deleteItem(merchandise!.id).then(_ => onClose()).finally(() => setLoading(false));
              }}
            >Delete Merchandise</Button>
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
        <PanelHeader {...Drawer.items.merchandise} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.setState({editingMerchandise: undefined, isAddOrEditDialogOpen: true})}>Add Merchandise</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.merchandise.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }} spacing={2}>
              {Array.from(this.state.merchandise).map(([_, merchandise]) => 
                <div><this.MerchandiseCard key={merchandise.id} {...merchandise} /></div>)}
              </Masonry>)
            : (<EmptyState>No merchandise have been added yet.</EmptyState>)
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
