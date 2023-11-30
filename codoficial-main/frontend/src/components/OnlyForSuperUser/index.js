const OnlyForSuperUser = ({ user, yes, no }) => user.superAdmin ? yes() : no();

OnlyForSuperUser.defaultProps = {
    user: {},
	yes: () => null,
	no: () => null,
};

export default OnlyForSuperUser;