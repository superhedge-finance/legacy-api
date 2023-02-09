import { Repository } from "typeorm";
import { User } from "../entity";

export class UserRepository extends Repository<User> {
  saveProductId = async (address: string, productId: number) => {
    const user = await this.findOne({ where: { address } });
    if (user) {
      if (!user.productIds.find((id) => id === productId)) {
        user.productIds.push(productId);
        return this.save(user);
      }
    } else {
      const entity = new User();
      entity.address = address;
      entity.productIds = [productId];
      return this.save(entity);
    }
  };
}
