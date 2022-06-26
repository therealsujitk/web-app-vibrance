import { Theme, useMediaQuery, useTheme } from "@mui/material";

interface MediaQueryProps {
    /**
     * The query string
     */
    query: string | ((theme : Theme) => string);

    /**
     * The children
     */
    children: (result : boolean) => JSX.Element;
}

export default function MediaQuery(props : MediaQueryProps) {
    const theme = useTheme();
    var query = props.query;

    if (typeof query != 'string') {
        query = query(theme);
    }

    return props.children(useMediaQuery(query));
}
