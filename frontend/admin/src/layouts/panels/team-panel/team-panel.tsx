import { CallOutlined, EmailOutlined } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Masonry } from '@mui/lab'
import {
  Avatar,
  Box,
  Button as MaterialButton,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Autocomplete,
} from '@mui/material'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, TextField } from '../../../components'
import { AppContext } from '../../../contexts/app'
import Drawer from '../../drawer/drawer'
import PanelHeader from '../../panel-header/panel-header'
import { BasePanel, BasePanelState } from '../base-panel/base-panel'

interface TeamPanelState extends BasePanelState {
  /**
   * The list of team
   */
  team: Map<number, TeamMember>

  /**
   * The list of team names
   * @default []
   */
  teamNames: Set<string>

  /**
   * The team member currently being edited
   */
  editingMember?: TeamMember

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

interface TeamMember {
  id: number
  name: string
  image: string | null
  teamName: string
  role: string
  phone: string | null
  email: string | null
}

export default class TeamPanel extends BasePanel<{}, TeamPanelState> {
  apiEndpoint = '/api/latest/team'
  apiKey = Cookies.get('apiKey')
  requireMultipart = true

  constructor(props: {}) {
    super(props)

    this.state = {
      team: new Map(),
      teamNames: new Set(),
      editingMember: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true,
    }
  }

  memberFromResponse = (member: any): TeamMember => {
    return {
      id: member.id,
      name: member.name,
      image: member.image,
      teamName: member.team_name,
      role: member.role,
      phone: member.phone,
      email: member.email,
    }
  }

  handleGetResponse(response: any): void {
    const team = this.state.team

    for (let i = 0; i < response.team.length; ++i) {
      const member = response.team[i]
      team.set(member.id, this.memberFromResponse(member))
    }

    this.setState({
      team: team,
      teamNames: new Set(response.team_names),
    })
  }

  handlePutResponse(response: any): void {
    const team = this.state.team
    const teamNames = this.state.teamNames
    const member = response.member

    team.set(member.id, this.memberFromResponse(member))
    teamNames.add(member.team_name)

    this.setState({
      team: team,
      teamNames: teamNames,
    })
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response)
  }

  handleDeleteResponse(id: number): void {
    const team = this.state.team
    team.delete(id)
    this.setState({ team: team })
  }

  MemberCard = (member: TeamMember) => {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            sx={{ width: 120, height: 120, fontSize: 70, mb: 2 }}
            src={member.image ?? undefined}
            alt={member.name}
          />
          <Typography variant="h5" textAlign="center">
            {member.name}
          </Typography>
          <Typography variant="body1" textAlign="center">
            {member.role}
          </Typography>
          <Chip label={member.teamName} sx={{ mt: 1 }} />
          <Box
            sx={{
              marginHorizontal: 2,
              width: '100%',
              textAlign: 'center',
              '& a': {
                textTransform: 'none',
                width: '100%',
                whiteSpace: 'normal',
                wordBreak: 'break-all',
              },
              '& a:first-of-type': {
                marginTop: 1,
              },
            }}
          >
            {member.phone && (
              <MaterialButton startIcon={<CallOutlined />} href={'tel:' + member.phone}>
                {member.phone}
              </MaterialButton>
            )}
            {member.email && (
              <MaterialButton startIcon={<EmailOutlined />} href={'mailto:' + member.email}>
                {member.email}
              </MaterialButton>
            )}
          </Box>
        </CardContent>
        <CardActions disableSpacing>
          <Tooltip title="Edit">
            <IconButton
              onClick={() => {
                this.setState({
                  editingMember: member,
                  isAddOrEditDialogOpen: true,
                })
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={() => {
                this.setState({
                  editingMember: member,
                  isDeleteDialogOpen: true,
                })
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    )
  }

  AddOrEditDialog = () => {
    const [isLoading, setLoading] = useState(false)
    const [selectedTeamName, setTeamName] = useState<string | null>(null)
    const onClose = () => this.setState({ isAddOrEditDialogOpen: false })
    const member = this.state.editingMember
    const teamNames =
      !selectedTeamName || this.state.teamNames.has(selectedTeamName)
        ? Array.from(this.state.teamNames)
        : [selectedTeamName, ...Array.from(this.state.teamNames)]

    useEffect(() => {
      setTeamName(member?.teamName ?? null)
    }, [this.state.isAddOrEditDialogOpen])

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen}>
        <DialogTitle onClose={onClose}>{member ? 'Edit' : 'Add'} Member</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={member?.id} type="hidden" />
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <ImageInput
                    name="image"
                    defaultValue={member?.image ?? undefined}
                    onError={displayError}
                    disabled={isLoading}
                  />
                  <TextField name="name" placeholder="Name" defaultValue={member?.name} disabled={isLoading} />
                  <Autocomplete
                    options={teamNames.filter((v) => v !== null)}
                    noOptionsText="Type to create"
                    value={selectedTeamName}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Team Name"
                        name="team_name"
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    )}
                    disabled={isLoading}
                  />
                  <TextField name="role" placeholder="Role" defaultValue={member?.role} disabled={isLoading} />
                  <TextField
                    name="phone"
                    placeholder="Mobile Number"
                    defaultValue={member?.phone}
                    disabled={isLoading}
                  />
                  <TextField
                    name="email"
                    placeholder="Email ID"
                    type="email"
                    defaultValue={member?.email}
                    disabled={isLoading}
                  />
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
                    Save Member
                  </Button>
                </Stack>
              )}
            </AppContext.Consumer>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  DeleteDialog = () => {
    const [isLoading, setLoading] = useState(false)
    const onClose = () => this.setState({ isDeleteDialogOpen: false })
    const member = this.state.editingMember

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete member</DialogTitle>
        <DialogContent>
          <input value={member?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>
              Are you sure you want to delete <b>{member?.name}</b>?
            </Typography>
            <Button
              isLoading={isLoading}
              variant="contained"
              onClick={() => {
                setLoading(true)
                this.deleteItem(member!.id)
                  .then((_) => onClose())
                  .finally(() => setLoading(false))
              }}
            >
              Delete Member
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    )
  }

  render() {
    return (
      <Box>
        <AppContext.Consumer>{({ displayError }) => <>{(this.onError = displayError)}</>}</AppContext.Consumer>
        <PanelHeader
          {...Drawer.items.team}
          action={
            <MaterialButton
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => this.setState({ editingMember: undefined, isAddOrEditDialogOpen: true })}
            >
              Add Member
            </MaterialButton>
          }
        />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.team.size != 0 ? (
            <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }} spacing={2}>
              {Array.from(this.state.team).map(([_, member]) => (
                <this.MemberCard key={member.id} {...member} />
              ))}
            </Masonry>
          ) : (
            <EmptyState>No team members have been added yet.</EmptyState>
          )}
          <Box textAlign="center">
            <CircularProgress sx={{ mt: 5, mb: 5, visibility: this.state.isLoading ? 'visible' : 'hidden' }} />
          </Box>
        </Box>
        <this.AddOrEditDialog />
        <this.DeleteDialog />
      </Box>
    )
  }
}
