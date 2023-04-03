import { Property } from "@tsed/schema";
import { CycleDto } from "../../product/dto/CycleDto";

export class MarketplaceItemDto {
  @Property()
  offerPrice: number;

  @Property()
  mtmPrice: number;

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
