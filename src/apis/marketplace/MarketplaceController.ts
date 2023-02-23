import { Controller, Inject } from "@tsed/di";
import { Get, Returns } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { MarketplaceService } from "./services/MarketplaceService";
import { MarketplaceItemDto } from "./MarketplaceItemDto";
import { MarketplaceItemFullDto } from "./MarketplaceItemFullDto";
import { MarketplaceItemDetailDto } from "./MarketplaceItemDetailDto";

@Controller("/marketplace")
export class MarketplaceController {
  @Inject()
  private readonly marketplaceService: MarketplaceService;

  @Get("/")
  @Returns(200, Array<MarketplaceItemDto>)
  async getListedItems(): Promise<MarketplaceItemDto[]> {
    return await this.marketplaceService.getListedItems();
  }

  @Get("/:address")
  @Returns(200, Array<MarketplaceItemDto>)
  async getUserListedItems(@PathParams("address") address: string): Promise<MarketplaceItemDto[]> {
    return await this.marketplaceService.getUserListedItems(address);
  }

  @Get("/item/:id")
  @Returns(200, MarketplaceItemFullDto)
  async getItem(@PathParams("id") id: number): Promise<MarketplaceItemFullDto | null> {
    return this.marketplaceService.getItem(id);
  }

  @Get("/token/:token_id")
  @Returns(200, MarketplaceItemDetailDto)
  async getTokenItem(@PathParams("token_id") token_id: string): Promise<MarketplaceItemDetailDto | null> {
    return this.marketplaceService.getTokenItem(token_id);
  }
}
