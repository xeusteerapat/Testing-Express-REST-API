import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import { createProduct } from "../service/product.service";
import { signJwt } from "../utils/jwt.utils";
import createServer from "../utils/server";

const app = createServer();

const userId = new mongoose.Types.ObjectId().toString();

const createProductPayload = {
  user: userId,
  title: "Nudie Thin Finn Dry Selvage Comfort",
  description:
    "Selvage jeans with a slim fit and a slightly tapered leg. The selvage denim is made by Kurabo Mills in Japan and will develop a uniquely worn-in look with wear and washing.",
  price: 280,
  image:
    "https://cdn.nudiejeans.com/img/Thin-Finn-Dry-Selvage-Comfort-111868-01-flatshot_fIBesut_2400x2400.jpg",
};

const userPayload = {
  _id: userId,
  email: "timdoe@mail.com",
  name: "Tim Doe",
};

describe("product", () => {
  beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  describe("get product route", () => {
    describe("given the product does not exist", () => {
      it("should return status code: 404", async () => {
        const productId = "product-123";

        await supertest(app).get(`/api/products/${productId}`).expect(404);
      });
    });

    describe("given the product does exist", () => {
      it("should return product with status code: 200", async () => {
        const product = await createProduct(createProductPayload);

        const { body, statusCode } = await supertest(app)
          .get(`/api/products/${product.productId}`)
          .expect(200);

        expect(statusCode).toBe(200);
        expect(body.productId).toBe(product.productId);
      });
    });
  });

  describe("create product route", () => {
    describe("given the user is not logged in", () => {
      it("shoule return a 403", async () => {
        const { statusCode } = await supertest(app).post(`/api/products`);

        expect(statusCode).toBe(403);
      });
    });

    describe("given the user is logged in", () => {
      it("shoule return a 200 and create the product", async () => {
        const jwt = signJwt(userPayload);

        const { body, statusCode } = await supertest(app)
          .post("/api/products")
          .set("Authorization", `Bearer ${jwt}`)
          .send(createProductPayload);

        expect(statusCode).toBe(200);

        expect(body).toEqual({
          __v: 0,
          _id: expect.any(String),
          createdAt: expect.any(String),
          description:
            "Selvage jeans with a slim fit and a slightly tapered leg. The selvage denim is made by Kurabo Mills in Japan and will develop a uniquely worn-in look with wear and washing.",
          image:
            "https://cdn.nudiejeans.com/img/Thin-Finn-Dry-Selvage-Comfort-111868-01-flatshot_fIBesut_2400x2400.jpg",
          price: 280,
          productId: expect.any(String),
          title: "Nudie Thin Finn Dry Selvage Comfort",
          updatedAt: expect.any(String),
          user: expect.any(String),
        });
      });
    });
  });
});
