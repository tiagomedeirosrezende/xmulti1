import React, { useState, useEffect } from "react";
import Routes from "./routes";
import "react-toastify/dist/ReactToastify.css";

import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { ptBR } from "@material-ui/core/locale";

const App = () => {
	const [locale, setLocale] = useState();

  let theme = createTheme(
    {
      palette: {
        primary: { main: '#28A71A' },
        danger: { main: '#525252' },
      },
    },
    locale
  );

  theme = createTheme(theme, {
    scrollbarStyles: {
      scrollbarWidth: 'auto',
      scrollbarColor: `${theme.palette.primary.main} #ffffff`,
      '&::-webkit-scrollbar': {
        width: "4px",
      },
      '&::-webkit-scrollbar-track': {
        background: "rgba(255, 255, 255, 0)",
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.primary.main,
        borderRadius: "15px",
        border: "0px none #824dff00",
      },
    },
  });

	useEffect(() => {
		const i18nlocale = localStorage.getItem("i18nextLng");
		const browserLocale =
			i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

		if (browserLocale === "ptBR") {
			setLocale(ptBR);
		}
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<Routes />
		</ThemeProvider>
	);
};

export default App;
