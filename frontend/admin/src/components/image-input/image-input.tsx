import { Add, Delete } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import React from "react";

interface ImageInputProps {
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
   * If `true`, the input field is disabled
   */
  disabled: boolean;

  /**
   * Custom styling
   */
  style: { [x: string]: any };

  /**
   * Function to handle errors
   */
  onError?: (message: string) => void;
}

export default class ImageInput extends React.Component<ImageInputProps, { image?: string }> {
  static defaultProps: ImageInputProps = {
    size: 5,
    disabled: false,
    style: {}
  };
  
  fileInput: React.RefObject<HTMLInputElement>;

  constructor(props: ImageInputProps) {
    super(props);

    this.state = {
      image: props.defaultValue
    };

    this.fileInput = React.createRef();
  }

  render() {
    return (
      <Box sx={(theme) => ({
        height: '120px',
        backgroundColor: theme.palette.background.paper,
        backgroundImage: `url(${this.state.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        borderRadius: `${theme.shape.borderRadius}px`,
        color: theme.palette.text.secondary,
        ...this.props.style
      })}>
        <input name={this.props.name} style={{ display: 'none' }} type="file" accept="image/*" onChange={this.handleOnChange} ref={this.fileInput}></input>
        <Box sx={(theme) => ({
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
        })} onClick={this.handleOnClick} >
          {this.state.image 
            ? <Delete sx={{ fontSize: 40 }} />
            : <Add sx={{ fontSize: 40 }} />}
          <Typography variant="h6">{this.state.image ? 'Delete' : 'Add'} image</Typography>
        </Box>
      </Box>
    );
  }

  handleOnClick = () => {
    if (this.state.image) {
      this.fileInput.current && (this.fileInput.current.value = '');
      return this.setState({ image: undefined });
    }

    this.fileInput.current?.click();
  }

  handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;

    if (files && files.length != 0) {
      if (files[0].size > 1024 * 1024 * this.props.size!) {
        this.fileInput.current && (this.fileInput.current.value = '');
        return this.props.onError?.(`Image exceeds the ${this.props.size} MB limit.`);
      }

      this.setState({ image: URL.createObjectURL(files[0]) });
    }
  }
}
