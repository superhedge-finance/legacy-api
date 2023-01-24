import { Inject, Injectable } from "@tsed/di";
import { Product, ProductRepository } from "../../../dal";
import {BigNumber} from "ethers";
import {CreatedProductDto} from "../dto/CreatedProductDto";
import {CycleDto} from "../dto/CycleDto";

@Injectable()
export class ProductService {
  @Inject(ProductRepository)
  private readonly productRepository: ProductRepository;

  create(address: string, name: string, underlying: string, maxCapacity: BigNumber, status: number, currentCapacity: string, cycle: CycleDto): Promise<Product> {
    const entity = new Product();
    entity.address = address;
    entity.name = name;
    entity.underlying = underlying;
    entity.maxCapacity = maxCapacity.toString();
    entity.status = status;
    entity.currentCapacity = currentCapacity;
    entity.issuanceCycle = cycle;
    return this.productRepository.save(entity);
  }

  getProducts(): Promise<Array<Product>> {
    return this.productRepository.find({
      where: {
        status: 1
      }
    });
  }

  getProduct(address: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: {
        address: address
      }
    });
  }

  async syncProducts(pastEvents: CreatedProductDto[]): Promise<void> {
    await Promise.all(pastEvents.map(async (product: any) => {
      const existProduct = await this.getProduct(product.product);
      if (!existProduct) {
        return this.create(product.product, product.name, product.underlying, product.maxCapacity, product.status, product.currentCapacity, product.cycle);
      } else {
        return this.productRepository.update({ address: product.product }, {
          name: product.name,
          underlying: product.underlying,
          maxCapacity: product.maxCapacity,
          status: product.status,
          currentCapacity: product.currentCapacity,
          issuanceCycle: product.cycle,
        })
      }
    }))
  }
}
