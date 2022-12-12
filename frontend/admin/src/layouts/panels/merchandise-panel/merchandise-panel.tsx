import { CurrencyRupee } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, Container, DialogContent, Grid, IconButton, InputAdornment, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, Select, TextField } from '../../../components';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface MerchandisePanelState {
  /**
   * The list of merchandise
   */
  merchandise: { [x: number]: Merchandise };

  /**
   * The current merchandise details for the dialog
   */
  currentMerchandise?: Merchandise;

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

interface Merchandise {
  /**
   * The unique id of the merchandise
   */
  id: number;

  /**
   * The title of the merchandise
   */
  title: string;

  /**
   * The date of the categroy
   */
  cost: number;

  /**
   * The image of the merchandise
   */
  image: string|null;
}

export default class MerchandisePanel extends React.Component<{}, MerchandisePanelState> {
  apiKey: string;
  apiBaseUrl: string;

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  constructor(props : {}) {
    super(props);

    this.state = {
      merchandise: [],
      currentMerchandise: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/merchandise';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getMerchandise();
  }

  render() {
    const panelInfo = Drawer.items.merchandise;

    const MerchandiseCard = (props: Merchandise) => (
      <Card>
        {props.image && <CardMedia
          component="img"
          height="120"
          image={props.image}
        />}
        <CardContent>
          <Typography variant="h5">{props.title}</Typography>
          <Typography variant="body1" sx={{display: 'flex', alignItems: 'center'}}>
            {props.cost != 0
              ? <><CurrencyRupee sx={{ fontSize: 20 }} />&nbsp;{props.cost.toFixed(2)}</>
              : 'Free'
            }
          </Typography>
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
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Merchandise</MaterialButton>} />
        <Box sx={{pl: 2, pt: 2}}>
          {this.state.isLoading
            ? (<Box textAlign="center"><CircularProgress sx={{mt: 10}} /></Box>)
            : Object.keys(this.state.merchandise).length != 0
              ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
                {Object.values(this.state.merchandise).map(merchandise => 
                  <MerchandiseCard key={merchandise.id} {...merchandise} />)}
                </Masonry>)
              : (<EmptyState>No merchandise have been added yet.</EmptyState>)
          }
        </Box>
        <AddEditDialog
          merchandise={this.state.currentMerchandise}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveMerchandise} />
        <DeleteDialog
          merchandise={this.state.currentMerchandise}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteMerchandise} />
      </Box>
    );
  }

  openAddDialog() {
    this.setState({currentMerchandise: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(merchandise: Merchandise) {
    this.setState({currentMerchandise: merchandise});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(merchandise: Merchandise) {
    this.setState({currentMerchandise: merchandise});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getMerchandise = async () => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl);
      const merchandise = response.merchandise;

      for (var i = 0; i < merchandise.length; ++i) {
        const merch: Merchandise = {
          id: merchandise[i].id,
          title: merchandise[i].title,
          cost: merchandise[i].cost,
          image: merchandise[i].image
        };

        this.state.merchandise[merch.id] = merch;
      }

      this.setState({ 
        merchandise: this.state.merchandise,
        isLoading: false
      });
    } catch (err) {

    }
  }

  saveMerchandise = (merchandise: Merchandise) => {
    this.state.merchandise[merchandise.id] = merchandise;
    this.setState({ merchandise: this.state.merchandise });
  }

  deleteMerchandise = (merchandise: Merchandise) => {
    delete this.state.merchandise[merchandise.id];
    this.setState({ merchandise: this.state.merchandise });
  }
}

interface MerchandiseDialogProps {
  /**
   * The merchandise being edited or deleted
   * @default undefined
   */
  merchandise?: Merchandise;

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
  onUpdate: (merchandise: Merchandise) => void;
}

interface MerchandiseDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;
}

class AddEditDialog extends React.Component<MerchandiseDialogProps, MerchandiseDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;

  constructor(props: MerchandiseDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/merchandise';

    this.formRef = React.createRef();
  }
  
  render() {
    const id = this.props.merchandise?.id;
    const title = this.props.merchandise ? this.props.merchandise.title : '';
    const cost = this.props.merchandise ? this.props.merchandise.cost : '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>{this.props.merchandise ? 'Edit' : 'Add'} Merchandise</DialogTitle>
        <DialogContent>
          <form ref={this.formRef}>
            <input name="id" value={id} type="hidden" />
            <Stack spacing={1} mt={0.5}>
              <ImageInput name="image" defaultValue={this.props.merchandise?.image ?? undefined} />
              <TextField name="title" placeholder="Title" defaultValue={title} disabled={this.state.isLoading} />
              <TextField 
                name="cost" 
                placeholder="Cost" 
                type="number" 
                defaultValue={cost} 
                InputProps={{ 
                  startAdornment: (
                    <InputAdornment position="start">
                      <CurrencyRupee sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={this.addEdit}>Save Merchandise</Button>
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
        id: response.merchandise.id,
        title: response.merchandise.title,
        cost: response.merchandise.cost,
        image: response.merchandise.image
      });
      this.props.onClose();
    } catch (err) {

    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<MerchandiseDialogProps, MerchandiseDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: MerchandiseDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/merchandise';
  }
  
  render() {
    const id = this.props.merchandise?.id;
    const title = this.props.merchandise ? this.props.merchandise.title : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete merchandise</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{title}</b>?</Typography>
            <Button isLoading={this.state.isLoading} variant="contained" onClick={this.delete}>Delete Merchandise</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  delete = async () => {
    this.setState({ isLoading: true });

    try {
      const merchandise = {
        id: this.props.merchandise!.id.toString()
      }
      const f = new FormData();
      f.append("id", this.props.merchandise!.id.toString());

      await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/delete`, { body: f });
      
      this.props.onUpdate(this.props.merchandise!);
      this.props.onClose();
    } catch (err) {

    }

    this.setState({ isLoading: false });
  }
}
