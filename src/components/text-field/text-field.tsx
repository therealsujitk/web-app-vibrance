import { TextField as MaterialTextField, BaseTextFieldProps as MaterialTextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface TextFieldProps extends MaterialTextFieldProps {
  /**
   * If `true`, text will be center aligned
   * @default false
   */
  centerAlign : boolean;
}

const StyledTextField = styled(MaterialTextField, {
  shouldForwardProp: (propName) => {
    const propertyKeys = new Set(['centerAlign']);
    return !propertyKeys.has(propName.toString())
  },
})<TextFieldProps>(({ theme, centerAlign }) => ({
  '& .MuiOutlinedInput-root': {
    background: theme.palette.background.paper,
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
