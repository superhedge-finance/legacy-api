import { Controller, Inject } from "@tsed/di";
import { Get, Post, Returns } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "./services/ProductService";
import { CreatedProductDto } from "./dto/CreatedProductDto";
import { ProductDetailDto } from "./dto/ProductDetailDto";
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
  async getProducts(@QueryParams("chainId") chainId: number): Promise<Array<CreatedProductDto>> {
    return await this.productService.getProducts(chainId);
  }

  @Get("/:address")
  @Returns(200, ProductDetailDto)
  async getProduct(@PathParams("address") address: string, @QueryParams("chainId") chainId: number): Promise<ProductDetailDto | null> {
    return await this.productService.getProduct(chainId, address);
  }

  @Get("/sync-products/:block")
  async syncProducts(@PathParams("block") block: number, @QueryParams("chainId") chainId: number): Promise<void> {
    const pastEvents = await this.contractService.getPastEvents(chainId, "ProductCreated", block - 10, block + 10);
    await this.productService.syncProducts(chainId, pastEvents);
  }

  @Post("/request-withdraw")
  async requestWithdraw(
    @BodyParams("address") address: string,
    @BodyParams("product") product: string,
    @QueryParams("chainId") chainId: number,
  ): Promise<void> {
    const currentTokenId = await this.contractService.validateWithdrawRequest(chainId, address, product);
    return this.productService.requestWithdraw(address, product, currentTokenId);
  }

  @Post("/cancel-withdraw")
  async cancelWithdraw(
    @BodyParams("address") address: string,
    @BodyParams("product") product: string,
    @QueryParams("chainId") chainId: number,
  ): Promise<void> {
    return this.productService.cancelWithdraw(chainId, address, product);
  }
}
