import * as cron from "node-cron";
import { Inject, Injectable } from "@tsed/di";
// import { REDIS_CONNECTION } from "../dal/RedisConnection";
import { ContractService } from "./ContractService";
import { ProductService } from "../apis/product/services/ProductService";

@Injectable()
export class CronService {
  // @Inject(REDIS_CONNECTION)
  // protected connection: REDIS_CONNECTION; // ioredis instance

  @Inject()
  private readonly contractService: ContractService;

  @Inject()
  private readonly productService: ProductService;

  $onInit() {
    // https://crontab.guru/#*/5_*_*_*_* (At every 5th minute)
    cron.schedule("*/5 * * * *", async () => {
      const lastBlockNumber = await this.contractService.getLatestBlockNumber();
      const pastEvents = await this.contractService.getPastEvents("ProductCreated", lastBlockNumber - 50, lastBlockNumber);
      await this.productService.syncProducts(pastEvents);

      const products = await this.productService.getProductsWithoutStatus();
      for (const product of products) {
        const stats = await this.contractService.getProductStats(product.address);
        await this.productService.updateProduct(product.address, stats);
      }
    });
  }
}
