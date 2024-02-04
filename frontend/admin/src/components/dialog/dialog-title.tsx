import CloseIcon from '@mui/icons-material/Close'
import {
  DialogTitle as MaterialDialogTitle,
  DialogTitleProps as MaterialDialogTitleProps,
  IconButton,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import React from 'react'

interface DialogTitleProps extends MaterialDialogTitleProps {
  /**
   * If defined, a close button will be displayed
   */
  onClose?: () => void
}

const StyledDialogTitle = styled(MaterialDialogTitle, {
  shouldForwardProp: (propName) => {
    const propertyKeys = new Set(['onClose'])
    return !propertyKeys.has(propName.toString())
  },
})<DialogTitleProps>(({ theme, onClose }) => ({
  alignItems: 'center',
  color: theme.palette.primary.main,
  display: 'flex',
  fontWeight: 'bold',
  justifyContent: onClose ? 'space-between' : 'center',
}))

export default class DialogTitle extends React.Component<DialogTitleProps> {
  render() {
    const { children, ...others } = this.props

    return (
      <StyledDialogTitle {...others}>
        {children}
        {others.onClose && (
          <IconButton color="primary" onClick={others.onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </StyledDialogTitle>
    )
  }
}
