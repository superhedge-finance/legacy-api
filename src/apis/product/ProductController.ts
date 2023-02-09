import { Controller, Inject } from "@tsed/di";
import { Get, Post, Returns } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "./services/ProductService";
import { CreatedProductDto } from "./dto/CreatedProductDto";
import { CronService } from "../../services/CronService";

@Controller("/products")
export class ProductController {
  @Inject()
  private readonly productService: ProductService;

  @Inject()
  private readonly cronService: CronService;

  @Inject()
  private readonly contractService: ContractService;

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

  @Get("/sync-products/:block")
  async syncProducts(@PathParams("block") block: number): Promise<void> {
    const pastEvents = await this.contractService.getPastEvents("ProductCreated", block - 10, block + 10);
    await this.productService.syncProducts(pastEvents);
  }

  @Post("/request-withdraw")
  async requestWithdraw(@BodyParams("address") address: string, @BodyParams("product") product: string): Promise<void> {
    const currentTokenId = await this.contractService.validateWithdrawRequest(address, product);
    return this.productService.requestWithdraw(address, product, currentTokenId);
  }

  @Post("/cancel-withdraw")
  async cancelWithdraw(@BodyParams("address") address: string, @BodyParams("product") product: string): Promise<void> {
    return this.productService.cancelWithdraw(address, product);
  }
}
