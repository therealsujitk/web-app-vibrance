import { CallOutlined, EmailOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Masonry } from '@mui/lab';
import { Avatar, Box, Button as MaterialButton, Card, CardActions, CardContent, CircularProgress, DialogContent, IconButton, Link, Stack, Tooltip, Typography } from "@mui/material";
import Cookies from 'js-cookie';
import React from "react";
import { Button, Dialog, DialogTitle, EmptyState, ImageInput, TextArea, TextField } from '../../../components';
import { AppContext, AppContextInterface } from '../../../contexts/app';
import Network from '../../../utils/network';
import Drawer from "../../drawer/drawer";
import PanelHeader from "../../panel-header/panel-header";

interface TeamPanelState {
  /**
   * The list of team
   */
  team: { [x: number]: Member };

  /**
   * The current member details for the dialog
   */
  currentMember?: Member;

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

interface Member {
  /**
   * The unique id of the member
   */
  id: number;

  /**
   * The title of the member
   */
  name: string;

  /**
   * The date of the categroy
   */
  description: string|null;

  /**
   * The image of the member
   */
  image: string|null;

  /**
   * The image of the member
   */
  phone: string|null;

  /**
   * The image of the member
   */
  email: string|null;
}

export default class TeamPanel extends React.Component<{}, TeamPanelState> {
  apiKey: string;
  apiBaseUrl: string;

  titleInput: React.RefObject<HTMLInputElement>;
  dateInput: React.RefObject<HTMLInputElement>;

  onError?: AppContextInterface['displayError'];

  constructor(props : {}) {
    super(props);

    this.state = {
      team: [],
      currentMember: undefined,
      isAddEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isLoading: true
    };

    this.titleInput = React.createRef();
    this.dateInput = React.createRef();

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/team';

    this.openAddDialog.bind(this);
    this.openEditDialog.bind(this);
    this.openDeleteDialog.bind(this);
    this.toggleAddEditDialog.bind(this);
    this.toggleDeleteDialog.bind(this);
  }

  componentDidMount() {
    this.getTeam(this.onError!);
  }

  render() {
    const panelInfo = Drawer.items.team;

    const MemberCard = (props: Member) => (
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar 
            sx={{ width: 120, height: 120, fontSize: 70, mb: 2 }} 
            src={props.image ?? undefined}
            alt={props.name}
          />
          <Typography variant="h5">{props.name}</Typography>
          <Typography variant="body1">{props.description}</Typography>
          <Box sx={{
            marginHorizontal: 2,
            width: '100%',
            textAlign: 'center',
            '& a': {
              textTransform: 'none',
              width: '100%',
              whiteSpace: 'normal',
              wordBreak: 'break-all'
            },
            '& a:first-of-type': {
              marginTop: 1,
            }
          }}>
            {props.phone &&
              <MaterialButton startIcon={<CallOutlined />} href={'tel:' + props.phone}>
                {props.phone}
              </MaterialButton>
            }
            {props.email && 
              <MaterialButton startIcon={<EmailOutlined />} href={'mailto:' + props.email}>
                {props.email}
              </MaterialButton>
            }
          </Box>
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
        <PanelHeader title={panelInfo.title} icon={panelInfo.icon} description={panelInfo.description} action={<MaterialButton variant="outlined" startIcon={<AddIcon />} onClick={() => this.openAddDialog()}>Add Member</MaterialButton>} />
        <Box sx={{pl: 2, pt: 2}}>
          {this.state.isLoading
            ? (<Box textAlign="center"><CircularProgress sx={{mt: 10}} /></Box>)
            : Object.keys(this.state.team).length != 0
              ? (<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 8 }} spacing={2}>
                {Object.values(this.state.team).map(member => 
                  <MemberCard key={member.id} {...member} />)}
                </Masonry>)
              : (<EmptyState>No team members have been added yet.</EmptyState>)
          }
        </Box>
        <AddEditDialog
          member={this.state.currentMember}
          opened={this.state.isAddEditDialogOpen}
          onClose={() => this.toggleAddEditDialog(false)}
          onUpdate={this.saveMember} />
        <DeleteDialog
          member={this.state.currentMember}
          opened={this.state.isDeleteDialogOpen}
          onClose={() => this.toggleDeleteDialog(false)}
          onUpdate={this.deleteMember} />
      </Box>
    );
  }

  openAddDialog() {
    this.setState({currentMember: undefined});
    this.toggleAddEditDialog(true);
  }

  openEditDialog(member: Member) {
    this.setState({currentMember: member});
    this.toggleAddEditDialog(true);
  }

  openDeleteDialog(member: Member) {
    this.setState({currentMember: member});
    this.toggleDeleteDialog(true);
  }

  toggleAddEditDialog(isOpen: boolean) {
    this.setState({isAddEditDialogOpen: isOpen});
  }

  toggleDeleteDialog(isOpen: boolean) {
    this.setState({isDeleteDialogOpen: isOpen});
  }

  getTeam = async (onError: AppContextInterface['displayError']) => {
    try {
      const response = await new Network().doGet(this.apiBaseUrl);
      const team = response.team;

      for (var i = 0; i < team.length; ++i) {
        const member: Member = {
          id: team[i].id,
          name: team[i].name,
          description: team[i].description,
          image: team[i].image,
          phone: team[i].phone,
          email: team[i].email
        };

        this.state.team[member.id] = member;
      }

      this.setState({ 
        team: this.state.team,
        isLoading: false
      });
    } catch (err) {
      onError(err as string, { name: 'Retry', onClick: () => this.getTeam(onError) });
    }
  }

  saveMember = (member: Member) => {
    this.state.team[member.id] = member;
    this.setState({ team: this.state.team });
  }

  deleteMember = (member: Member) => {
    delete this.state.team[member.id];
    this.setState({ team: this.state.team });
  }
}

interface MemberDialogProps {
  /**
   * The member being edited or deleted
   * @default undefined
   */
  member?: Member;

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
  onUpdate: (member: Member) => void;
}

interface MemberDialogState {
  /**
   * `true` if the dialog is in a loading state
   * @default false
   */
  isLoading: boolean;
}

class AddEditDialog extends React.Component<MemberDialogProps, MemberDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  formRef: React.RefObject<HTMLFormElement>;
  titleInput: React.RefObject<HTMLInputElement>;
  typeInput: React.RefObject<HTMLInputElement>;

  constructor(props: MemberDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/team';

    this.formRef = React.createRef();
    this.titleInput = React.createRef();
    this.typeInput = React.createRef();
  }
  
  render() {
    const id = this.props.member?.id;
    const name = this.props.member ? this.props.member.name : '';
    const description = this.props.member ? this.props.member.description : '';
    const phone = this.props.member ? this.props.member.phone : '';
    const email = this.props.member ? this.props.member.email : '';
    
    return(
      <Dialog onClose={this.props.onClose} open={this.props.opened  || false}>
        <DialogTitle onClose={this.props.onClose}>{this.props.member ? 'Edit' : 'Add'} Member</DialogTitle>
        <DialogContent>
          <form ref={this.formRef}>
            <input name="id" value={id} type="hidden" />
            <AppContext.Consumer>
              {({ displayError }) => (
                <Stack spacing={1} mt={0.5}>
                  <ImageInput name="image" defaultValue={this.props.member?.image ?? undefined} onError={displayError} />
                  <TextField name="name" placeholder="Name" defaultValue={name} disabled={this.state.isLoading} />
                  <TextArea name="description" placeholder="Enter a description" defaultValue={description ?? ''} />
                  <TextField name="phone" placeholder="Mobile Number" defaultValue={phone} disabled={this.state.isLoading} />
                  <TextField name="email" placeholder="Email ID" type="email" defaultValue={email} disabled={this.state.isLoading} />
                  <Button isLoading={this.state.isLoading} variant="contained" sx={(theme) => ({ mt: `${theme.spacing(2)} !important` })} onClick={() => this.addEdit(displayError)}>Save Member</Button>
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
      const response = await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/${formData.get('id') ? 'edit' : 'add'}`, { body: formData }, true);
      
      this.props.onUpdate({
        id: response.member.id,
        name: response.member.name,
        description: response.member.description,
        image: response.member.image,
        phone: response.member.phone,
        email: response.member.email,
      });
      this.props.onClose();
    } catch (err) {
      onError(err as string);
    }

    this.setState({ isLoading: false });
  }
}

class DeleteDialog extends React.Component<MemberDialogProps, MemberDialogState> {
  apiKey: string;
  apiBaseUrl: string;

  constructor(props: MemberDialogProps) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.apiKey = Cookies.get('apiKey')!;
    this.apiBaseUrl = '/api/latest/team';
  }
  
  render() {
    const id = this.props.member?.id;
    const name = this.props.member ? this.props.member.name : '';

    return (
      <Dialog onClose={this.props.onClose} open={this.props.opened || false}>
        <DialogTitle onClose={this.props.onClose}>Delete member</DialogTitle>
        <DialogContent>
          <input value={id} type="hidden" disabled />
          <Stack spacing={2} mt={0.5}>
            <Typography>Are you sure you want to delete <b>{name}</b>?</Typography>
            <AppContext.Consumer>
              {({ displayError }) => (
                <Button isLoading={this.state.isLoading} variant="contained" onClick={() => this.delete(displayError)}>Delete Member</Button>
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
      const member = {
        id: this.props.member!.id.toString()
      }
      const f = new FormData();
      f.append("id", this.props.member!.id.toString());

      await new Network(this.apiKey).doPost(`${this.apiBaseUrl}/delete`, { body: f });
      
      this.props.onUpdate(this.props.member!);
      this.props.onClose();
    } catch (err) {
      onError(err as string);
    }

    this.setState({ isLoading: false });
  }
}
