import * as cron from "node-cron";
import { Inject, Injectable } from "@tsed/di";
// import { REDIS_CONNECTION } from "../dal/RedisConnection";
import { ContractService } from "./ContractService";
import { ProductService } from "../apis/product/services/ProductService";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "./dto/enum";
import { MarketplaceRepository } from "../dal";

@Injectable()
export class CronService {
  // @Inject(REDIS_CONNECTION)
  // protected connection: REDIS_CONNECTION; // ioredis instance

  @Inject()
  private readonly contractService: ContractService;

  @Inject()
  private readonly productService: ProductService;

  @Inject(MarketplaceRepository)
  private readonly marketplaceRepository: MarketplaceRepository;

  $onInit() {
    // https://crontab.guru/#*/3_*_*_*_* (At every 3th minute)
    cron.schedule("*/3 * * * *", async () => {
      const lastBlockNumber = await this.contractService.getLatestBlockNumber();
      const pastEvents = await this.contractService.getPastEvents("ProductCreated", lastBlockNumber - 50, lastBlockNumber);
      await this.productService.syncProducts(pastEvents);

      const products = await this.productService.getProductsWithoutStatus();
      for (const product of products) {
        const stats = await this.contractService.getProductStats(product.address);
        await this.productService.updateProduct(product.address, stats);

        const pastDepositEvents = await this.contractService.getProductPastEvents(
          product.address,
          "Deposit",
          lastBlockNumber - 50,
          lastBlockNumber,
        );
        await this.productService.syncHistories(product.id, HISTORY_TYPE.DEPOSIT, pastDepositEvents);

        const withdrawEvents = await this.contractService.getProductPastEvents(
          product.address,
          "WithdrawPrincipal",
          lastBlockNumber - 50,
          lastBlockNumber,
        );
        await this.productService.syncHistories(product.id, HISTORY_TYPE.WITHDRAW, withdrawEvents, WITHDRAW_TYPE.PRINCIPAL);

        const withdrawCouponEvents = await this.contractService.getProductPastEvents(
          product.address,
          "WithdrawCoupon",
          lastBlockNumber - 50,
          lastBlockNumber,
        );
        await this.productService.syncHistories(product.id, HISTORY_TYPE.WITHDRAW, withdrawCouponEvents, WITHDRAW_TYPE.COUPON);

        const withdrawOptionEvents = await this.contractService.getProductPastEvents(
          product.address,
          "WithdrawOption",
          lastBlockNumber - 50,
          lastBlockNumber,
        );
        await this.productService.syncHistories(product.id, HISTORY_TYPE.WITHDRAW, withdrawOptionEvents, WITHDRAW_TYPE.OPTION);

        const matureEvents = await this.contractService.getProductPastEvents(
          product.address,
          "Mature",
          lastBlockNumber - 50,
          lastBlockNumber,
        );
        if (matureEvents.length > 0) {
          const marketplaceEntities = await this.marketplaceRepository.find({
            where: {
              product_address: product.address,
            },
          });
          for (const marketplaceEntity of marketplaceEntities) {
            marketplaceEntity.isExpired = true;
            await this.marketplaceRepository.save(marketplaceEntity);
          }
        }
      }
    });

    cron.schedule("*/3 * * * *", async () => {
      const lastBlockNumber = await this.contractService.getLatestBlockNumber();

      const pastItemListedEvents = await this.contractService.getMarketplacePastEvents("ItemListed", lastBlockNumber - 50, lastBlockNumber);
      for (const event of pastItemListedEvents) {
        if (event.args) {
          await this.marketplaceRepository.syncItemListedEntity(
            event.args.owner,
            event.args.nft,
            event.args.product,
            event.args.tokenId,
            event.args.quantity,
            event.args.payToken,
            event.args.pricePerItem,
            event.args.startingTime,
            event.transactionHash,
          );
        }
      }

      const pastItemSoldEvents = await this.contractService.getMarketplacePastEvents("ItemSold", lastBlockNumber - 50, lastBlockNumber);
      for (const event of pastItemSoldEvents) {
        if (event.args) {
          await this.marketplaceRepository.syncItemSoldEntity(
            event.args.seller,
            event.args.buyer,
            event.args.nft,
            event.args.product,
            event.args.tokenId,
            event.args.quantity,
            event.args.payToken,
            event.args.unitPrice,
            event.args.pricePerItem,
            event.transactionHash,
          );
        }
      }

      const pastItemCancelledEvents = await this.contractService.getMarketplacePastEvents(
        "ItemCanceled",
        lastBlockNumber - 50,
        lastBlockNumber,
      );
      for (const event of pastItemCancelledEvents) {
        if (event.args) {
          await this.marketplaceRepository.syncItemCanceledEntity(
            event.args.owner,
            event.args.nft,
            event.args.product,
            event.args.tokenId,
            event.transactionHash,
          );
        }
      }

      const pastItemUpdatedEvents = await this.contractService.getMarketplacePastEvents(
        "ItemUpdated",
        lastBlockNumber - 50,
        lastBlockNumber,
      );
      for (const event of pastItemUpdatedEvents) {
        if (event.args) {
          await this.marketplaceRepository.syncItemUpdatedEntity(
            event.args.owner,
            event.args.nft,
            event.args.product,
            event.args.tokenId,
            event.args.payToken,
            event.args.newPrice,
            event.transactionHash,
          );
        }
      }
    });
  }
}
