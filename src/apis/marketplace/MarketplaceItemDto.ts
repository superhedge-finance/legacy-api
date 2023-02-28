import { Property } from "@tsed/schema";
import { CycleDto } from "../product/dto/CycleDto";

export class MarketplaceItemDto {
  @Property()
  id: number;

  @Property()
  tokenId: string;

  @Property()
  offerPrice: number;

  @Property()
  mtmPrice: number;

  @Property()
  quantity: number;

  @Property()
  underlying: string;

  @Property()
  productAddress: string;

  @Property()
  name: string;

  @Property()
  totalLots: number;

  @Property()
  issuanceCycle: CycleDto;
}
