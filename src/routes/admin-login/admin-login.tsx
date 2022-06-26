import { DialogContent, Link, Stack, Theme, Typography } from "@mui/material";
import { Button, Dialog, DialogTitle, TextField } from "../../components";
import './admin-login.css';

export default function AdminLogin() {
  return (
    <Dialog open={true}>
      <DialogTitle>Sign In</DialogTitle>
      <DialogContent>
        <Stack spacing={1} mt={0.5} mb={1}>
          <TextField placeholder="Username" variant="outlined" centerAlign autoFocus />
          <TextField placeholder="Password" type="password" variant="outlined" centerAlign />
          <Button variant="contained" sx={(theme: Theme) => ({ mt: `${theme.spacing(2)} !important` })}>Sign In</Button>
          <Typography sx={{ textAlign: 'center' }} pt={1} variant="subtitle2">
            Built by <Link href="https://therealsuji.tk" underline="none" target="_blank">@therealsujitk</Link>
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
