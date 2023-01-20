import { PlatformTest } from "@tsed/common";
import SuperTest from "supertest";
import { Server } from "./Server";

describe("Server", () => {
  let request: SuperTest.SuperTest<SuperTest.Test>;

  beforeEach(PlatformTest.bootstrap(Server));
  beforeEach(() => {
    request = SuperTest(PlatformTest.callback());
  });

  afterEach(PlatformTest.reset);

  it("should call GET /api", async () => {
    const response = await request.get("/api").expect(404);

    expect(response.body).toEqual({
      errors: [],
      message: 'Resource "/api" not found',
      name: "NOT_FOUND",
      status: 404,
    });
  });
});
