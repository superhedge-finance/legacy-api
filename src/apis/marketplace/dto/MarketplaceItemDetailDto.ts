import { Property } from "@tsed/schema";
import { MarketplaceItemDto } from "./MarketplaceItemDto";

export type OfferType = {
  id: number;
  tokenId: string;
  listingId: string;
  price: number;
  startingTime: number;
  quantity: number;
  seller: string;
};

export class MarketplaceItemDetailDto extends MarketplaceItemDto {
  @Property()
  offers: OfferType[];
}
