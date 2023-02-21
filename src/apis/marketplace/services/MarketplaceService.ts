import { Inject, Injectable } from "@tsed/di";
import { Marketplace, MarketplaceRepository } from "../../../dal";

@Injectable()
export class MarketplaceService {
  @Inject(MarketplaceRepository)
  private readonly marketplaceRepository: MarketplaceRepository;

  async getListedItems(address: string): Promise<Marketplace[]> {
    return await this.marketplaceRepository.find({
      where: { seller: address },
    });
  }
}
