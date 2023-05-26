/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Inject, Injectable } from "@tsed/di";
import { MarketplaceRepository, ProductRepository, Product } from "../../../dal";
import { MarketplaceItemDto } from "../dto/MarketplaceItemDto";
import { ethers } from "ethers";
import { MarketplaceItemFullDto } from "../dto/MarketplaceItemFullDto";
import { MarketplaceItemDetailDto } from "../dto/MarketplaceItemDetailDto";
import { DECIMAL } from "../../../shared/constants";

@Injectable()
export class MarketplaceService {
  @Inject(MarketplaceRepository)
  private readonly marketplaceRepository: MarketplaceRepository;

  @Inject(ProductRepository)
  private readonly productRepository: ProductRepository;
  async getListedItems(chainId: number): Promise<MarketplaceItemDto[]> {
    const listedItems = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.isExpired = false")
      .andWhere("marketplace.isSold = false")
      .andWhere("marketplace.chainId = :chainId", { chainId })
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .select(["MIN(marketplace.priceInDecimal) as best_price", "product_address"])
      .groupBy("product_address")
      .getRawMany();

    return await Promise.all(listedItems.map(async (item) => {
      const product = await this.productRepository.findOne({
        where: {
          address: item.product_address
        }
      });

      const currentCapacity = ethers.utils.formatUnits(product!.currentCapacity, DECIMAL[chainId]);
      return {
        offerPrice: item.best_price,
        mtmPrice: product!.mtmPrice,
        underlying: product!.underlying,
        productAddress: product!.address,
        name: product!.name,
        totalLots: Math.floor(Number(currentCapacity) / 1000),
        issuanceCycle: product!.issuanceCycle,
        vaultStrategy: product!.vaultStrategy,
        risk: product!.risk,
        fees: product!.fees,
        counterparties: product!.counterparties
      };
    }));
  }

  async getUserListedItems(address: string, chainId: number): Promise<MarketplaceItemFullDto[]> {
    const listedItems = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.seller = :address", { address })
      .andWhere("marketplace.isExpired = false")
      .andWhere("marketplace.isSold = false")
      .andWhere("marketplace.chainId = :chainId", { chainId })
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .getMany();

    return listedItems.map((item) => {
      const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, DECIMAL[chainId]);
      return {
        offerPrice: item.priceInDecimal,
        mtmPrice: item.product.mtmPrice,
        underlying: item.product.underlying,
        productAddress: item.product.address,
        name: item.product.name,
        totalLots: Math.floor(Number(currentCapacity) / 1000),
        issuanceCycle: item.product.issuanceCycle,
        vaultStrategy: item.product.vaultStrategy,
        risk: item.product.risk,
        fees: item.product.fees,
        counterparties: item.product.counterparties,
        id: item.id,
        tokenId: item.tokenId,
        listingId: item.listingId,
        quantity: item.quantityInDecimal,
        startingTime: item.startingTime,
        seller: item.seller,
      };
    });
  }

  async getItem(listing_id: number, chainId: number): Promise<MarketplaceItemFullDto | null> {
    const item = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.listing_id = :listing_id", { listing_id })
      .andWhere("marketplace.chainId = :chainId", { chainId })
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .getOne();

    if (!item) return null;

    const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, DECIMAL[chainId]);
    return {
      offerPrice: item.priceInDecimal,
      mtmPrice: item.product.mtmPrice,
      underlying: item.product.underlying,
      productAddress: item.product.address,
      name: item.product.name,
      totalLots: Math.floor(Number(currentCapacity) / 1000),
      issuanceCycle: item.product.issuanceCycle,
      vaultStrategy: item.product.vaultStrategy,
      risk: item.product.risk,
      fees: item.product.fees,
      counterparties: item.product.counterparties,
      id: item.id,
      tokenId: item.tokenId,
      listingId: item.listingId,
      quantity: item.quantityInDecimal,
      startingTime: item.startingTime,
      seller: item.seller
    };
  }

  /*async getTokenItem(listing_id: string, chainId: number): Promise<MarketplaceItemDetailDto | null> {
    const item = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.listing_id = :listing_id", { listing_id })
      .andWhere("marketplace.chainId = :chainId", { chainId })
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .getOne();

    if (!item) return null;

    const offers = await this.marketplaceRepository.find({
      where: {
        product_address: item.product_address,
        listingId: listing_id,
      },
    });

    const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, DECIMAL[chainId]);
    return {
      id: item.id,
      tokenId: item.tokenId,
      listingId: item.listingId,
      offerPrice: item.priceInDecimal,
      mtmPrice: item.product.mtmPrice,,
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
  }*/

  async getTokenItem(product_address: string, chainId: number): Promise<MarketplaceItemDetailDto | null> {
    const item = await this.marketplaceRepository
      .createQueryBuilder("marketplace")
      .where("marketplace.product_address = :product_address", { product_address })
      .andWhere("marketplace.chainId = :chainId", { chainId })
      .andWhere("marketplace.isExpired = false")
      .andWhere("marketplace.isSold = false")
      .leftJoinAndMapOne("marketplace.product", Product, "product", "marketplace.product_address = product.address")
      .orderBy("marketplace.priceInDecimal")
      .getOne();

    if (!item) return null;

    const offers = await this.marketplaceRepository.find({
      where: {
        product_address: item.product_address,
        chainId: chainId,
        isExpired: false,
        isSold: false
      },
    });

    const currentCapacity = ethers.utils.formatUnits(item.product.currentCapacity, DECIMAL[chainId]);
    return {
      offerPrice: item.priceInDecimal,
      mtmPrice: item.product.mtmPrice,
      underlying: item.product.underlying,
      productAddress: item.product.address,
      name: item.product.name,
      totalLots: Math.floor(Number(currentCapacity) / 1000),
      issuanceCycle: item.product.issuanceCycle,
      vaultStrategy: item.product.vaultStrategy,
      risk: item.product.risk,
      fees: item.product.fees,
      counterparties: item.product.counterparties,
      offers: offers.map((offer) => {
        return {
          id: offer.id,
          tokenId: offer.tokenId,
          listingId: offer.listingId,
          price: offer.priceInDecimal,
          quantity: offer.quantityInDecimal,
          startingTime: offer.startingTime,
          seller: offer.seller,
        };
      }),
    };
  }
}
