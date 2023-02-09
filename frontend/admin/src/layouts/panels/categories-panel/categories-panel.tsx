import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Box, Button as MaterialButton, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, Container, DialogContent, Grid, IconButton, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import validator from "validator";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, Select, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface CategoriesPanelState {
  /**
   * The list of categories
   */
  categories: Map<number, Category>;

  /**
   * The types of categories
   */
  categoryTypes: string[];

  /**
   * The current category details for the dialog
   */
  currentCategory?: Category;

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

interface Category {
  /**
   * The unique id of the category
   */
  id: number;

  /**
   * The title of the category
   */
  title: string;

  /**
   * The date of the categroy
   */
  type: string;

  /**
   * The image of the category
   */
  image: string|null;
}

export default class CategoriesPanel extends React.Component<{}, CategoriesPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  page: number;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      categories: new Map(),
      categoryTypes: [],
      currentCategory: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.page = 1;

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/categories';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getCategories(this.onError!);
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
      this.getCategories(this.onError!);
    }
  }

  render() {
    const panelInfo = Drawer.items.categories;

    const CategoryCard = (props: Category) => (
      <Card>
        {props.image && <CardMedia
          component="img"
          height="120"
          image={props.image}
        />}
        <CardContent>
          <Typography variant="h5">{props.title}</Typography>
          <Chip size="small" sx={{ mt: 1 }} label={this.beautifyType(props.type)} />
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
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Category</MaterialButton>} />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.categories.size != 0
            ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
              {Array.from(this.state.categories).map(([k, category]) => 
                <CategoryCard key={category.id} {...category} />)}
              </Masonry>)
            : (<EmptyState>No categories have been added yet.</EmptyState>)
          }
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
        </Box>
        <AddEditDialog
          category={this.state.currentCategory}
          types={this.state.categoryTypes}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveCategory} />
        <DeleteDialog
          category={this.state.currentCategory}
          types={this.state.categoryTypes}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteCategory} />
      </Box>
    );
  }

  beautifyType(type: string) {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  openAddDialog() {
    this.setState({currentCategory: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(category: Category) {
    this.setState({currentCategory: category});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(category: Category) {
    this.setState({currentCategory: category});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getCategories = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl, { query: { page: this.page } });
      const categories = response.categories;

      for (var i = 0; i < categories.length; ++i) {
        if (i === 0) {
          this.page = response.next_page;
        }

        const category: Category = {
          id: categories[i].id,
          title: validator.unescape(categories[i].title),
          type: categories[i].type,
          image: categories[i].image
        };

        this.state.categories.set(category.id, category);
      }

      this.setState({ 
        categories: this.state.categories,
        categoryTypes: response.types.map(((t: string) => this.beautifyType(t))),
        isLoading: false
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getCategories(onError) });
    }
  }

  saveCategory = (category: Category) => {
    this.state.categories.set(category.id, category);
    this.setState({ categories: this.state.categories });
  }

  deleteCategory = (category: Category) => {
    this.state.categories.delete(category.id);
    this.setState({ categories: this.state.categories });
  }
}

interface CategoryDialogProps {
  /**
   * The category being edited or deleted
   * @default undefined
   */
  category?: Category;

  /**
   * The types of categories
   */
  types: string[];

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
  onUpdate: (category: Category) => void;
}

interface CategoryDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;
}

class AddEditDialog extends React.Component<CategoryDialogProps, CategoryDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;

  constructor(props: CategoryDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/categories';

    this.formRef = React.createRef();
  }
  
  render() {
    const id = this.props.category?.id;
    const title = this.props.category ? this.props.category.title : '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>{this.props.category ? 'Edit' : 'Add'} Category</DialogTitle>
        <DialogContent>
          <form ref={this.formRef}>
            <input name="id" value={id} type="hidden" />
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <ImageInput name="image" defaultValue={this.props.category?.image ?? undefined} onError={displayError} />
                  <TextField name="title" placeholder="Title" defaultValue={title} disabled={this.state.isLoading} />
                  <Select
                    name="type"
                    defaultValue={this.props.category?.type.toLowerCase() ?? 0}
                    disabled={this.state.isLoading}>
                    <MenuItem value="0" disabled>Select Type</MenuItem>
                    {this.props.types.map((type) => <MenuItem value={type.toLowerCase()}>{type}</MenuItem>)}
                  </Select>
                  <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save Category</Button>
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
        id: response.category.id,
        title: validator.unescape(response.category.title),
        type: response.category.type,
        image: response.category.image
      });
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<CategoryDialogProps, CategoryDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: CategoryDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/categories';
  }
  
  render() {
    const id = this.props.category?.id;
    const title = this.props.category ? this.props.category.title : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete category</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{title}</b>?</Typography>
            <AppContext.Consumer>
                {({ displayError }) => (
                  <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete Category</Button>
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
      formData.append("id", this.props.category!.id.toString());

      await new Network(this.apiKey).doDelete(`${this.apiBaseUrl}/delete`, { body: formData });
      
      this.props.onUpdate(this.props.category!);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
