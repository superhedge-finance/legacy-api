import { Repository } from "typeorm";
import {WithdrawRequest} from "../entity/WithdrawRequest";

export class WithdrawRequestRepository extends Repository<WithdrawRequest> {}
