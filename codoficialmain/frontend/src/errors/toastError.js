import { toast } from "react-toastify";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

const toastError = err => {
	const errorMsg = err.response?.data?.error;
	const toastConfig = {
		toastId: errorMsg,
		autoClose: 2000,
		hideProgressBar: false,
		closeOnClick: true,
		pauseOnHover: false,
		draggable: true,
		progress: undefined,
		theme: "light",
	};
	if (errorMsg && i18n.exists(`backendErrors.${errorMsg}`)) {
		toast.error(i18n.t(`backendErrors.${errorMsg}`), toastConfig);
	} else if (process.env.NODE_ENV === 'development') {
		toast.error(errorMsg ? errorMsg : isString(err) ? err : "An error occurred!", toastConfig);
	}
};

export default toastError;
