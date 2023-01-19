import { Add, Close } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { red } from "@mui/material/colors";
import React from "react";

interface MultiImageInputState {
  images: File[];
  imageData: string[];
  selectedIndex: number;
}

interface MultiImageInputProps {
  /**
   * The name of the input field
   */
  name?: string;

  /**
   * The initial image
   */
  defaultValue?: string;

  /**
   * The size limit
   * @default 5 MB
   */
  size: number;

  /**
   * The image limit
   * @default 10
   */
  files: number;

  /**
   * If `true`, the input field is disabled
   */
  disabled: boolean;

  /**
   * Function to handle errors
   */
  onError?: (message: string) => void;

  /**
   * Function to handle warnings
   */
  onWarning?: (message: string) => void;
}

export default class MultiImageInput extends React.Component<MultiImageInputProps, MultiImageInputState> {
  static defaultProps: MultiImageInputProps = {
    size: 5,
    files: 10,
    disabled: false
  };
  
  fileInput: React.RefObject<HTMLInputElement>;

  constructor(props: MultiImageInputProps) {
    super(props);

    this.state = {
      images: [],
      imageData: [],
      selectedIndex: -1
    };

    this.fileInput = React.createRef();
  }

  render() {
    const imageData = this.state.imageData;
    const selectedIndex = this.state.selectedIndex;

    return (
      <Box sx={{
        height: '250px',
        display: 'flex',
        flexDirection: 'row',
      }}>
        <input name={this.props.name} style={{ display: 'none' }} type="file" accept="image/png, image/jpeg" onChange={this.handleOnChange} ref={this.fileInput} multiple></input>
        {this.state.images.length !== 0 && <Box
          sx={{
            paddingRight: '15px',
            marginRight: '10px',
            height: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
        >
          {this.state.images.length < this.props.files && <Box
            sx={(theme) => ({
              width: '75px',
              height: '75px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.secondary,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: '2px solid transparent',
              transition: 'border-color 0.3s',
              '&:hover': {
                cursor: 'pointer',
                borderColor: theme.palette.primary.main,
              }
            })}
            onClick={this.handleOnAdd}
          >
            <Add sx={{ fontSize: 40 }} />
          </Box>}
          {imageData.map((i, x) => <Box
            key={x}
            sx={(theme) => ({
              width: '75px',
              height: '75px',
              position: 'relative',
              backgroundColor: theme.palette.background.paper,
              backgroundImage: `url(${i})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              color: theme.palette.text.secondary,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: '2px solid',
              borderColor: selectedIndex === x
                            ? theme.palette.primary.main
                            : 'transparent',
              marginTop: '10px',
              transition: 'border-color 0.3s',
              '&:hover': {
                cursor: 'pointer',
                borderColor: theme.palette.primary.main,
              }
            })}
            onClick={() => this.handleOnClick(x)}
          >
            <IconButton 
              sx={{
                width: 20, 
                height: 20,
                position: 'absolute',
                top: -10,
                right: -10,
                background: red[500],
                '&:hover': {
                  background: red[500],
                }
              }}
              onClick={(event) => this.handleOnDelete(event, x)}
            >
              <Close sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>)}
        </Box>}
        <Box sx={(theme) => ({
          height: '100%',
          flexGrow: 1,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `url(${selectedIndex === -1
                            ? ''
                            : imageData[selectedIndex]})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${theme.shape.borderRadius}px`,
          color: theme.palette.text.secondary,
        })}>
          {this.state.selectedIndex === -1 && <Box sx={(theme) => ({
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: `${theme.shape.borderRadius}px`,
            border: '2px solid transparent',
            transition: 'border-color 0.3s',
            '&:hover': {
              cursor: 'pointer',
              borderColor: theme.palette.primary.main,
            }
          })} onClick={this.handleOnAdd} >
            <Add sx={{ fontSize: 40 }} />
            <Typography variant="h6">Add images</Typography>
          </Box>}
        </Box>
      </Box>
    );
  }

  handleOnAdd = () => {
    this.fileInput.current?.click();
  }

  handleOnClick = (i: number) => {
    if (this.state.selectedIndex == i) {
      return;
    }

    this.setState({ selectedIndex: i });
  }

  handleOnDelete = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    e.stopPropagation();

    this.state.images.splice(i, 1);
    this.state.imageData.splice(i, 1);
    this.refreshFileInput();

    var selectedIndex = this.state.selectedIndex;

    if (selectedIndex >= i) {
      --selectedIndex;
    }

    if (selectedIndex === -1 && this.state.images.length != 0) {
      selectedIndex = 0;
    }

    this.setState({
      images: this.state.images,
      imageData: this.state.imageData,
      selectedIndex: selectedIndex
    });
  }

  handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;

    if (!files) {
      return;
    }

    for (var i = 0; i < files.length; ++i) {
      if (this.state.images.length === this.props.files) {
        this.props.onWarning?.(`You can only upload ${this.props.files} images at a time.`);
        break;
      }

      if (files[i].size > 1024 * 1024 * this.props.size!) {
        this.fileInput.current && (this.fileInput.current.value = '');
        this.props.onError?.(`An image exceeds the ${this.props.size} MB limit.`);
        continue;
      }

      this.state.images.unshift(files[i]);
      this.state.imageData.unshift(URL.createObjectURL(files[i]));
    }

    this.refreshFileInput();
    this.setState({
      images: this.state.images,
      imageData: this.state.imageData,
      selectedIndex: this.state.images.length === 0 ? -1 : 0
    });
  }

  refreshFileInput = () => {
    const dataTransfer = new DataTransfer();

    for (var i = 0; i < this.state.images.length; ++i) {
      dataTransfer.items.add(this.state.images[i]);
    }

    this.fileInput.current!.files = dataTransfer.files;
  }
}
