import { BigNumber, ethers } from "ethers";
import { Repository } from "typeorm";
import { History } from "../entity";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../shared/enum";
import { DECIMAL } from "../../shared/constants";

export class HistoryRepository extends Repository<History> {
  createHistory = async (
    chainId: number,
    address: string,
    amount: BigNumber,
    transactionHash: string,
    logIndex: number,
    productId: number,
    type: HISTORY_TYPE,
    withdrawType: WITHDRAW_TYPE,
    tokenId?: BigNumber,
    supply?: BigNumber,
  ) => {
    const exist = await this.findOne({ where: { transactionHash, logIndex } });
    if (!exist) {
      const entity = new History();
      entity.address = address;
      entity.chainId = chainId;
      entity.type = type;
      entity.withdrawType = withdrawType;
      entity.productId = productId;
      entity.amount = amount.toString();
      entity.amountInDecimal = Number(ethers.utils.formatUnits(amount, DECIMAL[chainId]));
      entity.transactionHash = transactionHash;
      entity.logIndex = logIndex;
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
