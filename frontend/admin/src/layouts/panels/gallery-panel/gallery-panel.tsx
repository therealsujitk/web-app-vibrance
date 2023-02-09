import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardMedia, CircularProgress, DialogActions, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, Image as ImageView, MultiImageInput } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface GalleryPanelState {
  /**
   * The list of gallery
   */
  gallery: Map<number, Image>;

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

  page: number;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      gallery: new Map(),
      currentImage: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/gallery';

    this.page = 1;

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getGallery(this.onError!);
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
      this.getGallery(this.onError!);
    }
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
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Images</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.gallery.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
              {Array.from(this.state.gallery).map(([k, image]) => 
                <ImageCard key={image.id} {...image} />)}
              </Masonry>)
            : (<EmptyState>No gallery images have been added yet.</EmptyState>)
          }
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
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

  getGallery = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl, { query: { page: this.page } });
      const gallery = response.gallery;

      for (var i = 0; i < gallery.length; ++i) {
        if (i === 0) {
          this.page = response.next_page;
        }

        const image: Image = {
          id: gallery[i].id,
          image: gallery[i].image
        };

        this.state.gallery.set(image.id, image);
      }

      this.setState({ 
        gallery: this.state.gallery,
        isLoading: false
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getGallery(onError) });
    }
  }

  saveImage = (images: Image|Image[]) => {
    if (Array.isArray(images)) {
      for (var i = 0; i < images.length; ++i) {
        this.state.gallery.set(images[i].id, images[i]);
      }
    } else {
      this.state.gallery.set(images.id, images);
    }

    this.setState({ gallery: this.state.gallery });
  }

  deleteImage = (images: Image|Image[]) => {
    if (Array.isArray(images)) {
      for (var i = 0; i < images.length; ++i) {
        this.state.gallery.delete(images[i].id);
      }
    } else {
      this.state.gallery.delete(images.id);
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

  constructor(props: ImageDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/gallery';

    this.formRef = React.createRef();
  }
  
  render() {    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false} maxWidth="md" fullWidth>
        <DialogTitle onClose={this.props.onClose}>Add Images</DialogTitle>
          <AppContext.Consumer>
            {({ displayError, displayWarning }) => (
              <form ref={this.formRef}>
                <DialogContent sx={{ pt: 0 }}>
                  <MultiImageInput name="image" disabled={this.state.isLoading} onError={displayError} onWarning={displayWarning} />
                </DialogContent>
                <DialogActions>
                      <Button variant="contained" sx={{ mr: 2, mb: 2 }} isLoading={this.state.isLoading} onClick={() => this.add(displayError)}>Upload</Button>
                </DialogActions>
              </form>
            )}
        </AppContext.Consumer>
      </Dialog>
    );
  }

  add = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);
      const response = await new Network(this.apiKey).doPut(`${this.apiBaseUrl}/upload`, { body: formData }, true);
      
      this.props.onUpdate(response.images);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
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
            <AppContext.Consumer>
              {({ displayError }) => (
                <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete Image</Button>
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
      formData.append("id", this.props.image!.id.toString());

      await new Network(this.apiKey).doDelete(`${this.apiBaseUrl}/delete`, { body: formData });
      
      this.props.onUpdate(this.props.image!);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
