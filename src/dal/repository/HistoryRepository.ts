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
    productId: number,
    type: HISTORY_TYPE,
    withdrawType: WITHDRAW_TYPE,
    tokenId?: BigNumber,
    supply?: BigNumber,
  ) => {
    const exist = await this.findOne({ where: { transactionHash } });
    if (!exist) {
      const lastEntity = await this.findOne(
        { where: { chainId: chainId, address: address }, order: { created_at: 'DESC' }}
      );
      let totalBalance = 0;
      if (lastEntity) totalBalance = lastEntity.totalBalance;
      const entity = new History();
      entity.address = address;
      entity.chainId = chainId;
      entity.type = type;
      entity.withdrawType = withdrawType;
      entity.productId = productId;
      entity.amount = amount.toString();
      entity.amountInDecimal = Number(ethers.utils.formatUnits(amount, DECIMAL[chainId]));
      if (type == HISTORY_TYPE.WITHDRAW) {
        entity.totalBalance = totalBalance - entity.amountInDecimal;
      } else {
        entity.totalBalance = totalBalance + entity.amountInDecimal;
      }
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
