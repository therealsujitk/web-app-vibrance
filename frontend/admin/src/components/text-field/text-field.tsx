import { TextField as MaterialTextField, TextFieldProps as MaterialTextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

type TextFieldProps = {
  /**
   * If `true`, text will be center aligned
   * @default false
   */
  centerAlign : boolean;
} & MaterialTextFieldProps;

const StyledTextField = styled(MaterialTextField, {
  shouldForwardProp: (propName) => {
    const propertyKeys = new Set(['centerAlign']);
    return !propertyKeys.has(propName.toString())
  },
})<TextFieldProps>(({ theme, centerAlign }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))',
    '& input': {
      textAlign: centerAlign ? 'center' : 'left',
    },
    '& fieldset': {
      borderColor: 'transparent',
      textAlign: 'center',
      transition: 'border-color 0.3s',
    },
    '&:hover fieldset': {
      borderColor: 'transparent',
    },
    '&.Mui-disabled fieldset': {
      borderColor: 'transparent',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    }
  },
}));

export default class TextField extends React.Component<TextFieldProps> {
  static defaultProps : TextFieldProps = {
    centerAlign: false,
  };
  
  render() {
    return (
      <StyledTextField {...this.props}/>
    );
  }
}
