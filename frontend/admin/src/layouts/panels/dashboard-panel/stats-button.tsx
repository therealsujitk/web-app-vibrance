import { North, South } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { formatDuration, formatNumber } from "../../../utils/helpers";

interface StatsButtonProps {
  name: string;
  oldValue: number;
  newValue: number;
  formatValue: 'number'|'duration';
  selected: boolean;
  onClick: () => void;
}

StatsButton.defaultProps = {
  selected: false,
};

export default function StatsButton(props: StatsButtonProps) {
  const hasIncreased = props.newValue >= props.oldValue;
  const increasePercent = (Math.abs(props.newValue - props.oldValue) * 100 / props.oldValue).toFixed(1);
  const currentValue = props.formatValue === 'duration' ? formatDuration(props.newValue) : formatNumber(props.newValue);

  return (
    <Box sx={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
    }}>
      {props.selected && <Box sx={(theme) => ({
        position: 'absolute',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '0px 0px 16px 16px',
        width: '80%',
        height: 5,
      })} />}
      <Button 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          justifyContent: 'end',
          textTransform: 'none',
          textAlign: 'left',
          padding: 2,
        }}
        onClick={props.onClick}
      >
        <Typography variant="body1" sx={(theme) => ({ color: theme.palette.primary.main })}>{props.name}</Typography>
        <Typography variant="h4" color="text.primary">{currentValue}</Typography>
        <Typography variant="subtitle2" color={hasIncreased ? 'green' : 'error'} sx={{ display: 'flex', alignItems: 'center' }}>
          {hasIncreased ? <North sx={{fontSize: 14}} /> : <South sx={{fontSize: 14}} />} {increasePercent}%
        </Typography>
      </Button>
    </Box>
  );
}
