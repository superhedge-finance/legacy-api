import { Property } from "@tsed/schema";
import { MarketplaceItemDto } from "./MarketplaceItemDto";

export class MarketplaceItemFullDto extends MarketplaceItemDto {
  @Property()
  startingTime: number;

  @Property()
  seller: string;
}
