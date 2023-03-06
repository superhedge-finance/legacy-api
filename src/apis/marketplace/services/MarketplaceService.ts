import { Inject, Injectable } from "@tsed/di";
import { MarketplaceRepository, Product } from "../../../dal";
import { MarketplaceItemDto } from "../MarketplaceItemDto";
import { ethers } from "ethers";
import { MarketplaceItemFullDto } from "../MarketplaceItemFullDto";
import { MarketplaceItemDetailDto } from "../MarketplaceItemDetailDto";

@Injectable()
export class MarketplaceService {
  @Inject(MarketplaceRepository)
  private readonly marketplaceRepository: MarketplaceRepository;

  async getListedItems(): Promise<MarketplaceItemDto[]> {
    const listedItems = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.isExpired = false")
      .andWhere("marketplace.isSold = false")
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .getMany();

    return listedItems.map((item) => {
      const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, 6);
      return {
        id: item.id,
        tokenId: item.tokenId,
        listingId: item.listingId,
        offerPrice: item.priceInDecimal,
        mtmPrice: 0,
        quantity: item.quantityInDecimal,
        underlying: item.product.underlying,
        productAddress: item.product.address,
        name: item.product.name,
        totalLots: Math.floor(Number(currentCapacity) / 1000),
        issuanceCycle: item.product.issuanceCycle,
      };
    });
  }

  async getUserListedItems(address: string): Promise<MarketplaceItemDto[]> {
    const listedItems = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.seller = :address", { address })
      .andWhere("marketplace.isExpired = false")
      .andWhere("marketplace.isSold = false")
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .getMany();

    return listedItems.map((item) => {
      const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, 6);
      return {
        id: item.id,
        tokenId: item.tokenId,
        listingId: item.listingId,
        offerPrice: item.priceInDecimal,
        mtmPrice: 0,
        quantity: item.quantityInDecimal,
        underlying: item.product.underlying,
        productAddress: item.product.address,
        name: item.product.name,
        totalLots: Math.floor(Number(currentCapacity) / 1000),
        issuanceCycle: item.product.issuanceCycle,
      };
    });
  }

  async getItem(listing_id: number): Promise<MarketplaceItemFullDto | null> {
    const item = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.listing_id = :listing_id", { listing_id })
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .getOne();

    if (!item) return null;

    const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, 6);
    return {
      id: item.id,
      tokenId: item.tokenId,
      listingId: item.listingId,
      offerPrice: item.priceInDecimal,
      mtmPrice: 0,
      quantity: item.quantityInDecimal,
      underlying: item.product.underlying,
      productAddress: item.product.address,
      name: item.product.name,
      totalLots: Math.floor(Number(currentCapacity) / 1000),
      issuanceCycle: item.product.issuanceCycle,
      startingTime: item.startingTime,
      seller: item.seller,
    };
  }

  async getTokenItem(listing_id: string): Promise<MarketplaceItemDetailDto | null> {
    const item = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.listing_id = :listing_id", { listing_id })
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .getOne();

    if (!item) return null;

    const offers = await this.marketplaceRepository.find({
      where: {
        product_address: item.product_address,
        listingId: listing_id,
      },
    });

    const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, 6);
    return {
      id: item.id,
      tokenId: item.tokenId,
      listingId: item.listingId,
      offerPrice: item.priceInDecimal,
      mtmPrice: 0,
      quantity: item.quantityInDecimal,
      underlying: item.product.underlying,
      productAddress: item.product.address,
      name: item.product.name,
      totalLots: Math.floor(Number(currentCapacity) / 1000),
      issuanceCycle: item.product.issuanceCycle,
      offers: offers.map((offer) => {
        return {
          id: offer.id,
          price: offer.priceInDecimal,
          quantity: offer.quantityInDecimal,
          startingTime: offer.startingTime,
          seller: offer.seller,
        };
      }),
    };
  }
}
