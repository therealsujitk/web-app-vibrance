import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Masonry } from '@mui/lab'
import {
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
} from '@mui/material'
import Cookies from 'js-cookie'
import { useState } from 'react'
import { Button, Dialog, DialogTitle, EmptyState, TextField } from '../../../components'
import { AppContext } from '../../../contexts/app'
import Drawer from '../../drawer/drawer'
import PanelHeader from '../../panel-header/panel-header'
import { BasePanel, BasePanelState } from '../base-panel/base-panel'

interface VenuesPanelState extends BasePanelState {
  /**
   * The list of venues
   */
  venues: Map<number, Venue>

  /**
   * The venue currently being edited
   */
  editingVenue?: Venue

  /**
   * The room currently being edited
   */
  editingRoom?: Room

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

  /**
   * If `true`, the dialogs have to work with editingRoom
   * @default false
   */
  isEditingRoom: boolean
}

interface Venue {
  id: number
  title: string
  rooms: { [x: number]: Room }
}

interface Room {
  id: number
  title: string
}

export default class VenuesPanel extends BasePanel<{}, VenuesPanelState> {
  apiEndpoint = '/api/latest/venues'
  apiKey = Cookies.get('apiKey')

  constructor(props: {}) {
    super(props)

    this.state = {
      venues: new Map(),
      editingVenue: undefined,
      editingRoom: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true,
      isEditingRoom: false,
    }
  }

  venueFromResponse = (venue: any): Venue => {
    return {
      id: venue.id,
      title: venue.title,
      rooms: this.state.venues.get(venue.id)?.rooms ?? {},
    }
  }

  roomFromResponse = (room: any): Room => {
    return {
      id: room.id,
      title: room.title,
    }
  }

  handleGetResponse(response: any): void {
    const venues = this.state.venues

    for (let i = 0; i < response.venues.length; ++i) {
      const venue = response.venues[i]
      venues.set(venue.id, this.venueFromResponse(venue))

      for (let j = 0; j < venue.rooms.length; ++j) {
        const room = venue.rooms[j]
        venues.get(venue.id)!.rooms[room.id] = this.roomFromResponse(room)
      }
    }

    this.setState({ venues: venues })
  }

  handlePutResponse(response: any): void {
    const venues = this.state.venues

    if (response.venue) {
      const venue = response.venue
      venues.set(venue.id, this.venueFromResponse(venue))
    } else {
      const room = response.room
      venues.get(room.venue_id)!.rooms[room.id] = this.roomFromResponse(room)
    }

    this.setState({ venues: venues })
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response)
  }

  handleDeleteResponse(_: number): void {
    // This part is handled inside the DeleteDialog component
  }

  VenueCard = (venue: Venue) => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5">{venue.title}</Typography>
          <Stack direction="row" sx={{ pt: 1, flexWrap: 'wrap', gap: 1 }}>
            <Chip
              icon={<AddIcon />}
              label="Add room"
              variant="outlined"
              onClick={() =>
                this.setState({
                  editingVenue: venue,
                  editingRoom: undefined,
                  isEditingRoom: true,
                  isAddOrEditDialogOpen: true,
                })
              }
            />
            {Object.values(venue.rooms).flatMap((r, i) =>
              r.title != null ? (
                <Chip
                  key={i}
                  label={r.title}
                  onClick={() =>
                    this.setState({
                      editingVenue: venue,
                      editingRoom: r,
                      isEditingRoom: true,
                      isAddOrEditDialogOpen: true,
                    })
                  }
                  onDelete={() =>
                    this.setState({
                      editingVenue: venue,
                      editingRoom: r,
                      isEditingRoom: true,
                      isDeleteDialogOpen: true,
                    })
                  }
                />
              ) : (
                []
              ),
            )}
          </Stack>
        </CardContent>
        <CardActions disableSpacing>
          <Tooltip title="Edit">
            <IconButton
              onClick={() => {
                this.setState({
                  editingVenue: venue,
                  editingRoom: undefined,
                  isEditingRoom: false,
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
                  editingVenue: venue,
                  editingRoom: undefined,
                  isEditingRoom: false,
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
    const onClose = () => this.setState({ isAddOrEditDialogOpen: false })
    const venue = this.state.editingVenue
    const room = this.state.editingRoom

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen}>
        <DialogTitle onClose={onClose}>
          {room?.id || (venue?.id && !this.state.isEditingRoom) ? 'Edit' : 'Add'}{' '}
          {this.state.isEditingRoom ? 'Room' : 'Venue'}
        </DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="venue_id" value={venue?.id} type="hidden" />
            <input name="id" value={this.state.isEditingRoom ? room?.id : venue?.id} type="hidden" />
            <Stack spacing={1} mt={0.5}>
              {this.state.isEditingRoom && <TextField defaultValue={venue?.title} disabled />}
              <TextField
                placeholder="Title"
                name="title"
                defaultValue={this.state.isEditingRoom ? room?.title : venue?.title}
                disabled={isLoading}
              />
              <Button
                type="submit"
                isLoading={isLoading}
                variant="contained"
                sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })}
                onClick={() => {
                  setLoading(true)
                  const putEndpoint = this.apiEndpoint + (this.state.isEditingRoom ? '/rooms' : '') + '/add'
                  const patchEndpoint = this.apiEndpoint + (this.state.isEditingRoom ? '/rooms' : '') + '/edit'
                  this.addOrEditItem(patchEndpoint, putEndpoint)
                    .then((_) => onClose())
                    .finally(() => setLoading(false))
                }}
              >
                Save {this.state.isEditingRoom ? 'Room' : 'Venue'}
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
    const venue = this.state.editingVenue
    const room = this.state.editingRoom

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete {this.state.isEditingRoom ? 'Room' : 'Venue'}</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={this.state.isEditingRoom ? room?.id : venue?.id} type="hidden" />
            <Stack spacing={2} mt={0.5}>
              <Typography>
                Are you sure you want to delete{' '}
                {this.state.isEditingRoom && (
                  <>
                    <b>{room?.title}</b> under{' '}
                  </>
                )}
                <b>{venue?.title}</b>?
              </Typography>
              <Button
                type="submit"
                isLoading={isLoading}
                variant="contained"
                onClick={() => {
                  setLoading(true)
                  const isEditingRoom = this.state.isEditingRoom
                  const deleteEndpoint = this.apiEndpoint + (isEditingRoom ? '/rooms' : '') + '/delete'
                  this.deleteItem(isEditingRoom ? room!.id : venue!.id, deleteEndpoint)
                    .then((id) => {
                      const venues = this.state.venues

                      if (isEditingRoom) {
                        delete venues.get(venue!.id)!.rooms[id]
                      } else {
                        venues.delete(id)
                      }

                      this.setState({ venues: venues })
                      onClose()
                    })
                    .finally(() => setLoading(false))
                }}
              >
                Delete {this.state.isEditingRoom ? 'Room' : 'Venue'}
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  render() {
    return (
      <Box>
        <AppContext.Consumer>{({ displayError }) => <>{(this.onError = displayError)}</>}</AppContext.Consumer>
        <PanelHeader
          {...Drawer.items.venues}
          action={
            <MaterialButton
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                this.setState({ editingVenue: undefined, isEditingRoom: false, isAddOrEditDialogOpen: true })
              }
            >
              Add Venue
            </MaterialButton>
          }
        />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.venues.size != 0 ? (
            <Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
              {Array.from(this.state.venues).map(([_, venue]) => (
                <this.VenueCard key={venue.id} {...venue} />
              ))}
            </Masonry>
          ) : (
            <EmptyState>No venues have been added yet.</EmptyState>
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
