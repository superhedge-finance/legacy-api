import { Injectable } from "@tsed/di";
import { Contract, ethers } from "ethers";
import { CreatedProductDto, StatsDto } from "../apis";
import FACTORY_ABI from "./abis/SHFactory.json";
import PRODUCT_ABI from "./abis/SHProduct.json";

@Injectable()
export class ContractService {
  private readonly factoryContract: Contract;
  private readonly provider: ethers.providers.JsonRpcProvider;
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli");
    this.factoryContract = new ethers.Contract(process.env.FACTORY_CONTRACT_ADDRESS as string, FACTORY_ABI, this.provider);
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
        console.log(eventName, event);
        callback(eventName, event);
      });
    }
  }

  async eventToArgs(event: any): Promise<CreatedProductDto> {
    const stats = await this.getProductStats(String(event.args?.product));

    return {
      ...event.args,
      ...stats,
    };
  }

  async getProductStats(address: string): Promise<StatsDto> {
    const productInstance = new ethers.Contract(address, PRODUCT_ABI, this.provider);
    const _status = await productInstance.status();
    const _currentCapacity = await productInstance.currentCapacity();
    const _issuanceCycle = await productInstance.issuanceCycle();
    const _paused = await productInstance.paused();

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
        url: _issuanceCycle.uri,
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

  async validateWithdrawRequest(address: string, product: string): Promise<string> {
    const productInstance = new ethers.Contract(product, PRODUCT_ABI, this.provider);
    return await productInstance.currentTokenId().toString();
  }

  async getLatestBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }
}
