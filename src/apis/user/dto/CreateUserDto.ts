import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class CreateUserDto {
  @Property()
  @Required()
  // @MinLength(3)
  // @MaxLength(20)
  address: string;

  @Property()
  @Required()
  // @MinLength(3)
  // @MaxLength(20)
  username: string;

  @Property()
  @Required()
  // @MinLength(3)
  // @MaxLength(20)
  email: string;

  @Property()
  subscribed: boolean;
}
