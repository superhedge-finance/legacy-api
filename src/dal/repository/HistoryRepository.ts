import { BigNumber, ethers } from "ethers";
import { Repository } from "typeorm";
import { History } from "../entity";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../services/dto/enum";

export class HistoryRepository extends Repository<History> {
  createHistory = async (
    address: string,
    amount: BigNumber,
    transactionHash: string,
    productId: number,
    type: HISTORY_TYPE,
    withdrawType: WITHDRAW_TYPE,
  ) => {
    const exist  = await this.findOne({ where: { transactionHash } });
    if (!exist) {
      const entity = new History();
      entity.address = address;
      entity.type = type;
      entity.withdrawType = withdrawType;
      entity.productId = productId;
      entity.amount = amount.toString();
      entity.amountInDecimal = Number(ethers.utils.formatUnits(amount, 6));
      entity.transactionHash = transactionHash;
      return this.save(entity);
    }
  };
}
