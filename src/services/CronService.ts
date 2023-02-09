import * as cron from "node-cron";
import { Inject, Injectable } from "@tsed/di";
// import { REDIS_CONNECTION } from "../dal/RedisConnection";
import { ContractService } from "./ContractService";
import { ProductService } from "../apis/product/services/ProductService";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "./dto/enum";

@Injectable()
export class CronService {
  // @Inject(REDIS_CONNECTION)
  // protected connection: REDIS_CONNECTION; // ioredis instance

  @Inject()
  private readonly contractService: ContractService;

  @Inject()
  private readonly productService: ProductService;

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
      }
    });
  }
}
