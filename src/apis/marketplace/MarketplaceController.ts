import { Controller, Inject } from "@tsed/di";
import { Get } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { MarketplaceService } from "./services/MarketplaceService";
import { Marketplace } from "../../dal";

@Controller("/marketplace")
export class MarketplaceController {
  @Inject()
  private readonly marketplaceService: MarketplaceService;

  @Get("/:address")
  async get(@PathParams("address") address: string): Promise<Marketplace[]> {
    return await this.marketplaceService.getListedItems(address);
  }
}
