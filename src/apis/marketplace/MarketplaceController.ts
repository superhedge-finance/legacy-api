import { Controller, Inject } from "@tsed/di";
import { MarketplaceService } from "./services/MarketplaceService";

@Controller("/marketplace")
export class MarketplaceController {
  @Inject()
  private readonly marketplaceService: MarketplaceService;
}
