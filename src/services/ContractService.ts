import { Injectable } from "@tsed/di";
import { Contract, ethers } from "ethers";
import FACTORY_ABI from "./abis/SHFactory.json";
import PRODUCT_ABI from "./abis/SHProduct.json";
import {CreatedProductDto} from "../apis";

@Injectable()
export class ContractService {
  private factoryContract: Contract;
  private readonly provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli");
    this.factoryContract = new ethers.Contract(process.env.FACTORY_CONTRACT_ADDRESS as string, FACTORY_ABI, this.provider);
    this.getPastEvents = this.getPastEvents.bind(this);
  }

  subscribeToEvents(eventName: string, callback: (event: any) => void) {
    this.factoryContract.on(eventName, callback);
  }

  async getPastEvents(eventName: string, fromBlock: number, toBlock: number): Promise<Array<CreatedProductDto>> {
    const events = await this.factoryContract.queryFilter(this.factoryContract.filters[eventName](), fromBlock, toBlock);

    const parsedEvents: any[] = [];
    for (const event of events) {
      const productInstance = new ethers.Contract(String(event.args?.product), PRODUCT_ABI, this.provider);
      const _status = await productInstance.status()
      const _currentCapacity = await productInstance.currentCapacity()
      const _issuanceCycle = await productInstance.issuanceCycle()

      parsedEvents.push({
          ...event.args,
        status: _status,
        currentCapacity: _currentCapacity.toString(),
        cycle: {
          coupon: _issuanceCycle.coupon.toNumber(),
          strikePrice1: _issuanceCycle.strikePrice1.toNumber(),
          strikePrice2: _issuanceCycle.strikePrice2.toNumber(),
          strikePrice3: _issuanceCycle.strikePrice3.toNumber(),
          strikePrice4: _issuanceCycle.strikePrice4.toNumber(),
          url: _issuanceCycle.uri,
        }
      });
    }

    return parsedEvents;
  }
}
