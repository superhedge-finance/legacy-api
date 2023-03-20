import { Property } from "@tsed/schema";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../../shared/enum";

export class HistoryResponseDto {
  @Property()
  address: string;

  @Property()
  type: HISTORY_TYPE;

  @Property()
  withdrawType: WITHDRAW_TYPE;

  @Property()
  productName: string;

  @Property()
  amountInDecimal: number;

  @Property()
  transactionHash: string;

  @Property()
  createdAt: Date;
}
