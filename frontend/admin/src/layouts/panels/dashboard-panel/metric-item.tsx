import { Box, CircularProgress, circularProgressClasses, Typography } from '@mui/material'

export default function MetricItem(props: { name: string; value: number; total: number; unit?: string }) {
  const normalise = (value: number, total: number) => {
    const result = (value * 75) / total
    return isNaN(result) ? 0 : result
  }

  const percentage = (value: number, total: number) => {
    const result = (value * 100) / total
    return isNaN(result) ? result : result.toFixed(0) + '%'
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress
          sx={(theme) => ({
            color: theme.palette.grey[800],
            position: 'absolute',
            transform: 'rotate(135deg) !important',
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: 'round',
            },
          })}
          size={100}
          thickness={5}
          variant="determinate"
          value={75}
        />
        <CircularProgress
          sx={{
            transform: 'rotate(135deg) !important',
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: 'round',
            },
          }}
          size={100}
          thickness={5}
          variant="determinate"
          value={normalise(props.value, props.total)}
        />
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            position: 'absolute',
          }}
        >
          {percentage(props.value, props.total)}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        {Number(props.value.toFixed(1))} of {Number(props.total.toFixed(1))} {props.unit}
      </Typography>
      <Typography sx={{ textAlign: 'center' }}>{props.name}</Typography>
    </Box>
  )
}
