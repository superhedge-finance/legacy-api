import { Controller, Inject } from "@tsed/di";
import { Get, Post, Returns } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { UserService } from "./services/UserService";
import { CreateUserDto } from "./dto/CreateUserDto";
import { CreatedUserDto } from "./dto/CreatedUserDto";
import { History, Product, User } from "../../dal";
import { HistoryResponseDto } from "./dto/HistoryResponseDto";

@Controller("/users")
export class UserController {
  @Inject()
  private readonly userService: UserService;

  @Post("")
  @Returns(200, CreatedUserDto).Description("Inserted Id")
  async create(@BodyParams() body: CreateUserDto): Promise<CreatedUserDto> {
    const user = await this.userService.create(body);
    return { id: user.id };
  }

  @Get("/:address")
  async get(@PathParams("address") address: string): Promise<User | null> {
    return await this.userService.get(address);
  }

  @Get("/positions/:address")
  @Returns(200, Array).Of(Product)
  async getPositions(@PathParams("address") address: string): Promise<Array<Product>> {
    return this.userService.getPositions(address);
  }

  @Get("/history/:address")
  @Returns(200, Array).Of(HistoryResponseDto)
  async getHistories(@PathParams("address") address: string): Promise<Array<HistoryResponseDto>> {
    return this.userService.getHistories(address);
  }
}
