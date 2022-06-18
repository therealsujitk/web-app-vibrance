import { Button as MaterialButton, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledButton = styled(MaterialButton)<ButtonProps>(({ theme }) => ({
  fontWeight: 'bold',
  textTransform: 'none',
}));

export default class Button extends React.Component<ButtonProps> {
  static defaultProps : ButtonProps = {
    size: 'large',
  };
  
  render() {
    const { children, ...others } = this.props;

    return (
      <StyledButton {...others}>
        {children}
      </StyledButton>
    );
  }
}
