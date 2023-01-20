import { Inject, Injectable } from "@tsed/di";
import { User, UserRepository } from "../../../dal";

@Injectable()
export class UserService {
  @Inject(UserRepository)
  private readonly userRepository: UserRepository;

  create(firstName: string, lastName: string): Promise<User> {
    const entity = new User();
    entity.firstName = firstName;
    entity.lastName = lastName;
    return this.userRepository.save(entity);
  }
}
