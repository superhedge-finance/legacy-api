import { Inject, Injectable } from "@tsed/di";
import { In } from "typeorm";
import { Product, ProductRepository, User, UserRepository, HistoryRepository } from "../../../dal";
import { CreateUserDto } from "../dto/CreateUserDto";
import { HistoryResponseDto } from "../dto/HistoryResponseDto";

@Injectable()
export class UserService {
  @Inject(UserRepository)
  private readonly userRepository: UserRepository;

  @Inject(ProductRepository)
  private readonly productRepository: ProductRepository;

  @Inject(HistoryRepository)
  private readonly historyRepository: HistoryRepository;

  async create(request: CreateUserDto): Promise<User> {
    const entity = new User();
    entity.address = request.address;
    entity.userName = request.username;
    entity.email = request.email;
    entity.subscribed = request.subscribed;
    return this.userRepository.save(entity);
  }

  async get(address: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { address } });
  }

  async getPositions(chainId: number, address: string): Promise<Array<Product>> {
    const user = await this.userRepository.findOne({ where: { address } });
    if (!user) {
      await this.create({ address, username: "", email: "", subscribed: false });
      return [];
    }
    return this.productRepository.find({
      where: {
        id: In(user.productIds),
        chainId: chainId,
      },
    });
  }

  async getHistories(chainId: number, address: string, sort: number): Promise<Array<HistoryResponseDto>> {
    const histories = await this.historyRepository
      .createQueryBuilder("history")
      .leftJoinAndMapOne("history.product", Product, "product", "product.id = history.product_id")
      .where("history.address = :address", { address })
      .andWhere("history.chain_id = :chainId", { chainId })
      .orderBy("history.created_at", sort === 1 ? "ASC" : "DESC")
      .getMany();
    return histories.map((history) => {
      return {
        address: history.address,
        type: history.type,
        withdrawType: history.withdrawType,
        productName: history.product.name,
        amountInDecimal: history.amountInDecimal,
        transactionHash: history.transactionHash,
        createdAt: history.created_at,
      };
    });
  }
}
