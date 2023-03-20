import { BigNumber, ethers } from "ethers";
import { Repository } from "typeorm";
import { History } from "../entity";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../shared/enum";

export class HistoryRepository extends Repository<History> {
  createHistory = async (
    chainId: number,
    address: string,
    amount: BigNumber,
    transactionHash: string,
    productId: number,
    type: HISTORY_TYPE,
    withdrawType: WITHDRAW_TYPE,
    tokenId?: BigNumber,
    supply?: BigNumber,
  ) => {
    const exist = await this.findOne({ where: { transactionHash } });
    if (!exist) {
      const entity = new History();
      entity.address = address;
      entity.chainId = chainId;
      entity.type = type;
      entity.withdrawType = withdrawType;
      entity.productId = productId;
      entity.amount = amount.toString();
      entity.amountInDecimal = Number(ethers.utils.formatUnits(amount, 6));
      entity.transactionHash = transactionHash;
      if (tokenId) {
        entity.tokenId = tokenId.toString();
      }
      if (supply) {
        entity.supply = supply.toString();
        entity.supplyInDecimal = supply.toNumber();
      }
      return this.save(entity);
    }
  };
}
