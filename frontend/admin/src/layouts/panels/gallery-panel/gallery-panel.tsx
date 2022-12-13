import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardMedia, CircularProgress, DialogActions, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, Image as ImageView, MultiImageInput } from '../../../components';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface GalleryPanelState {
  /**
   * The list of gallery
   */
  gallery: { [x: number]: Image };

  /**
   * The current image details for the dialog
   */
  currentImage?: Image;

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

interface Image {
  /**
   * The unique id of the image
   */
  id: number;

  /**
   * The image
   */
  image: string;
}

export default class GalleryPanel extends React.Component<{}, GalleryPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  constructor(props : {}) {
    super(props);

    this.state = {
      gallery: [],
      currentImage: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/gallery';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getGallery();
  }

  render() {
    const panelInfo = Drawer.items.gallery;

    const ImageCard = (props: Image) => (
      <Card>
        <CardMedia
          component="img"
          image={props.image}
        />
        <CardActions disableSpacing>
          <Tooltip title="Delete">
            <IconButton onClick={() => this.openDeleteDialog(props)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>);

    return (
      <Box>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Images</MaterialButton>} />
        <Box sx={{pl: 2, pt: 2}}>
          {this.state.isLoading
            ? (<Box textAlign="center"><CircularProgress sx={{mt: 10}} /></Box>)
            : Object.keys(this.state.gallery).length != 0
              ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
                {Object.values(this.state.gallery).map(image => 
                  <ImageCard key={image.id} {...image} />)}
                </Masonry>)
              : (<EmptyState>No gallery have been added yet.</EmptyState>)
          }
        </Box>
        <AddDialog
          image={this.state.currentImage}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveImage} />
        <DeleteDialog
          image={this.state.currentImage}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteImage} />
      </Box>
    );
  }

  openAddDialog() {
    this.setState({currentImage: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(image: Image) {
    this.setState({currentImage: image});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(image: Image) {
    this.setState({currentImage: image});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getGallery = async () => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl);
      const gallery = response.gallery;

      for (var i = 0; i < gallery.length; ++i) {
        const image: Image = {
          id: gallery[i].id,
          image: gallery[i].image
        };

        this.state.gallery[image.id] = image;
      }

      this.setState({ 
        gallery: this.state.gallery,
        isLoading: false
      });
    } catch (err) {

    }
  }

  saveImage = (images: Image|Image[]) => {
    if (Array.isArray(images)) {
      for (var i = 0; i < images.length; ++i) {
        this.state.gallery[images[i].id] = images[i];
      }
    } else {
      this.state.gallery[images.id] = images;
    }

    this.setState({ gallery: this.state.gallery });
  }

  deleteImage = (images: Image|Image[]) => {
    if (Array.isArray(images)) {
      for (var i = 0; i < images.length; ++i) {
        delete this.state.gallery[images[i].id];
      }
    } else {
      delete this.state.gallery[images.id];
    }

    this.setState({ gallery: this.state.gallery });
  }
}

interface ImageDialogProps {
  /**
   * The image being edited or deleted
   * @default undefined
   */
  image?: Image;

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
  onUpdate: (images: Image|Image[]) => void;
}

interface ImageDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;
}

class AddDialog extends React.Component<ImageDialogProps, ImageDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;
  titleInput: React.RefObject<HTMLInputElement>;
  typeInput: React.RefObject<HTMLInputElement>;

  constructor(props: ImageDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/gallery';

    this.formRef = React.createRef();
    this.titleInput = React.createRef();
    this.typeInput = React.createRef();
  }
  
  render() {    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false} maxWidth="md" fullWidth>
        <DialogTitle onClose={this.props.onClose}>Add Images</DialogTitle>
        <form ref={this.formRef}>
          <DialogContent sx={{ pt: 0 }}>
            <MultiImageInput name="image" disabled={this.state.isLoading} />
          </DialogContent>
          <DialogActions>
            <Button variant="contained" sx={{ mr: 2, mb: 2 }} isLoading={this.state.isLoading} onClick={this.add}>Upload</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  add = async () => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      const response = await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/upload`, { body: formData }, true);
      
      this.props.onUpdate(response.images);
      this.props.onClose();
    } catch (err) {

    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<ImageDialogProps, ImageDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: ImageDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/gallery';
  }
  
  render() {
    const id = this.props.image?.id;

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete image</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <ImageView src={this.props.image?.image} />
            <Typography>Are you sure you want to delete this image?</Typography>
            <Button isLoading={this.state.isLoading} variant="contained" onClick={this.delete}>Delete Image</Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  delete = async () => {
    this.setState({ isLoading: true });

    try {
      const image = {
        id: this.props.image!.id.toString()
      }

      await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/delete`, { body: image });
      
      this.props.onUpdate(this.props.image!);
      this.props.onClose();
    } catch (err) {

    }

    this.setState({ isLoading: false });
  }
}
