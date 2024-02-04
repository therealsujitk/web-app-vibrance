import { styled } from '@mui/material'
import React from 'react'

const Container = styled('div')(({ theme }) => ({
  width: '100%',
  maxHeight: '200px',
  backgroundColor: theme.palette.background.paper,
  backgroundSize: 'contain',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
  overflow: 'hidden',
}))

export default class Image extends React.Component<{ src?: string }> {
  render() {
    const imageStyle = {
      maxWidth: '100%',
      height: '100%',
    }

    return (
      <Container>
        <img style={imageStyle} src={this.props.src ?? ''}></img>
      </Container>
    )
  }
}
