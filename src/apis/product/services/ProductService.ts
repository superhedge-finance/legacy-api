import { Inject, Injectable } from "@tsed/di";
import { Not, UpdateResult } from "typeorm";
import { BigNumber, ethers, FixedNumber } from "ethers";
import { History, Product, ProductRepository, WithdrawRequest, WithdrawRequestRepository } from "../../../dal";
import { CreatedProductDto } from "../dto/CreatedProductDto";
import { ProductDetailDto } from "../dto/ProductDetailDto";
import { CycleDto } from "../dto/CycleDto";
import { StatsDto } from "../dto/StatsDto";
import { HistoryRepository } from "../../../dal/repository/HistoryRepository";
import { HISTORY_TYPE, WITHDRAW_TYPE } from "../../../shared/enum";
import { DECIMAL } from "../../../shared/constants";

const express = require("express")
// Import Moralis
const Moralis = require("moralis").default
// Import the EvmChain dataType
const { EvmChain } = require("@moralisweb3/common-evm-utils")

const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Ijc2ZDhlYTQ1LWJmNTctNDFkYS04YjkxLTg4NjcxNWMzNDM3MiIsIm9yZ0lkIjoiMzk5NjgwIiwidXNlcklkIjoiNDEwNjg3IiwidHlwZUlkIjoiNjk0NzRhOGYtM2Q1OC00ZGU3LTk2ZWItZWQ0NTAwYjJiM2IwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MjA2NjIyMzUsImV4cCI6NDg3NjQyMjIzNX0.ADggUZYihL3LZOzcg-VN9saKl-Y6gEUuZN4uU09rafQ"
const address = "0x457E474891f8e8248f906cd24c3ddC2AD7fc689a"
const chain = EvmChain.ETHEREUM

Moralis.start({
  apiKey: MORALIS_API_KEY,
})

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

  async getProduct(chainId: number, address: string): Promise<ProductDetailDto | null> {
    const product = await this.productRepository.findOne({
      where: {
        address: address,
        chainId: chainId,
        // status: Not(0),
        isPaused: false,
      },
    });

    if (!product) return null;

    const depositList = await this.historyRepository.find({
      where: {
        productId: product.id,
        type: HISTORY_TYPE.DEPOSIT
      },
      order: {
        created_at: 'DESC'
      }
    });

    const depositActivity = depositList.map((history) => {
      return {
        date: history.created_at,
        amount: history.amountInDecimal,
        lots: history.amountInDecimal / 1000,
        txhash: history.transactionHash
      }
    });

    return {
      id: product.id,
      address: product.address,
      name: product.name,
      underlying: product.underlying,
      maxCapacity: product.maxCapacity,
      currentCapacity: product.currentCapacity,
      status: product.status,
      issuanceCycle: product.issuanceCycle,
      chainId: product.chainId,
      vaultStrategy: product.vaultStrategy,
      risk: product.risk,
      fees: product.fees,
      counterparties: product.counterparties,
      estimatedApy: product.estimatedApy,
      mtmPrice: product.mtmPrice,
      deposits: depositActivity
    }
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
    chainId: number,
    productId: number,
    type: HISTORY_TYPE,
    pastEvents: any[],
    withdrawType: WITHDRAW_TYPE = WITHDRAW_TYPE.NONE,
  ): Promise<void> {
    for (const event of pastEvents) {
      try {
        const exist = await this.historyRepository.findOne(
          { where: { transactionHash: event.transactionHash, logIndex: event.logIndex } 
        });
        if (exist) continue;

        const lastEntity = await this.historyRepository.findOne(
          { where: { chainId: chainId, address: event.args._user }, order: { created_at: 'DESC' }}
        );
        let totalBalance = FixedNumber.from(0);
        if (lastEntity) totalBalance = FixedNumber.from(lastEntity.totalBalance);

        const entity = new History();
        if (type === HISTORY_TYPE.DEPOSIT || type === HISTORY_TYPE.WEEKLY_COUPON) {
          entity.tokenId = event.args._tokenId.toString();
          entity.supply = event.args._supply.toString();
          entity.supplyInDecimal = event.args._supply.toNumber();
        }
        entity.address = event.args._user;
        entity.type = type;
        entity.withdrawType = withdrawType;
        entity.productId = productId;
        entity.amount = event.args._amount.toString();
        entity.amountInDecimal = Number(ethers.utils.formatUnits(event.args._amount, DECIMAL[chainId]));

        if (type == HISTORY_TYPE.WITHDRAW) {
          entity.totalBalance = (totalBalance.subUnsafe(FixedNumber.from(entity.amountInDecimal))).toString();
        } else {
          entity.totalBalance = (totalBalance.addUnsafe(FixedNumber.from(entity.amountInDecimal))).toString();
        }
        entity.transactionHash = event.transactionHash;
        entity.logIndex = event.logIndex;
        await this.historyRepository.save(entity);
      } catch (e){
      }
    }
  }

  async updateProductName(chainId: number, address: string, name: string): Promise<UpdateResult> {
    return this.productRepository.update(
      { chainId, address },
      { name: name}
    );
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

  async getHolderList(tokenAddress: string): Promise<{balanceToken: number[], ownerAddress: string[]}> {
    const response = await Moralis.EvmApi.token.getTokenOwners({
      "chain": "0xa4b1",
      "order": "ASC",
      "tokenAddress": tokenAddress
    })
    // const balanceToken = response?.result?.map((item: any) => item?.balance)
    // const ownerAddress = response?.result?.map((item: any) => item?.ownerAddress)
    const balanceToken = response.result?.map((item: any) => item?.balance) ?? [];
    const ownerAddress = response.result?.map((item: any) => item?.ownerAddress) ?? [];
    console.log(balanceToken)
    console.log(ownerAddress)
    return { balanceToken, ownerAddress }
  }

  // async getHolderList(tokenAddress: string): Promise<{ holders: { balance: number; ownerAddress: string }[] }> {
  //   const response = await Moralis.EvmApi.token.getTokenOwners({
  //     "chain": "0xa4b1",
  //     "order": "ASC",
  //     "tokenAddress": tokenAddress
  //   });
  
  //   const holders = response.result?.map((item: any) => ({
  //     balance: item?.balance,
  //     ownerAddress: item?.ownerAddress
  //   })) ?? [];
  
  //   return { holders };
  // }
}
