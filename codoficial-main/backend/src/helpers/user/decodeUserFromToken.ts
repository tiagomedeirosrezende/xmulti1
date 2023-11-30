import { UserViewModel } from "../../@types/UserViewModel";
import FindUserFromToken from "../../services/AuthServices/FindUserFromToken";
import merge from "lodash.merge";


export default async function decodeUserFromToken(token:string): Promise<UserViewModel> {
  const User = await FindUserFromToken(token);
  let user:UserViewModel = { id: 0, profile: "", superAdmin: false };

  user = {
    id: User.id,
    profile: User.profile,
    superAdmin: User.super,
  }

  return user;
}