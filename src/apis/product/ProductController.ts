import { Controller, Inject } from "@tsed/di";
import { Get, Returns } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "./services/ProductService";
import { CreatedProductDto } from "./dto/CreatedProductDto";
import {CronService} from "../../services/CronService";

@Controller("/products")
export class ProductController {
  @Inject()
  private readonly contractService: ContractService;

  @Inject()
  private readonly productService: ProductService;

  @Inject()
  private readonly cronService: CronService;

  $onInit() {
    this.contractService.subscribeToEvents("ProductCreated", (event: any) => {
      this.contractService.getLatestBlockNumber().then((blockNumber) => {
        this.contractService.getPastEvents("ProductCreated", blockNumber - 10, blockNumber).then((pastEvents) => {
          this.productService.syncProducts(pastEvents).then((r) => console.log(r));
        });
      });
    });

    this.productService.getProductsWithoutStatus().then((products) => {
      products.forEach((product) => {
        this.contractService.subscribeToProductEvents(
          product.address,
          ["Deposit", "WithdrawPrincipal", "FundAccept", "FundLock", "Issuance", "Mature", "Unpaused", "Paused"],
          (eventName, event) => {
            if (eventName === "Paused" || eventName === "Unpaused") {
              this.productService.updateProductPauseStatus(product.address, eventName === "Paused").then((r) => console.log(r));
            } else {
              this.contractService.getProductStats(product.address).then((stats) => {
                this.productService.updateProduct(product.address, stats).then((r) => console.log(r));
              });
            }
          },
        );
      });
    });
  }

  @Get("")
  @Returns(200, Array<CreatedProductDto>)
  async getProducts(): Promise<Array<CreatedProductDto>> {
    return await this.productService.getProducts();
  }

  @Get("/:address")
  @Returns(200, CreatedProductDto)
  async getProduct(@PathParams("address") address: string): Promise<CreatedProductDto | null> {
    return await this.productService.getProduct(address);
  }

  @Get("/sync_products/:block")
  async syncProducts(@PathParams("block") block: number): Promise<void> {
    const pastEvents = await this.contractService.getPastEvents("ProductCreated", block - 10, block + 10);
    await this.productService.syncProducts(pastEvents);
  }
}
