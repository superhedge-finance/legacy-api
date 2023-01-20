import { Controller, Inject } from "@tsed/di";
import { Get, Returns } from "@tsed/schema";
import { ContractService } from "../../services/ContractService";
import { ProductService } from "./services/ProductService";
import { CreatedProductDto } from "./dto/CreatedProductDto";
import {PathParams} from "@tsed/platform-params";

@Controller("/products")
export class ProductController {
  @Inject()
  private readonly productService: ProductService;

  @Inject()
  private readonly contractService: ContractService;

  constructor() {
    /*this.contractService.subscribeToEvents("ProductCreated", (event: any) => {
      console.log(event);
      this.productService.create(event.args.product, event.args.name, event.args.underlying, event.args.maxCapacity).then((r) => console.log(r));
    });*/
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
    const pastEvents = await this.contractService.getPastEvents("ProductCreated", block, block);
    await this.productService.syncProducts(pastEvents);
  }
}
