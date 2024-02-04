import { CurrencyRupee, Face, Schedule } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Masonry } from '@mui/lab'
import {
  Autocomplete,
  Box,
  Button as MaterialButton,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  DialogContent,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import Cookies from 'js-cookie'
import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, TextArea, TextField } from '../../../components'
import { AppContext } from '../../../contexts/app'
import Network from '../../../utils/network'
import Drawer from '../../drawer/drawer'
import PanelHeader from '../../panel-header/panel-header'
import { BasePanel, BasePanelState } from '../base-panel/base-panel'

interface ProShowsPanelState extends BasePanelState {
  /**
   * The list of Pro Shows
   */
  proShows: Map<number, ProShow>

  /**
   * The Pro Show currently being edited
   */
  editingProShow?: ProShow

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

interface ProShow {
  id: number
  dayId: number
  venueId: number
  roomId: number
  day: string
  venue: string
  room: string | null
  title: string
  description: string | null
  image: string | null
  startTime: Date
  endTime: Date
  cost: number
  facultyCoordinatorName: string | null
  facultyCoordinatorMobile: string | null
  studentCoordinatorName: string | null
  studentCoordinatorMobile: string | null
  eventId: number
}

export default class ProShowsPanel extends BasePanel<{}, ProShowsPanelState> {
  apiEndpoint = '/api/latest/pro-shows'
  apiKey = Cookies.get('apiKey')
  requireMultipart = true

  constructor(props: {}) {
    super(props)

    this.state = {
      proShows: new Map(),
      editingProShow: undefined,
      isAddOrEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true,
    }
  }

  proShowFromResponse = (proShow: any): ProShow => {
    return {
      id: proShow.id,
      dayId: proShow.day_id,
      venueId: proShow.venue_id,
      roomId: proShow.room_id,
      day: proShow.day,
      venue: proShow.venue,
      room: proShow.room,
      title: proShow.title,
      description: proShow.description,
      image: proShow.image,
      startTime: new Date('2020-01-01 ' + proShow.start_time),
      endTime: new Date('2020-01-01 ' + proShow.end_time),
      cost: proShow.cost,
      facultyCoordinatorName: proShow.faculty_coordinator_name,
      facultyCoordinatorMobile: proShow.faculty_coordinator_mobile,
      studentCoordinatorName: proShow.student_coordinator_name,
      studentCoordinatorMobile: proShow.student_coordinator_mobile,
      eventId: proShow.event_id,
    }
  }

  handleGetResponse(response: any): void {
    const proShows = this.state.proShows

    for (let i = 0; i < response.pro_shows.length; ++i) {
      const proShow = response.pro_shows[i]
      proShows.set(proShow.id, this.proShowFromResponse(proShow))
    }

    this.setState({ proShows: proShows })
  }

  handlePutResponse(response: any): void {
    const proShows = this.state.proShows
    const proShow = response.pro_show
    proShows.set(proShow.id, this.proShowFromResponse(proShow))
    this.setState({ proShows: proShows })
  }

  handlePatchResponse(response: any): void {
    this.handlePutResponse(response)
  }

  handleDeleteResponse(id: number): void {
    const proShows = this.state.proShows
    proShows.delete(id)
    this.setState({ proShows: proShows })
  }

  ProShowCard = (proShow: ProShow) => {
    const [orientation, setOrientation] = useState<'row' | 'column'>('column')
    const [isLoaded, setLoaded] = useState(false)
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const width = e.currentTarget.naturalWidth
      const height = e.currentTarget.naturalHeight

      if (width > height) {
        setOrientation('column')
      } else {
        setOrientation('row')
      }

      setLoaded(true)
    }

    return (
      <Card sx={{ display: 'flex', flexDirection: orientation }}>
        {proShow.image && (
          <img
            src={proShow.image}
            style={{ position: 'absolute', visibility: 'hidden', width: '10px' }}
            onLoad={onImageLoad}
          />
        )}
        {proShow.image && isLoaded && (
          <CardMedia
            sx={{
              minWidth: '40%',
              maxWidth: orientation === 'row' ? '40%' : '100%',
              height: orientation === 'row' ? '100%' : '150px',
            }}
            component="img"
            image={proShow.image}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent>
            <Typography variant="h5">{proShow.title}</Typography>
            <Typography variant="body1">{proShow.description}</Typography>

            <Stack direction="row" sx={{ pt: 1, flexWrap: 'wrap', gap: 1, '& svg': { width: '18px' } }}>
              <Chip label={proShow.day} icon={Drawer.items.days.icon} sx={{ pl: 0.5 }} />
              <Chip
                label={proShow.venue + (proShow.room ? ` - ${proShow.room}` : '')}
                icon={Drawer.items.venues.icon}
                sx={{ pl: 0.5 }}
              />
              <Chip
                label={format(proShow.startTime, 'h:mm a') + ' - ' + format(proShow.endTime, 'h:mm a')}
                icon={<Schedule />}
                sx={{ pl: 0.5 }}
              />
              <Chip
                label={proShow.cost === 0 ? 'Free' : proShow.cost.toFixed(2)}
                icon={<CurrencyRupee />}
                sx={{ pl: 0.5 }}
              />
              {proShow.facultyCoordinatorName && (
                <Chip
                  label={
                    proShow.facultyCoordinatorName +
                    (proShow.facultyCoordinatorMobile ? ` - ${proShow.facultyCoordinatorMobile}` : '')
                  }
                  icon={<Face />}
                  sx={{ pl: 0.5 }}
                />
              )}
              {proShow.studentCoordinatorName && (
                <Chip
                  label={
                    proShow.studentCoordinatorName +
                    (proShow.studentCoordinatorMobile ? ` - ${proShow.studentCoordinatorMobile}` : '')
                  }
                  icon={<Face />}
                  sx={{ pl: 0.5 }}
                />
              )}
            </Stack>
          </CardContent>
          <CardActions disableSpacing>
            <Tooltip title="Edit">
              <IconButton
                onClick={() => {
                  this.setState({
                    editingProShow: proShow,
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
                    editingProShow: proShow,
                    isDeleteDialogOpen: true,
                  })
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Box>
      </Card>
    )
  }

  AddOrEditDialog = () => {
    const [isLoading, setLoading] = useState(false)
    const [isDaysLoading, setDaysLoading] = useState(false)
    const [isVenuesLoading, setVenuesLoading] = useState(false)
    const [dayOptions, setDayOptions] = useState<any[]>([])
    const [venueOptions, setVenueOptions] = useState<any[]>([])
    const [dayQuery, setDayQuery] = useState('')
    const [venueQuery, setVenueQuery] = useState('')
    const [selectedDayId, setDayId] = useState<number>()
    const [selectedVenueId, setVenueId] = useState<number>()
    const onClose = () => this.setState({ isAddOrEditDialogOpen: false })
    const proShow = this.state.editingProShow

    const fetchResults = async (type: 'days' | 'venues') => {
      try {
        const baseUrl = '/api/latest/' + type
        const query = type === 'days' ? dayQuery : venueQuery
        const response = await new Network(this.apiKey).doGet(baseUrl, { query: { query: query } })
        const options: any[] = []

        for (let i = 0; i < response[type].length; ++i) {
          if (type === 'days') {
            options.push({
              id: response.days[i].id,
              title: response.days[i].title,
              date: new Date(response.days[i].date),
            })
          } else {
            for (let j = 0; j < response.venues[i].rooms.length; ++j) {
              const room = response.venues[i].rooms[j]
              options.push({
                id: room.id,
                title: response.venues[i].title + (room.title ? ' - ' + room.title : ''),
              })
            }
          }
        }

        if (type === 'days') {
          if (query !== dayQuery) return
        } else {
          if (query !== venueQuery) return
        }

        if (type === 'days') {
          setDayOptions(options)
          setDaysLoading(false)
        } else {
          setVenueOptions(options)
          setVenuesLoading(false)
        }
      } catch (err: any) {
        this.onError?.(err)
      }
    }

    useEffect(() => {
      setDaysLoading(true)
      const timeout = setTimeout(() => fetchResults('days'), 500)
      return () => clearTimeout(timeout)
    }, [dayQuery])

    useEffect(() => {
      setVenuesLoading(true)
      const timeout = setTimeout(() => fetchResults('venues'), 500)
      return () => clearTimeout(timeout)
    }, [venueQuery])

    useEffect(() => {
      setDayId(proShow?.dayId)
      setVenueId(proShow?.venueId)
    }, [this.state.isAddOrEditDialogOpen])

    return (
      <Dialog onClose={onClose} open={this.state.isAddOrEditDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle onClose={onClose}>{proShow ? 'Edit' : 'Add'} Pro Show</DialogTitle>
        <DialogContent>
          <form ref={this.formRef} onSubmit={(event) => event.preventDefault()}>
            <input name="id" value={proShow?.id} type="hidden" />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
              <Stack spacing={1} sx={{ flexGrow: 1, width: '40%' }}>
                <ImageInput
                  name="image"
                  style={{ height: 'unset', flexGrow: 1 }}
                  defaultValue={proShow?.image ?? undefined}
                  disabled={isLoading}
                />
                <TextField name="title" placeholder="Title" defaultValue={proShow?.title} disabled={isLoading} />
                <TextArea
                  name="description"
                  placeholder="Add a description..."
                  style={{ minWidth: '100%' }}
                  defaultValue={proShow?.description ?? undefined}
                  disabled={isLoading}
                />
              </Stack>
              <Stack spacing={1} sx={{ flexGrow: 1, maxWidth: '60%' }}>
                <Autocomplete
                  options={dayOptions}
                  getOptionLabel={(day) => day?.title}
                  onInputChange={(_, v) => setDayQuery(v)}
                  onChange={(_, v) => setDayId(v?.id)}
                  onOpen={() => fetchResults('days')}
                  onClose={() => setDayOptions([])}
                  filterOptions={(x) => x}
                  defaultValue={proShow ? { id: proShow.dayId, title: proShow.day, date: new Date() } : undefined}
                  loading={isDaysLoading}
                  renderInput={(params) => (
                    <>
                      <TextField
                        {...params}
                        placeholder="Select a day"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {isDaysLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                      <input name="day_id" value={selectedDayId ?? ''} hidden />
                    </>
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <span>{option.title}</span>
                      <span style={{ color: 'grey', marginLeft: 'auto', textAlign: 'right' }}>
                        {format(option.date, 'yyyy-MM-dd')}
                      </span>
                    </Box>
                  )}
                  disabled={isLoading}
                />
                <Autocomplete
                  options={venueOptions}
                  getOptionLabel={(venue) => venue?.title}
                  onInputChange={(_, v) => setVenueQuery(v)}
                  onChange={(_, v) => setVenueId(v?.id)}
                  onOpen={() => fetchResults('venues')}
                  onClose={() => setVenueOptions([])}
                  filterOptions={(x) => x}
                  defaultValue={
                    proShow
                      ? { id: proShow.roomId, title: proShow.venue + (proShow.room ? ' - ' + proShow.room : '') }
                      : undefined
                  }
                  loading={isVenuesLoading}
                  renderInput={(params) => (
                    <>
                      <TextField
                        {...params}
                        placeholder="Select a venue"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {isVenuesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                      <input name="venue_id" value={selectedVenueId ?? ''} hidden />
                    </>
                  )}
                  disabled={isLoading}
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    name="start_time"
                    placeholder="Start Time"
                    type="time"
                    defaultValue={proShow ? format(proShow.startTime, 'HH:mm') : ''}
                    sx={{ flexGrow: 1 }}
                    disabled={isLoading}
                  />
                  <TextField
                    name="end_time"
                    placeholder="End Time"
                    type="time"
                    defaultValue={proShow ? format(proShow.endTime, 'HH:mm') : ''}
                    sx={{ flexGrow: 1 }}
                    disabled={isLoading}
                  />
                </Stack>
                <TextField
                  name="cost"
                  placeholder="Cost"
                  type="number"
                  defaultValue={proShow?.cost}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyRupee sx={{ fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  disabled={isLoading}
                />
                <TextField
                  name="faculty_coordinator_name"
                  placeholder="Faculty Coordinator Name"
                  defaultValue={proShow?.facultyCoordinatorName}
                  disabled={isLoading}
                />
                <TextField
                  name="faculty_coordinator_mobile"
                  type="number"
                  placeholder="Faculty Coordinator Mobile"
                  defaultValue={proShow?.facultyCoordinatorMobile}
                  disabled={isLoading}
                />
                <TextField
                  name="student_coordinator_name"
                  placeholder="Student Coordinator Name"
                  defaultValue={proShow?.studentCoordinatorName}
                  disabled={isLoading}
                />
                <TextField
                  name="student_coordinator_mobile"
                  type="number"
                  placeholder="Student Coordinator Mobile"
                  defaultValue={proShow?.studentCoordinatorMobile}
                  disabled={isLoading}
                />
                <TextField
                  name="event_id"
                  type="number"
                  placeholder="Event ID"
                  defaultValue={proShow?.eventId}
                  disabled={isLoading}
                />
              </Stack>
            </Stack>
            <Stack spacing={1} mt={0.5}>
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
                Save Pro Show
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
    const proShow = this.state.editingProShow

    return (
      <Dialog onClose={onClose} open={this.state.isDeleteDialogOpen}>
        <DialogTitle onClose={onClose}>Delete Pro Show</DialogTitle>
        <DialogContent>
          <input value={proShow?.id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>
              Are you sure you want to delete <b>{proShow?.title}</b>?
            </Typography>
            <Button
              isLoading={isLoading}
              variant="contained"
              onClick={() => {
                setLoading(true)
                this.deleteItem(proShow!.id)
                  .then((_) => onClose())
                  .finally(() => setLoading(false))
              }}
            >
              Delete Pro Show
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
          {...Drawer.items['pro-shows']}
          action={
            <MaterialButton
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => this.setState({ editingProShow: undefined, isAddOrEditDialogOpen: true })}
            >
              Add Pro Show
            </MaterialButton>
          }
        />
        <Box sx={{ pl: 2, pt: 2, overflowAnchor: 'none' }}>
          {this.state.isLoading || this.state.proShows.size != 0 ? (
            <Masonry columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 4 }} spacing={2}>
              {Array.from(this.state.proShows).map(([_, proShow]) => (
                <div>
                  <this.ProShowCard key={proShow.id} {...proShow} />
                </div>
              ))}
            </Masonry>
          ) : (
            <EmptyState>No pro shows have been added yet.</EmptyState>
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
