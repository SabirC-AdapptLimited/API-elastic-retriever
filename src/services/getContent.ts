import { Client } from "@elastic/elasticsearch";
import axios from "axios";
import { ContentFetchDTO } from "../models/content";
import { readFileSync, accessSync } from "fs";
import { v4 } from "uuid";
import checkFileExists from "../helpers/checkFileExists";

export class content {
  private client: Client;

  constructor({
    elasticURL,
    username,
    password,
  }: {
    elasticURL: string;
    username: string;
    password: string;
  }) {
    const auth = username && password ? `${username}:${password}` : undefined;
    const node = elasticURL;

    if (!node || !auth) {
      console.error("Please config your environment variables");
      throw new Error("Please config your environment variables");
    }

    const certExists = checkFileExists("./ca.crt");

    if (!certExists) {
      console.log(
        "Elastic certificate does not exist, setting rejectUnauthorized to false"
      );
    }

    const tls = certExists
      ? { ca: readFileSync("./ca.crt") }
      : { rejectUnauthorized: false };

    this.client = new Client({
      node,
      auth: auth
        ? {
            username: username,
            password: password,
          }
        : undefined,
      tls,
    });
  }

  async getContent(departments: string) {
    try {
      const offset = new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate() - 1
        )
      );
      const timeSinceEpoch: string = offset.getTime().toString();

      const response = await axios.get<ContentFetchDTO>(
        process.env.CONTENT_ENDPOINT || "",
        {
          headers: {
            Token: process.env.CONTENT_TOKEN,
            SinceDate: timeSinceEpoch,
            Departments: departments,
          },
        }
      );
      const content = response.data;

      await this.saveContentToElasticsearch(content);
    } catch (error) {
      console.error("\nError fetching content @ getContent:\n", error);
      if (!process.env.CONTENT_TOKEN) {
        console.log(
          "\nCheck that you have configured your CONTENT_TOKEN env\n"
        );
      }
      throw new Error();
    }
  }

  async saveContentToElasticsearch(content: ContentFetchDTO) {
    const uuid = v4();
    try {
      const elasticSave = await this.client.index({
        id: uuid,
        index: "content",
        refresh: true,
        document: { content },
      });
      const success = await this.client.exists({ index: "content", id: uuid });

      if (!success) {
        throw new Error(
          "Error saving content to Elasticsearch @ await this.client.bulk({ body }); elasticSave.errors"
        );
      } else {
        console.log("Content saved to Elasticsearch");
      }
    } catch (error) {
      console.error(
        "\nError saving content to Elasticsearch @ saveContentToElasticsearch():\n",
        error
      );
      throw new Error();
    }
  }
}
