import { Repository } from "typeorm";
import { BigNumber, ethers } from "ethers";
import { Marketplace } from "../entity";

export class MarketplaceRepository extends Repository<Marketplace> {
  async syncItemListedEntity(
    owner: string,
    nft: string,
    product: string,
    tokenId: BigNumber,
    quantity: BigNumber,
    payToken: string,
    price: BigNumber,
    startingTime: BigNumber,
    transactionHash: string,
  ): Promise<Marketplace | null> {
    const exist = await this.findOne({
      where: { transactionHash },
    });
    if (!exist) {
      const marketplace = new Marketplace();
      marketplace.seller = owner;
      marketplace.nft = nft;
      marketplace.product = product;
      marketplace.tokenId = tokenId.toString();
      marketplace.tokenIdInDecimal = tokenId.toNumber();
      marketplace.quantity = quantity.toString();
      marketplace.quantityInDecimal = quantity.toNumber();
      marketplace.payToken = payToken;
      marketplace.price = price.toString();
      marketplace.priceInDecimal = Number(ethers.utils.formatUnits(price, 6));
      marketplace.startingTime = startingTime.toNumber();
      marketplace.transactionHash = transactionHash;
      return this.save(marketplace);
    }
    return null;
  }
}
