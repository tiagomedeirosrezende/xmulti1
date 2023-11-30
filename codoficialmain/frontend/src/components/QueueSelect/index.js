import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { InputLabel, FormHelperText, MenuItem, FormControl, Select, Chip, } from "@material-ui/core";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { capitalize } from "../../helpers/string";

const useStyles = makeStyles(theme => ({
	chips: {
		display: "flex",
		flexWrap: "wrap",
	},
	chip: {
		margin: 2,
	},
}));

const QueueSelect = ({
	selectedQueueIds,
	onChange,
	wrapperStyle = { marginTop: 6 },
	multiple = true,
	userId,
	formErrors,
	disabled,
	companyId,
}) => {
	const classes = useStyles();
	const [queues, setQueues] = useState([]);
	const [singleQueue, setSingleQueue] = useState(0);

	useEffect(() => {
		(async () => {
			try {
				let params = {};
				let call = {};
				if (companyId) {
					params.companyId = companyId;
				}
				if (userId) {
					call = await api.get(`/queue/u/${userId}`, params);
				} else {
					call = await api.get("/queue", params);
				}
				const { data } = call;

				setQueues(data);
			} catch (err) {
				toastError(err);
			}
		})();
	}, [companyId, userId]);

	useEffect(() => {
		if (!multiple) {
			setSingleQueue((Array.isArray(selectedQueueIds) ? selectedQueueIds[0] : selectedQueueIds) ?? "")
		}

	}, [selectedQueueIds]);


	const handleChange = e => {
		onChange(e.target.value);
	};

	if (multiple) {
		return (
			<div style={wrapperStyle}>
				<FormControl fullWidth margin="dense" variant="outlined" error={Boolean(formErrors?.queue)} >
					<InputLabel>{i18n.t("queueSelect.inputLabel")}</InputLabel>
					<Select
						multiple
						labelWidth={60}
						value={selectedQueueIds}
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
										const queue = queues.find(q => q.id === id);
										return queue ? (
											<Chip
												key={id}
												size="small"
												style={{ backgroundColor: queue.color }}
												variant="outlined"
												label={queue.name}
												className={classes.chip}
											/>
										) : null;
									})}
							</div>
						)}
					>
						{queues.map(queue => (
							<MenuItem key={queue.id} value={queue.id}>
								{queue.name}
							</MenuItem>
						))}
					</Select>
					<FormHelperText>{formErrors?.queue && capitalize(i18n.t("simpleDict.required") ?? "")}</FormHelperText>
				</FormControl>
			</div>
		);
	}

	return (
		<Select
			label={i18n.t("queueSelect.inputLabel")}
			placeholder={i18n.t("queueSelect.inputLabel")}
			labelId="queue-selection-label"
			onChange={handleChange}
			value={singleQueue}
			renderValue={ selected => { const queue = queues.find(q => q.id === selected);
				return (
					<div className={classes.chips}>
						{ queue ? (
							<Chip
								size="small"
								style={{ backgroundColor: queue.color }}
								variant="outlined"
								label={queue.name}
								className={classes.chip}
							/>)
							: null}
					</div>
				)}}
			disabled={disabled}
		>
			{queues.map(queue => (
				<MenuItem key={queue.id} value={queue.id}>
					{queue.name}
				</MenuItem>
			))}
		</Select>
	);
};

export default QueueSelect;
