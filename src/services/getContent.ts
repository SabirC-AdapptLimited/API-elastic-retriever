import { Client } from "@elastic/elasticsearch";
import axios from "axios";
import { ContentFetchDTO } from "../models/content";

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

    this.client = new Client({
      node,
      auth: auth
        ? {
            username: username,
            password: password,
          }
        : undefined,
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
            "Ocp-Apim-Subscription-Key": process.env.BING_NEWS_API_KEY,
            Token: process.env.CONTENT_TOKEN,
            SinceDate: timeSinceEpoch,
            Departments: departments,
          },
        }
      );
      const content = response.data;
      await this.saveContentToElasticsearch(content);
    } catch (error) {
      console.error("Error fetching content @ getContent:", error);
      throw new Error();
    }
  }

  async saveContentToElasticsearch(content: ContentFetchDTO) {
    return; ////////////////////////////////////////////////////////////////// remove
    try {
      const elasticSave = await this.client.bulk({ body: content as any });
      if (elasticSave.errors) {
        throw new Error(
          "Error saving content to Elasticsearch @ await this.client.bulk({ body }); elasticSave.errors: " +
            elasticSave.errors
        );
      } else {
        console.log("Content saved to Elasticsearch");
      }
    } catch (error) {
      console.error(
        "Error saving content to Elasticsearch @ saveContentToElasticsearch():",
        error
      );
      throw new Error();
    }
  }
}
