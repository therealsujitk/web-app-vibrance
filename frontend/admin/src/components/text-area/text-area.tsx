import { styled } from '@mui/material';

const TextArea = styled('textarea')(({ theme }) => ({
  minWidth: '100%',
  maxWidth: '100%',
  fontSize: '1rem',
  paddingLeft: theme.spacing(1.75),
  paddingTop: theme.spacing(2),
  paddingRight: theme.spacing(1.75),
  paddingBottom: theme.spacing(2),
  border: '2px solid transparent',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
  borderRadius: theme.shape.borderRadius,
  transition: 'border-color 0.3s',
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.primary.main
  }
}));

export default TextArea;
