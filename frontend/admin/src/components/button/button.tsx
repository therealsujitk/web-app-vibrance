import { Button as MaterialButton, ButtonProps as MaterialButtonProps, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import React from 'react'

interface ButtonProps extends MaterialButtonProps {
  /**
   * If `true`, a loading indicator will be visible and
   * the button will be disabled
   * @default false
   */
  isLoading: boolean
}

const StyledButton = styled(MaterialButton, {
  shouldForwardProp: (propName) => {
    const propertyKeys = new Set(['isLoading'])
    return !propertyKeys.has(propName.toString())
  },
})<ButtonProps>(() => ({
  fontWeight: 'bold',
  textTransform: 'none',
}))

export default class Button extends React.Component<ButtonProps> {
  static defaultProps: Partial<ButtonProps> = {
    size: 'large',
    isLoading: false,
  }

  render() {
    const { children, ...others } = this.props

    if (others.isLoading) {
      others.startIcon = <CircularProgress size={20} color="inherit" />
      others.disabled = true
    }

    return <StyledButton {...others}>{children}</StyledButton>
  }
}
