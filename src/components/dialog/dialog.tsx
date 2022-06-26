import { Dialog as MaterialDialog, DialogProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledDialog = styled(MaterialDialog)<DialogProps>(({ theme }) => ({
  '& .MuiPaper-root': {
    background: theme.palette.background.default,
    borderRadius: 2 * Number(theme.shape.borderRadius),
    width: 300,
  }
}));

export default class Dialog extends React.Component<DialogProps> {
  static defaultProps : Partial<DialogProps> = {
    scroll: 'body',
  };

  render() {
    const { children, ...others } = this.props;

    return (
      <StyledDialog {...others}>
        {children}
      </StyledDialog>
    );
  }
}
