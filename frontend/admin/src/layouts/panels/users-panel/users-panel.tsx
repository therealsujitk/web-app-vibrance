import { CheckBox, CheckBoxOutlineBlank, Delete, Edit } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import {
  Autocomplete,
  Box,
  Button as MaterialButton,
  Checkbox,
  Chip,
  CircularProgress,
  DialogContent,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'
import { DataGrid, GridRowsProp, GridColDef } from '@mui/x-data-grid'
import Cookies from 'js-cookie'
import React, { createRef, useState } from 'react'
import { Button, Dialog, DialogTitle, TextField } from '../../../components'
import { AppContext } from '../../../contexts/app'
import Drawer from '../../drawer/drawer'
import PanelHeader from '../../panel-header/panel-header'
import { BasePanel, BasePanelState } from '../base-panel/base-panel'

interface UsersPanelState extends BasePanelState {
  /**
   * The list of users
   */
  users: Map<number, User>

  /**
   * The list of available permissions
   */
  permissions: string[]

  /**
   * The user currently being edited
   */
  editingUser?: User

  /**
   * If `true`, the AddEditDialog is open
   * @default false
   */
  isAddOrEditDialogOpen: boolean

  /**
   * If `true`, the DeleteDialog is open
   * @default false
   */
  isDeleteDialogOpen: boolean
}

interface User {
  id: number
  username: string
  permissions: string[]
}

export default class UsersPanel extends BasePanel<{}, UsersPanelState> {
  apiEndpoint = '/api/latest/users'
  apiKey = Cookies.get('apiKey')
  loadOnScroll = false

  dataGridRef: React.RefObject<HTMLInputElement> = createRef()

  constructor(props: {}) {
    super(props)

    this.state = {
      users: new Map(),
      permissions: [],
      editingUser: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true,
    }
  }

  userFromResponse = (user: any): User => {
    return {
      id: user.id,
      username: user.username,
      permissions: user.permissions,
    }
  }

  handleGetResponse(response: any): void {
    const users = this.state.users

    for (let i = 0; i < response.users.length; ++i) {
      const user = response.users[i]
      users.set(user.id, this.userFromResponse(user))
    }

    this.setState({
      users: users,
      permissions: response.permissions,
    })
  }

  handlePutResponse(response: any): void {
    const users = this.state.users
    const user = response.user
    users.set(user.id, this.userFromResponse(user))
    this.setState({ users: users })
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response)
  }

  handleDeleteResponse(id: number): void {
    const users = this.state.users
    users.delete(id)
    this.setState({ users: users })
  }

  AddOrEditDialog = () => {
    const [isLoading, setLoading] = useState(false)
    const [isPasswordEditable, togglePassword] = useState(false)
    const [selectedPermissions, setPermissions] = useState<string[]>([])
    const onClose = () => this.setState({ isAddOrEditDialogOpen: false })
    const user = this.state.editingUser

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen}>
        <DialogTitle onClose={onClose}>{user ? 'Edit' : 'Add'} User</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={user?.id} type="hidden" />
            <Stack spacing={1} mt={0.5}>
              <TextField name="username" placeholder="Username" defaultValue={user?.username} disabled={isLoading} />
              {(isPasswordEditable || !user) && (
                <TextField name="password" placeholder="Password" type="password" disabled={isLoading} />
              )}
              <Autocomplete
                options={this.state.permissions}
                defaultValue={user?.permissions}
                onChange={(_, v) => setPermissions(v)}
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
                  <>
                    <TextField {...params} placeholder="Permissions" />
                    {selectedPermissions.map((p) => (
                      <input name="permissions[]" value={p} hidden />
                    ))}
                  </>
                )}
                disableCloseOnSelect
                disabled={isLoading}
                multiple
              />
              {user && (
                <FormControlLabel
                  control={<Checkbox defaultChecked={isPasswordEditable} />}
                  onChange={(_, checked) => togglePassword(checked)}
                  label="Edit Password"
                />
              )}
              <Button
                type="submit"
                isLoading={isLoading}
                variant="contained"
                sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })}
                onClick={() => {
                  setLoading(true)
                  this.addOrEditItem()
                    .then((_) => onClose())
                    .finally(() => setLoading(false))
                }}
              >
                Save User
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  DeleteDialog = () => {
    const [isLoading, setLoading] = useState(false)
    const onClose = () => this.setState({ isDeleteDialogOpen: false })
    const user = this.state.editingUser

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete user</DialogTitle>
        <DialogContent>
          <input value={user?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>
              Are you sure you want to delete <b>{user?.username}</b>?
            </Typography>
            <Button
              isLoading={isLoading}
              variant="contained"
              onClick={() => {
                setLoading(true)
                this.deleteItem(user!.id)
                  .then((_) => onClose())
                  .finally(() => setLoading(false))
              }}
            >
              Delete User
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    )
  }

  render() {
    const userColumns: GridColDef[] = [
      {
        field: 'username',
        headerName: 'Username',
        width: 150,
        minWidth: 150,
        renderCell: (params) => <Box data-field="username-wrapper">{params.row.username}</Box>,
      },
      {
        field: 'permissions',
        headerName: 'Permissions',
        sortable: false,
        minWidth: 200,
        flex: 1,
        renderCell: (params) => {
          return (
            <Box
              sx={{
                '& > *:not(:last-of-type)': {
                  marginRight: 1,
                },
              }}
              data-field="permissions-wrapper"
            >
              {params.row.permissions.map((p: string, i: number) => (
                <Chip key={i} label={p} />
              ))}
            </Box>
          )
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          return (
            <Box data-field="actions-wrapper">
              <MaterialButton
                variant="contained"
                color="warning"
                sx={{ mr: 1 }}
                startIcon={<Edit />}
                onClick={() => this.setState({ editingUser: params.row.user, isAddOrEditDialogOpen: true })}
              >
                Edit
              </MaterialButton>
              <MaterialButton
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={() => this.setState({ editingUser: params.row.user, isDeleteDialogOpen: true })}
              >
                Delete
              </MaterialButton>
            </Box>
          )
        },
      },
    ]
    const userRows: GridRowsProp = Array.from(this.state.users.values()).map((u) => ({
      id: u.id,
      username: u.username,
      permissions: u.permissions,
      user: u,
    }))

    return (
      <Box>
        <AppContext.Consumer>{({ displayError }) => <>{(this.onError = displayError)}</>}</AppContext.Consumer>
        <PanelHeader
          {...Drawer.items.users}
          action={
            <MaterialButton
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => this.setState({ editingUser: undefined, isAddOrEditDialogOpen: true })}
            >
              Add User
            </MaterialButton>
          }
        />
        <Box sx={{ p: 2 }}>
          {this.state.isLoading ? (
            <Box textAlign="center">
              <CircularProgress sx={{ mt: 10 }} />
            </Box>
          ) : (
            <DataGrid
              ref={this.dataGridRef}
              rows={userRows}
              columns={userColumns}
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-columnHeader:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                '& .MuiDataGrid-columnHeader:focus-within': {
                  outline: 'none',
                },
              }}
              isRowSelectable={(_) => false}
              autoHeight
            />
          )}
        </Box>
        <this.AddOrEditDialog />
        <this.DeleteDialog />
      </Box>
    )
  }
}
