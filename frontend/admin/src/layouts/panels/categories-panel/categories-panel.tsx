import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, DialogContent, IconButton, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import { useState } from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, Select, TextField } from '../../../components';
import { AppContext } from '../../../contexts/app';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";
import { BasePanel, BasePanelState } from '../base-panel/base-panel';

interface CategoriesPanelState extends BasePanelState {
  /**
   * The list of categories
   * @default []
   */
  categories: Map<number, Category>;

  /**
   * The types of categories
   * @default []
   */
  categoryTypes: string[];

  /**
   * The category currently being edited
   * @default undefined
   */
  editingCategory?: Category;

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

interface Category {
  id: number;
  title: string;
  type: string;
  image: string|null;
}

export default class CategoryPanel extends BasePanel<{}, CategoriesPanelState> {
  apiEndpoint = '/api/latest/categories';
  apiKey = Cookies.get('apiKey');
  requireMultipart = true;

  constructor(props: {}) {
    super(props);

    this.state = {
      categories: new Map(),
      categoryTypes: [],
      editingCategory: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };
  }

  categoryFromResponse = (category: any): Category => {
    return {
      id: category.id,
      title: category.title,
      type: category.type,
      image: category.image,
    }
  }

  handleGetResponse(response: any): void {
    const categories = this.state.categories;

    for (let i = 0; i < response.categories.length; ++i) {
      const category = response.categories[i];
      categories.set(category.id, this.categoryFromResponse(category));
    }

    this.setState({
      categories: categories,
      categoryTypes: response.types,
    });
  }

  handlePutResponse(response: any): void {
    const categories = this.state.categories;
    const category = response.category;
    categories.set(category.id, this.categoryFromResponse(category));
    this.setState({categories: categories});
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response);
  }

  handleDeleteResponse(id: number): void {
    const categories  = this.state.categories;
    categories.delete(id);
    this.setState({categories: categories});
  }

  CategoryCard = (category: Category) => {
    return (
      <Card>
        {category.image && <CardMedia
          component="img"
          height="120"
          image={category.image}
        />}
        <CardContent>
          <Typography variant="h5">{category.title}</Typography>
          <Chip size="small" sx={{ mt: 1, textTransform: 'capitalize' }} label={category.type.toLowerCase()} />
        </CardContent>
        <CardActions disableSpacing>
          <Tooltip title="Edit">
            <IconButton onClick={() => {
              this.setState({
                editingCategory: category,
                isAddOrEditDialogOpen: true,
              });
            }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => {
              this.setState({
                editingCategory: category,
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
    const category = this.state.editingCategory;

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen}>
        <DialogTitle onClose={onClose}>{category ? 'Edit' : 'Add'} Category</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={category?.id ?? ''} type="hidden" />
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <ImageInput name="image" defaultValue={category?.image ?? undefined} onError={displayError} disabled={isLoading} />
                  <TextField name="title" placeholder="Title" defaultValue={category?.title || ''} disabled={isLoading} />
                  <Select
                    name="type"
                    defaultValue={category?.type.toLowerCase() ?? '0'}
                    disabled={isLoading}>
                    <MenuItem value="0" disabled>Select Type</MenuItem>
                    {this.state.categoryTypes!.map((type) => <MenuItem value={type.toLowerCase()}>{type}</MenuItem>)}
                  </Select>
                  <Button 
                    type="submit"
                    isLoading={isLoading}
                    variant="contained"
                    sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })}
                    onClick={() => {
                      setLoading(true);
                      this.addOrEditItem().then(_ => onClose()).finally(() => setLoading(false));
                    }}
                  >Save Category</Button>
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
    const category = this.state.editingCategory;

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete category</DialogTitle>
        <DialogContent>
          <input value={category?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{category?.title}</b>?</Typography>
            <Button 
              isLoading={isLoading} 
              variant="contained" 
              onClick={() => {
                setLoading(true);
                this.deleteItem(category!.id).then(_ => onClose()).finally(() => setLoading(false));
              }}
            >Delete Category</Button>
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
        <PanelHeader {...Drawer.items.categories} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.setState({editingCategory: undefined, isAddOrEditDialogOpen: true})}>Add Category</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.categories.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }} spacing={2}>
              {Array.from(this.state.categories).map(([_, category]) => 
                <this.CategoryCard key={category.id} {...category} />)}
              </Masonry>)
            : (<EmptyState>No categories have been added yet.</EmptyState>)
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
