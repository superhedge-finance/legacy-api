import { Inject, Injectable } from "@tsed/di";
import { MarketplaceRepository } from "../../../dal";

@Injectable()
export class MarketplaceService {
  @Inject(MarketplaceRepository)
  private readonly marketplaceRepository: MarketplaceRepository;
}
