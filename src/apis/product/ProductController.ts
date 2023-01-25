import { Controller, Inject } from "@tsed/di";
import { Get, Returns } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "./services/ProductService";
import { CreatedProductDto } from "./dto/CreatedProductDto";

@Controller("/products")
export class ProductController {
  constructor(
    @Inject(ContractService) private contractService: ContractService,
    @Inject(ProductService) private productService: ProductService,
  ) {
    contractService.subscribeToEvents("ProductCreated", (event: any) => {
      contractService.eventToArgs(event).then((args) => {
        productService.syncProducts([args]).then((r) => console.log(r));
      });
    });

    productService.getProducts().then((products) => {
      products.forEach((product) => {
        contractService.subscribeToProductEvents(
          product.address,
          ["Deposit", "WithdrawPrincipal", "FundAccept", "FundLock", "Issuance", "Mature", "Unpaused", "Paused"],
          (eventName, event) => {
            if (eventName === "Paused" || eventName === "Unpaused") {
              productService.updateProductPauseStatus(product.address, eventName === "Paused").then((r) => console.log(r));
            } else {
              contractService.getProductStats(product.address).then((stats) => {
                productService.updateProduct(product.address, stats).then((r) => console.log(r));
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
    const pastEvents = await this.contractService.getPastEvents("ProductCreated", block - 1, block + 1);
    await this.productService.syncProducts(pastEvents);
  }
}
