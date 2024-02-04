import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardMedia, CircularProgress, DialogActions, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import { useState } from "react";
import { Button, Dialog, DialogTitle, EmptyState, Image as ImageView, MultiImageInput } from '../../../components';
import { AppContext } from '../../../contexts/app';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanel, BasePanelState } from '../base-panel/base-panel';

interface GalleryPanelState extends BasePanelState {
  /**
   * The list of gallery
   */
  gallery: Map<number, Image>;

  /**
   * The image currently being deleted
   */
  deletingImage?: Image;

  /**
   * If `true`, the UploadDialog is open
   * @default false
   */
  isUploadDialogOpen: boolean;

  /**
   * If `true`, the DeleteDialog is open
   * @default false
   */
  isDeleteDialogOpen: boolean;
}

interface Image {
  id: number;
  src: string;
}

export default class GalleryPanel extends BasePanel<{}, GalleryPanelState> {
  apiEndpoint = '/api/latest/gallery';
  apiKey = Cookies.get('apiKey');
  requireMultipart = true;

  constructor(props: {}) {
    super(props);

    this.state = {
      gallery: new Map(),
      deletingImage: undefined,
      isUploadDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };
  };

  putEndpoint = () => this.apiEndpoint + '/upload';

  imageFromResponse = (image: any) => {
    return {
      id: image.id,
      src: image.image,
    };
  }

  handleGetResponse(response: any): void {
    const gallery = this.state.gallery;

    for (let i = 0; i < response.gallery.length; ++i) {
      const image = response.gallery[i];
      gallery.set(image.id, this.imageFromResponse(image));
    }

    this.setState({ gallery: gallery });
  }

  handlePutResponse(response: any): void {
    const gallery = this.state.gallery;

    for (let i = 0; i < response.images.length; ++i) {
      const image = response.images[i];
      gallery.set(image.id, this.imageFromResponse(image));
    }

    this.setState({gallery: gallery});
  }

  handlePatchResponse(_: any): void {
    // This function isn't used in this panel
  }

  handleDeleteResponse(id: number): void {
    const gallery = this.state.gallery;
    gallery.delete(id);
    this.setState({gallery: gallery})
  }

  ImageCard = (image: Image) => {
    return (
      <Card>
        <CardMedia
          component="img"
          image={image.src}
        />
        <CardActions disableSpacing>
          <Tooltip title="Delete">
            <IconButton onClick={() => {
              this.setState({
                deletingImage: image,
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

  UploadDialog = () => {
    const [isLoading, setLoading] = useState(false);
    const onClose = () => this.setState({isUploadDialogOpen: false});

    return (
      <Dialog onClose={onClose} open={this.state.isUploadDialogOpen} maxWidth="md" fullWidth>
        <DialogTitle onClose={onClose}>Add Images</DialogTitle>
          <AppContext.Consumer>
            {({ displayError, displayWarning }) => (
              <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
                <DialogContent sx={{ pt: 0 }}>
                  <MultiImageInput name="image" disabled={isLoading} onError={displayError} onWarning={displayWarning} />
                </DialogContent>
                <DialogActions>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    sx={{ mr: 2, mb: 2 }} 
                    isLoading={isLoading} 
                    onClick={() => {
                      setLoading(true);
                      this.addOrEditItem().then(_ => onClose()).finally(() => setLoading(false));
                    }}
                  >Upload</Button>
                </DialogActions>
              </form>
            )}
        </AppContext.Consumer>
      </Dialog>
    );
  }

  DeleteDialog = () => {
    const [isLoading, setLoading] = useState(false);
    const onClose = () => this.setState({isDeleteDialogOpen: false});
    const image = this.state.deletingImage;

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete image</DialogTitle>
        <DialogContent>
          <input value={image?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <ImageView src={image?.src} />
            <Typography>Are you sure you want to delete this image?</Typography>
            <Button
              isLoading={isLoading} 
              variant="contained" 
              onClick={() => {
                setLoading(true);
                this.deleteItem(image!.id).then(_ => onClose()).finally(() => setLoading(false));
              }}
            >Delete Image</Button>
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
        <PanelHeader {...Drawer.items.gallery} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.setState({isUploadDialogOpen: true})}>Add Images</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.gallery.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
              {Array.from(this.state.gallery).map(([_, image]) => 
                <div><this.ImageCard key={image.id} {...image} /></div>)}
              </Masonry>)
            : (<EmptyState>No gallery images have been added yet.</EmptyState>)
          }
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
        </Box>
        <this.UploadDialog />
        <this.DeleteDialog />
      </Box>
    );
  }
}
