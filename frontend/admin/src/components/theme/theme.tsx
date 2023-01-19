import { Theme as MaterialTheme, useTheme } from "@mui/material";

interface ThemeProps {
    /**
     * The children
     */
    children: (theme: MaterialTheme) => JSX.Element;
}

export default function Theme(props : ThemeProps) {
    const theme = useTheme();
    return props.children(theme);
}
