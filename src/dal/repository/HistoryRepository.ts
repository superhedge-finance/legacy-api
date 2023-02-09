import { ethers } from "ethers";
import { Repository } from "typeorm";
import { History } from "../entity";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../services/dto/enum";

export class HistoryRepository extends Repository<History> {
  createHistory = async (event: any, productId: number, type: HISTORY_TYPE, withdrawType: WITHDRAW_TYPE) => {
    const entity = new History();
    entity.address = type === HISTORY_TYPE.DEPOSIT ? event.args._from : event.args._to;
    entity.type = type;
    entity.withdrawType = withdrawType;
    entity.productId = productId;
    entity.amount = event.args._amount.toString();
    entity.amountInDecimal = Number(ethers.utils.formatUnits(event.args._amount, 6));
    entity.transactionHash = event.transactionHash;
    return this.save(entity);
  };
}
