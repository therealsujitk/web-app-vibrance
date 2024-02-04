import { Box, Typography } from '@mui/material'

export default function InfoItem(props: { package: string; version: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 'bolder' }}>
        {props.package}
      </Typography>
      <Typography color="text.secondary" variant="subtitle2">
        {props.version}
      </Typography>
    </Box>
  )
}
