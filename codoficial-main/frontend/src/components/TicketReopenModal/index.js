import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import { makeStyles } from "@material-ui/core";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import useQueues from "../../hooks/useQueues";

const useStyles = makeStyles((theme) => ({
  maxWidth: {
    width: "100%",
  },
}));


const TicketReopenModal = ({ modalOpen, onClose, ticketid, userId }) => {
  const history = useHistory();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedQueue, setSelectedQueue] = useState("");
  const classes = useStyles();
  const { findByUserId: findAllQueuesByUserId } = useQueues();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      const loadQueues = async () => {
        const list = await findAllQueuesByUserId(userId);
        setQueues(list);
      };
      loadQueues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modalOpen || searchParam.length < 3) {
      setLoading(false);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/", {
            params: { searchParam },
          });
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, modalOpen]);

  const handleClose = () => {
    onClose();
    setSearchParam("");
  };

  const handleSaveTicket = async (e) => {
    e.preventDefault();
    if (!ticketid) return;
    if (!selectedQueue || selectedQueue === "") return;
    setLoading(true);
    try {
      let data = {};

      data.status = "open";
      data.userId = userId;

      if (selectedQueue && selectedQueue !== null) {
        data.queueId = selectedQueue;
      }

      if (userId && data.queueId) {
        await api.put(`/tickets/${ticketid}`, data);
      }

      history.push(`/tickets`);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="lg" scroll="paper">
      <form onSubmit={handleSaveTicket}>
        <DialogTitle id="form-dialog-title">
          {i18n.t("reopenTicketModal.title")}
        </DialogTitle>
        <DialogContent dividers>
          <FormControl variant="outlined" className={classes.maxWidth}>
            <InputLabel>
              {i18n.t("reopenTicketModal.fieldQueueLabel")}
            </InputLabel>
            <Select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              label={i18n.t("reopenTicketModal.fieldQueuePlaceholder")}
              style={{ width: 300 }}
            >
              {queues.map((queue) => (
                <MenuItem key={queue.id} value={queue.id}>
                  {queue.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="secondary"
            disabled={loading}
            variant="outlined"
          >
            {i18n.t("reopenTicketModal.buttons.cancel")}
          </Button>
          <ButtonWithSpinner
            variant="contained"
            type="submit"
            color="primary"
            loading={loading}
          >
            {i18n.t("reopenTicketModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TicketReopenModal;