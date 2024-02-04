import { Select as MaterialSelect, SelectProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledSelect = styled(MaterialSelect)<SelectProps>(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))',
  '& fieldset': {
    borderColor: 'transparent',
    transition: 'border-color 0.3s',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  }
}));

export default class Select extends React.Component<SelectProps> {
  
  render() {
    return (
      <StyledSelect {...this.props}/>
    );
  }
}
