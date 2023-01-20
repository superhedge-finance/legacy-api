import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class CreateUserDto {
  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(20)
  firstName: string;

  @Property()
  @Required()
  @MinLength(3)
  @MaxLength(20)
  lastName: string;
}
