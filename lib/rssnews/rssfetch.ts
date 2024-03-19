import Parser from 'rss-parser';
import { Client } from '@elastic/elasticsearch';
import { db } from "../../lib/db";
import { JsonObject } from 'type-fest';

type RSSLink = { id: string, link: string };

export class rssfetch {
    private client: Client;

    constructor() {
        const elasticURL = process.env.ELASTIC_URL || '';
        const username = process.env.ELASTIC_USERNAME || '';
        const password = process.env.ELASTIC_PASSWORD || '';
        const auth = username && password ? `${username}:${password}` : undefined;
        const node = elasticURL;

        this.client = new Client({
            node,
            auth: auth ? {
                username: username,
                password: password,
            } : undefined
        }
        );
    }

    async sayhello() {
        console.log("hello from rss fetch");
    }

    async startService() {
        this.getRSS();
        setInterval(async () => {
            console.log("fetching news");
            this.getRSS();
        }, 1 * 1000 * 60 * 60);
    }

    async getRSS() {
        let rssLinks: RSSLink[] = await this.getRSSWidgets()
        for (var rssLink of rssLinks) {
            try {
                const parser = new Parser();
                const feed = await parser.parseURL(rssLink.link);
                feed.items.forEach(item => {
                    item.groupId = rssLink.id;
                    console.log(item.title + ':' + item.link) // item will have a `bar` property type as a number
                });
                const news = feed.items;
                await this.saveNewsToElasticsearch(news);

            } catch (error: any) {
                console.error("Error fetching news:", error.message);
            }
        }
    }

    async saveNewsToElasticsearch(news: any[]) {
        var body = news.flatMap((doc) => [
            { update: { _index: "rssnews", _id: doc.id + doc.pubDate } },
            { doc: doc, doc_as_upsert: true },
        ]);
        //     body = body.filter((doc) => doc.name != null);
        try {
            const bulkResponse = await this.client.bulk({ body });
            if (bulkResponse.errors) {
                console.error(
                    "Error saving news to Elasticsearch:",
                    bulkResponse.errors
                );
            } else {
                console.log("News saved to Elasticsearch");
            }
        } catch (error: any) {
            console.error("Error saving news to Elasticsearch:", error.message);
        }

    }

    async getRSSWidgets() {
        const groups = await db.group.findMany({
            where: { type: 'RSS' },
            select: { id: true, config: true }
        });
        var configs: RSSLink[] = [];
        groups.forEach(group => {
            if (group.config !== null) {
                try {
                    var config = group.config as JsonObject;
                    if (config.rss !== null) {
                        for (var link of config.rss as string[]) {
                            configs.push({ id: group.id, link: link });
                        }
                    }
                } catch (error: any) {
                    console.error("Error parsing RSS config:", error.message);
                }
            }
        });
        return configs;
    }
}
