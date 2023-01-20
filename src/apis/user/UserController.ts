import { Controller, Inject } from "@tsed/di";
import { Post, Returns } from "@tsed/schema";
import { BodyParams } from "@tsed/platform-params";
import { UserService } from "./services/UserService";
import { CreateUserDto } from "./dto/CreateUserDto";
import { CreatedUserDto } from "./dto/CreatedUserDto";

@Controller("/users")
export class UserController {
  @Inject()
  private readonly userService: UserService;

  @Post("")
  @Returns(200, CreatedUserDto).Description("Inserted Id")
  async create(@BodyParams() body: CreateUserDto): Promise<CreatedUserDto> {
    const user = await this.userService.create(body.firstName, body.lastName);
    return { id: user.id };
  }
}
