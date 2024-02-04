import { Typography } from '@mui/material'
import React from 'react'

interface EmptyStateProps {
  children?: string
}

export default class EmptyState extends React.Component<EmptyStateProps, {}> {
  render() {
    return (
      <div style={{ paddingLeft: 50, paddingRight: 50, paddingTop: 100, paddingBottom: 100 }}>
        <Typography variant="h5" color="text.secondary" style={{ textAlign: 'center' }}>
          {this.props.children ?? "There's nothing here."}
        </Typography>
      </div>
    )
  }
}
