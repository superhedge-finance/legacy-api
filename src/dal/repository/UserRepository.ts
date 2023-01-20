import { Repository } from "typeorm";
import { User } from "../entity";

export class UserRepository extends Repository<User> {}
