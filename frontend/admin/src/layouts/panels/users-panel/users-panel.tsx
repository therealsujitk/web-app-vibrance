import { CheckBox, CheckBoxOutlineBlank, Delete, Edit } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { Autocomplete, Box, Button as MaterialButton, Checkbox, Chip, CircularProgress, DialogContent, FormControlLabel, Stack, Typography } from "@mui/material";
import { DataGrid, GridRowsProp, GridColDef } from '@mui/x-data-grid'
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface UsersPanelState {
  /**
   * The list of users
   */
  users: { [x: number]: User };

  /**
   * The list of available permissions
   */
  permissions: string[];

  /**
   * The current user details for the dialog
   */
  currentUser?: User;

  columnWidths?: {
    username: number,
    permissions: number,
    actions: number,
  };

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

interface User {
  /**
   * The unique id of the user
   */
  id: number;

  /**
   * The username
   */
  username: string;

  /**
   * The permissions given to the user
   */
  permissions: string[];
}

export default class UsersPanel extends React.Component<{}, UsersPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  dataGridRef: React.RefObject<HTMLInputElement>;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      users: {},
      permissions: [],
      currentUser: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.dataGridRef = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/users';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getUsers(this.onError!);
  }

  render() {
    const panelInfo = Drawer.items.users;
    const userColumns: GridColDef[] = [
      {
        field: 'username',
        headerName: 'Username',
        width: 150,
        minWidth: this.state.columnWidths?.username ?? 150,
        renderCell: (params) => <Box data-field="username-wrapper">{params.row.username}</Box>
      },
      {
        field: 'permissions',
        headerName: 'Permissions',
        sortable: false,
        minWidth: this.state.columnWidths?.permissions ?? 200,
        flex: 1,
        renderCell: (params) => {
          return (<Box sx={{
            '& > *:not(:last-of-type)': {
              marginRight: 1
            }
          }} data-field="permissions-wrapper">
            {params.row.permissions.map((p: string, i: number) => (<Chip key={i} label={p} />))}
          </Box>);
        }
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: this.state.columnWidths?.actions ?? 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          return (<Box data-field="actions-wrapper">
            <MaterialButton variant="contained" color="warning" sx={{ mr: 1 }} startIcon={<Edit />} onClick={() => this.openEditDialog(params.row.user)}>Edit</MaterialButton>
            <MaterialButton variant="contained" color="error" startIcon={<Delete />} onClick={() => this.openDeleteDialog(params.row.user)}>Delete</MaterialButton>
          </Box>);
        }
      }
    ];
    const userRows: GridRowsProp = Object.values(this.state.users).map(u => ({
      id: u.id,
      username: u.username,
      permissions: u.permissions,
      user: u
    }));

    return (
      <Box>
        <AppContext.Consumer>
          {({displayError}) => <>{this.onError = displayError}</>}
        </AppContext.Consumer>
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add User</MaterialButton>} />
        <Box sx={{p: 2}}>
          {this.state.isLoading
            ? (<Box textAlign="center"><CircularProgress sx={{mt: 10}} /></Box>)
            : <DataGrid 
                ref={this.dataGridRef} 
                rows={userRows} 
                columns={userColumns} 
                sx={{
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none'
                  },
                  '& .MuiDataGrid-columnHeader:focus': {
                    outline: 'none'
                  },
                  '& .MuiDataGrid-cell:focus-within': {
                    outline: 'none'
                  },
                  '& .MuiDataGrid-columnHeader:focus-within': {
                    outline: 'none'
                  },
                }}
                onResize={this.autoSizeColumns} 
                isRowSelectable={(_) => false} 
                autoHeight 
              />
          }
        </Box>
        <AddEditDialog
          user={this.state.currentUser}
          permissions={this.state.permissions}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveUser} />
        <DeleteDialog
          user={this.state.currentUser}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteUser} />
      </Box>
    );
  }

  openAddDialog() {
    this.setState({currentUser: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(user: User) {
    this.setState({currentUser: user});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(user: User) {
    this.setState({currentUser: user});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getUsers = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network(this.apiKey).doGet(this.apiBaseUrl);
      const users = response.users;

      for (var i = 0; i < users.length; ++i) {
        const user: User = {
          id: users[i].id,
          username: users[i].username,
          permissions: users[i].permissions
        };

        this.state.users[user.id] = user;
      }

      this.setState({ 
        users: this.state.users,
        permissions: response.permissions,
        isLoading: false
      });
    } catch (err: any) {
      onError(err, { name: 'Retry', onClick: () => this.getUsers(onError) });
    }
  }

  saveUser = (user: User) => {
    this.state.users[user.id] = user;
    this.setState({ users: this.state.users });
  }

  deleteUser = (user: User) => {
    delete this.state.users[user.id];
    this.setState({ users: this.state.users });
  }

  autoSizeColumns = () => {
    const domRows = this.dataGridRef.current?.querySelectorAll('.MuiDataGrid-row');
    const domReady = (Object.keys(this.state.users).length === 0) || domRows?.length;

    if(!domReady) {
      setTimeout(this.autoSizeColumns);
      return;
    }

    var usernameWidth = 0, permissionsWidth = 0, actionsWidth = 0;

    for (var i = 0; i < domRows!.length; ++i) {
      const username = domRows![i].querySelector('[data-field=username-wrapper]');
      const permissions = domRows![i].querySelector('[data-field=permissions-wrapper]');
      const actions = domRows![i].querySelector('[data-field=actions-wrapper]');

      usernameWidth = Math.max(usernameWidth, (username?.scrollWidth || 0) + 50);
      permissionsWidth = Math.max(permissionsWidth, (permissions?.scrollWidth || 0) + 20);
      actionsWidth = Math.max(actionsWidth, (actions?.scrollWidth || 0) + 20);
    }

    this.setState({ columnWidths: {
      username: usernameWidth,
      permissions: permissionsWidth,
      actions: actionsWidth
    } });
  }
}

interface UserDialogProps {
  /**
   * The user being edited or deleted
   * @default undefined
   */
  user?: User;

  /**
   * The list of available permissions
   */
  permissions?: string[];

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
  onUpdate: (user: User) => void;
}

interface UserDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;

  isPasswordEditable?: boolean;
}

class AddEditDialog extends React.Component<UserDialogProps, UserDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;
  selectedPermsions?: string[];

  constructor(props: UserDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/users';

    this.formRef = React.createRef();
  }
  
  render() {
    const id = this.props.user?.id;
    const username = this.props.user ? this.props.user.username : '';

    if (!this.selectedPermsions) {
      this.selectedPermsions = this.props.user?.permissions || [];
    }

    if (!this.props.opened) {
      this.selectedPermsions = undefined;
    }
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>{this.props.user ? 'Edit' : 'Add'} User</DialogTitle>
        <DialogContent>
          <form ref={this.formRef}>
            <input name="id" value={id} type="hidden" />
            <Stack spacing={1} mt={0.5}>
              <TextField name="username" placeholder="Username" defaultValue={username} disabled={this.state.isLoading} />
              {(this.state.isPasswordEditable || !this.props.user) && 
                <TextField name="password" placeholder="Password" type="password" disabled={this.state.isLoading} />
              }
              <Autocomplete
                onChange={(e, v) => this.selectedPermsions = v}
                options={this.props.permissions!}
                defaultValue={this.props.user?.permissions}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ paddingTop: 0, paddingBottom: 0 }}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlank />}
                      checkedIcon={<CheckBox />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Permissions" />
                )}
                disableCloseOnSelect
                multiple
              />
              {this.props.user && <FormControlLabel
                control={
                  <Checkbox defaultChecked={this.state.isPasswordEditable} />
                }
                onChange={this.togglePassword}
                label="Edit Password"
              />}
              <AppContext.Consumer>
                {({ displayError }) => (
                  <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save User</Button>
                )}
              </AppContext.Consumer>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  togglePassword = () => {
    this.setState({ isPasswordEditable: !this.state.isPasswordEditable });
  }

  addEdit = async (onError: AppContextInterface['displayError']) => {
    this.setState({ isLoading: true });

    try {
      const formData = new FormData(this.formRef.current!);

      for (var i = 0; i < this.selectedPermsions!.length; ++i) {
        formData.append('permissions', this.selectedPermsions![i]);
      }

      var response;

      if (formData.get('id')) {
        response = await new Network(this.apiKey).doPatch(`${this.apiBaseUrl}/edit`, { body: formData });
      } else {
        response = await new Network(this.apiKey).doPut(`${this.apiBaseUrl}/add`, { body: formData });
      }
      
      this.props.onUpdate({
        id: response.user.id,
        username: response.user.username,
        permissions: response.user.permissions
      });
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<UserDialogProps, UserDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: UserDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/users';
  }
  
  render() {
    const id = this.props.user?.id;
    const username = this.props.user ? this.props.user.username : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete user</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{username}</b>?</Typography>
            <AppContext.Consumer>
              {({ displayError }) => (
                <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete User</Button>
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
      formData.append("id", this.props.user!.id.toString());

      await new Network(this.apiKey).doDelete(`${this.apiBaseUrl}/delete`, { body: formData });
      
      this.props.onUpdate(this.props.user!);
      this.props.onClose();
    } catch (err: any) {
      onError(err);
    }

    this.setState({ isLoading: false });
  }
}
