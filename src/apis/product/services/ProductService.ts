import { Inject, Injectable } from "@tsed/di";
import { Not, UpdateResult } from "typeorm";
import { BigNumber, ethers } from "ethers";
import { History, Product, ProductRepository, WithdrawRequest, WithdrawRequestRepository } from "../../../dal";
import { CreatedProductDto } from "../dto/CreatedProductDto";
import { CycleDto } from "../dto/CycleDto";
import { StatsDto } from "../dto/StatsDto";
import { HistoryRepository } from "../../../dal/repository/HistoryRepository";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../../shared/enum";

@Injectable()
export class ProductService {
  @Inject(ProductRepository)
  private readonly productRepository: ProductRepository;

  @Inject(HistoryRepository)
  private readonly historyRepository: HistoryRepository;

  @Inject(WithdrawRequestRepository)
  private readonly withdrawRequestRepository: WithdrawRequestRepository;

  create(
    chainId: number,
    address: string,
    name: string,
    underlying: string,
    maxCapacity: BigNumber,
    status: number,
    currentCapacity: string,
    cycle: CycleDto,
  ): Promise<Product> {
    const entity = new Product();
    entity.chainId = chainId;
    entity.address = address;
    entity.name = name;
    entity.underlying = underlying;
    entity.maxCapacity = maxCapacity.toString();
    entity.status = status;
    entity.currentCapacity = currentCapacity;
    entity.issuanceCycle = cycle;
    return this.productRepository.save(entity);
  }

  getProductsWithoutStatus(chainId: number): Promise<Array<Product>> {
    return this.productRepository.find({
      where: {
        chainId: chainId,
        isPaused: false,
      },
    });
  }

  getProducts(chainId: number): Promise<Array<Product>> {
    return this.productRepository.find({
      where: {
        status: Not(0),
        isPaused: false,
        chainId: chainId,
      },
      order: {
        created_at: "ASC",
      },
    });
  }

  getProduct(chainId: number, address: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: {
        address: address,
        chainId: chainId,
        // status: Not(0),
        isPaused: false,
      },
    });
  }

  async syncProducts(chainId: number, pastEvents: CreatedProductDto[]): Promise<void> {
    await Promise.all(
      pastEvents.map(async (product: CreatedProductDto) => {
        const existProduct = await this.getProduct(chainId, product.address);
        if (!existProduct) {
          return this.create(
            chainId,
            product.address,
            product.name,
            product.underlying,
            BigNumber.from(product.maxCapacity),
            product.status,
            product.currentCapacity,
            product.issuanceCycle,
          );
        } else {
          return this.productRepository.update(
            { address: product.address },
            {
              name: product.name,
              underlying: product.underlying,
              maxCapacity: product.maxCapacity,
              status: product.status,
              currentCapacity: product.currentCapacity.toString(),
              issuanceCycle: product.issuanceCycle,
            },
          );
        }
      }),
    );
  }

  async syncHistories(
    productId: number,
    type: HISTORY_TYPE,
    pastEvents: any[],
    withdrawType: WITHDRAW_TYPE = WITHDRAW_TYPE.NONE,
  ): Promise<void> {
    for (const event of pastEvents) {
      const entity = new History();
      if (type === HISTORY_TYPE.DEPOSIT) {
        entity.address = event.args._from;
        entity.tokenId = event.args._currentTokenId.toString();
        entity.supply = event.args._supply.toString();
        entity.supplyInDecimal = event.args._supply.toNumber();
      } else {
        entity.address = event.args._to;
      }
      entity.type = type;
      entity.withdrawType = withdrawType;
      entity.productId = productId;
      entity.amount = event.args._amount.toString();
      entity.amountInDecimal = Number(ethers.utils.formatUnits(event.args._amount, 6));
      entity.transactionHash = event.transactionHash;
      await this.historyRepository.save(entity);
    }
  }

  async updateProduct(chainId: number, address: string, stats: StatsDto): Promise<UpdateResult> {
    return this.productRepository.update(
      { chainId, address: address },
      {
        status: stats.status,
        currentCapacity: stats.currentCapacity,
        issuanceCycle: stats.cycle,
      },
    );
  }

  async updateProductPauseStatus(chainId: number, address: string, isPaused: boolean): Promise<UpdateResult> {
    return this.productRepository.update(
      { chainId, address: address },
      {
        isPaused: isPaused,
      },
    );
  }

  async requestWithdraw(address: string, productAddress: string, currentTokenId: string): Promise<void> {
    const entity = new WithdrawRequest();
    entity.address = address;
    entity.product = productAddress;
    entity.current_token_id = currentTokenId;
    await this.withdrawRequestRepository.save(entity);
  }

  async cancelWithdraw(chainId: number, address: string, productAddress: string): Promise<void> {
    const request = await this.withdrawRequestRepository.findOne({
      where: {
        address: address,
        product: productAddress,
      },
    });
    if (request) {
      await this.withdrawRequestRepository.remove(request);
    }
  }
}
