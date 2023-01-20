import { PlatformTest } from "@tsed/common";
import { UserService } from "./UserService";

describe("UserService", () => {
  beforeEach(PlatformTest.create);
  afterEach(PlatformTest.reset);

  it("should do something", () => {
    const instance = PlatformTest.get<UserService>(UserService);

    expect(instance).toBeInstanceOf(UserService);
  });
});
