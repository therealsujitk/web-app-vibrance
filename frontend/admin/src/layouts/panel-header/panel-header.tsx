import { Box, Paper, Typography } from '@mui/material'
import React from 'react'

interface PanelHeaderProps {
  /**
   * The header title
   */
  title: string

  /**
   * The header icon
   */
  icon: JSX.Element

  /**
   * The header description
   */
  description: string

  /**
   * Optional header action
   */
  action?: JSX.Element
}

export default class PanelHeader extends React.Component<PanelHeaderProps> {
  render() {
    return (
      <Paper sx={{ alignItems: 'center', borderRadius: 0, display: 'flex', p: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <i style={{ fontSize: 20 }}>{this.props.icon}</i>
            <Typography variant="h5" sx={{ fontWeight: 'bold', ml: 1.5 }}>
              {this.props.title}
            </Typography>
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {this.props.description}
          </Typography>
        </Box>
        {this.props.action}
      </Paper>
    )
  }
}
