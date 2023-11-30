import api from "../../services/api";

const useQueues = () => {
	const findAll = async () => {
        const { data } = await api.get("/queue");
        return data;
    }

    const findByUserId = async (userId) => {
        const { data } = await api.get(`/queue/u/${userId}`);
        return data;
    }

	return { findAll, findByUserId };
};

export default useQueues;
