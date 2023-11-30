import React, { useEffect, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";

import { i18n } from "../../translate/i18n";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  textRight: {
    textAlign: "right",
  },
  tabPanelsContainer: {
    padding: theme.spacing(2),
  },
}));

const initialSettings = {
  randomMessageInterval: 20,
  fixedMessageInterval: 0,
  longerIntervalAfter: 20,
  greaterInterval: 60,
  variables: [],
};

const CampaignsConfig = () => {
  const classes = useStyles();

  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    api.get("/campaign-settings").then(({ data }) => {
      const settingsList = [];
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          settingsList.push([item.key, JSON.parse(item.value)]);
        });
        setSettings(Object.fromEntries(settingsList));
      }
    });
  }, []);

  const handleOnChangeSettings = (e) => {
    const changedProp = {};
    changedProp[e.target.name] = e.target.value;
    setSettings((prev) => ({ ...prev, ...changedProp }));
  };

  const saveSettings = async () => {
    await api.post("/campaign-settings", { settings });
    toast.success("Configurações salvas");
  };

  return (
    <MainContainer>
      <MainHeader>
        <Grid style={{ width: "99.6%" }} container>
          <Grid xs={12} item>
            <Title>{i18n.t("campaignsConfig.title")}</Title>
          </Grid>
        </Grid>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <Box className={classes.tabPanelsContainer}>
          <Grid spacing={2} container>
            <Grid xs={12} item>
              <Typography component={"h3"}>Intervalos</Typography>
            </Grid>
            <Grid xs={12} md={4} item>
              <FormControl
                variant="outlined"
                className={classes.formControl}
                fullWidth
              >
                <InputLabel id="randomMessageInterval-label">
                  Intervalo Randômico de Disparo
                </InputLabel>
                <Select
                  name="randomMessageInterval"
                  id="randomMessageInterval"
                  labelId="randomMessageInterval-label"
                  label="Intervalo Randômico de Disparo"
                  value={settings.randomMessageInterval}
                  onChange={(e) => handleOnChangeSettings(e)}
                >
                  <MenuItem value={0}>Sem Intervalo</MenuItem>
                  <MenuItem value={5}>5 segundos</MenuItem>
                  <MenuItem value={10}>10 segundos</MenuItem>
                  <MenuItem value={15}>15 segundos</MenuItem>
                  <MenuItem value={20}>20 segundos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} md={4} item>
              <FormControl
                variant="outlined"
                className={classes.formControl}
                fullWidth
              >
                <InputLabel id="longerIntervalAfter-label">
                  Intervalo Maior Após
                </InputLabel>
                <Select
                  name="longerIntervalAfter"
                  id="longerIntervalAfter"
                  labelId="longerIntervalAfter-label"
                  label="Intervalo Maior Após"
                  value={settings.longerIntervalAfter}
                  onChange={(e) => handleOnChangeSettings(e)}
                >
                  <MenuItem value={0}>Não definido</MenuItem>
                  <MenuItem value={5}>5 mensagens</MenuItem>
                  <MenuItem value={10}>10 mensagens</MenuItem>
                  <MenuItem value={15}>15 mensagens</MenuItem>
                  <MenuItem value={20}>20 mensagens</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} md={4} item>
              <FormControl
                variant="outlined"
                className={classes.formControl}
                fullWidth
              >
                <InputLabel id="greaterInterval-label">
                  Intervalo de Disparo Maior
                </InputLabel>
                <Select
                  name="greaterInterval"
                  id="greaterInterval"
                  labelId="greaterInterval-label"
                  label="Intervalo de Disparo Maior"
                  value={settings.greaterInterval}
                  onChange={(e) => handleOnChangeSettings(e)}
                >
                  <MenuItem value={0}>Sem Intervalo</MenuItem>
                  <MenuItem value={20}>20 segundos</MenuItem>
                  <MenuItem value={30}>30 segundos</MenuItem>
                  <MenuItem value={40}>40 segundos</MenuItem>
                  <MenuItem value={50}>50 segundos</MenuItem>
                  <MenuItem value={60}>1 minuto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} md={4} item>
              <FormControl
                variant="outlined"
                className={classes.formControl}
                fullWidth
              >
                <InputLabel id="fixedMessageInterval-label">
                  Intervalo Fixo de Disparo
                </InputLabel>
                <Select
                  name="fixedMessageInterval"
                  id="fixedMessageInterval"
                  labelId="fixedMessageInterval-label"
                  label="Intervalo Fixo de Disparo"
                  value={settings.fixedMessageInterval}
                  onChange={(e) => handleOnChangeSettings(e)}
                >
                  <MenuItem value={0}>Não definido</MenuItem>
                  <MenuItem value={5}>5 segundos</MenuItem>
                  <MenuItem value={10}>10 segundos</MenuItem>
                  <MenuItem value={15}>15 segundos</MenuItem>
                  <MenuItem value={20}>20 segundos</MenuItem>
                  <MenuItem value={30}>30 segundos</MenuItem>
                  <MenuItem value={40}>40 segundos</MenuItem>
                  <MenuItem value={50}>50 segundos</MenuItem>
                  <MenuItem value={60}>1 minuto</MenuItem>
                  <MenuItem value={120}>2 minutos</MenuItem>
                  <MenuItem value={180}>3 minutos</MenuItem>
                  <MenuItem value={300}>5 minutos</MenuItem>
                  <MenuItem value={600}>10 minutos</MenuItem>
                  <MenuItem value={900}>15 minutos</MenuItem>
                  <MenuItem value={1800}>30 minutos</MenuItem>
                  <MenuItem value={3600}>1 hora</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} className={classes.textRight} item>
              <Button
                onClick={saveSettings}
                color="primary"
                variant="contained"
              >
                Salvar Configurações
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </MainContainer>
  );
};

export default CampaignsConfig;
