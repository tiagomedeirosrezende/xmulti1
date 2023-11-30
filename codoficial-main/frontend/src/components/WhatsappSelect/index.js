import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { InputLabel,MenuItem, FormControl, Select, Chip, CircularProgress } from "@material-ui/core";
import useWhatsApps from "../../hooks/useWhatsApps";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	chips: {
		display: "flex",
		flexWrap: "wrap",
	},
	chip: {
		margin: 2,
	},
}));

const WhatsappSelect = ({ selectedWhatsappIds, onChange }) => {
	const classes = useStyles();
	const [whatsapps, setWhatsapps] = useState([]);
	const { loading, whatsApps } = useWhatsApps();

	useEffect(() => {
		setWhatsapps(whatsApps);
	}, [loading]);

	const handleChange = e => {
		onChange(e.target.value);
	};

	return (
		<div style={{ marginTop: 6 }}>
			<FormControl fullWidth margin="dense" variant="outlined">
				<InputLabel>{i18n.t("whatsappSelect.inputLabel")}</InputLabel>
				<Select
					multiple
					label={i18n.t("whatsappSelect.inputLabel")}
					labelWidth={60}
					value={selectedWhatsappIds}
					onChange={handleChange}
					MenuProps={{
						anchorOrigin: {
							vertical: "bottom",
							horizontal: "left",
						},
						transformOrigin: {
							vertical: "top",
							horizontal: "left",
						},
						getContentAnchorEl: null,
					}}
					renderValue={selected => (
						<div className={classes.chips}>
							{selected?.length > 0 &&
								selected.map(id => {
									const selectedWhatsapps = whatsapps.find(q => q.id === id);
									return selectedWhatsapps ? (
										<Chip
											key={id}
											size="small"
											style={{ backgroundColor: '#7d79f2', color: "white" }}
											variant="outlined"
											label={selectedWhatsapps.name}
											className={classes.chip}
										/>
									) : null;
								})}
						</div>
					)}
				>
					{loading ? <CircularProgress /> : whatsapps.map(whatsapps => (
						<MenuItem key={whatsapps.id} value={whatsapps.id}>
							{whatsapps.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</div>
	);
};

export default WhatsappSelect;
