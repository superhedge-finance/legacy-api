import { Injectable } from "@tsed/di";
import { Contract, ethers } from "ethers";
import axios from "axios";
import { CreatedProductDto, StatsDto } from "../apis";
import FACTORY_ABI from "./abis/SHFactory.json";
import PRODUCT_ABI from "./abis/SHProduct.json";
import MARKETPLACE_ABI from "./abis/SHMarketplace.json";

@Injectable()
export class ContractService {
  private readonly factoryContract: Contract;
  private readonly marketplaceContract: Contract;
  private readonly provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider("https://goerli.blockpi.network/v1/rpc/public");
    this.factoryContract = new ethers.Contract(process.env.FACTORY_CONTRACT_ADDRESS as string, FACTORY_ABI, this.provider);
    this.marketplaceContract = new ethers.Contract(process.env.MARKETPLACE_CONTRACT_ADDRESS as string, MARKETPLACE_ABI, this.provider);
  }

  subscribeToEvents(eventName: string, callback: (event: any) => void) {
    this.factoryContract.on(eventName, (...event) => {
      callback(event);
    });
  }

  subscribeToProductEvents(productAddress: string, eventNames: string[], callback: (eventName: string, event: any) => void) {
    const productContract = new ethers.Contract(productAddress, PRODUCT_ABI, this.provider);
    for (const eventName of eventNames) {
      productContract.on(eventName, (...event) => {
        callback(eventName, event[event.length - 1]);
      });
    }
  }

  subscribeToMarketplaceEvents(eventNames: string[], callback: (eventName: string, event: any) => void) {
    const marketplaceContract = new ethers.Contract(process.env.MARKETPLACE_CONTRACT_ADDRESS as string, MARKETPLACE_ABI, this.provider);
    for (const eventName of eventNames) {
      marketplaceContract.on(eventName, (...event) => {
        callback(eventName, event[event.length - 1]);
      });
    }
  }

  async eventToArgs(event: any): Promise<CreatedProductDto> {
    const stats = await this.getProductStats(String(event.args?.product));

    return {
      ...event.args,
      address: event.args.product,
      maxCapacity: event.args.maxCapacity.toString(),
      issuanceCycle: stats.cycle,
      ...stats,
    };
  }

  async getProductStats(address: string): Promise<StatsDto> {
    const productInstance = new ethers.Contract(address, PRODUCT_ABI, this.provider);
    const _status = await productInstance.status();
    const _currentCapacity = await productInstance.currentCapacity();
    const _issuanceCycle = await productInstance.issuanceCycle();
    const _paused = await productInstance.paused();

    let image_uri = "";
    try {
      const { data } = await axios.get(_issuanceCycle.uri);
      image_uri = data.image;
    } catch (e) {}

    return {
      status: _status,
      currentCapacity: _currentCapacity.toString(),
      paused: _paused,
      cycle: {
        coupon: _issuanceCycle.coupon.toNumber(),
        strikePrice1: _issuanceCycle.strikePrice1.toNumber(),
        strikePrice2: _issuanceCycle.strikePrice2.toNumber(),
        strikePrice3: _issuanceCycle.strikePrice3.toNumber(),
        strikePrice4: _issuanceCycle.strikePrice4.toNumber(),
        tr1: _issuanceCycle.tr1.toNumber(),
        tr2: _issuanceCycle.tr2.toNumber(),
        issuanceDate: _issuanceCycle.issuanceDate.toNumber(),
        maturityDate: _issuanceCycle.maturityDate.toNumber(),
        apy: _issuanceCycle.apy,
        url: _issuanceCycle.uri,
        image_uri: image_uri,
      },
    };
  }

  async getPastEvents(eventName: string, fromBlock: number, toBlock: number): Promise<Array<CreatedProductDto>> {
    const events = await this.factoryContract.queryFilter(this.factoryContract.filters[eventName](), fromBlock, toBlock);

    const parsedEvents: CreatedProductDto[] = [];
    for (const event of events) {
      const parsed = await this.eventToArgs(event);
      parsedEvents.push(parsed);
    }

    return parsedEvents;
  }

  async getMarketplacePastEvents(eventName: string, fromBlock: number, toBlock: number) {
    return await this.marketplaceContract.queryFilter(this.marketplaceContract.filters[eventName](), fromBlock, toBlock);
  }

  async getProductPastEvents(address: string, eventName: string, fromBlock: number, toBlock: number): Promise<any> {
    const productInstance = new ethers.Contract(address, PRODUCT_ABI, this.provider);
    return await productInstance.queryFilter(productInstance.filters[eventName](), fromBlock, toBlock);
  }

  async validateWithdrawRequest(address: string, product: string): Promise<string> {
    const productInstance = new ethers.Contract(product, PRODUCT_ABI, this.provider);
    return await productInstance.currentTokenId().toString();
  }

  async getLatestBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }
}
