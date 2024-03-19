import axios from 'axios';
import { Client } from '@elastic/elasticsearch';


export class bingfetch {
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
        console.log("hello from bing fetch");
    }

    async startService() {
        this.getNews();
        setInterval(async () => {
            console.log("fetching news");
            this.getNews();
        }, 1 * 1000 *60 * 60);
    }

    async getNews() {
        try {
            const response = await axios.get(
                "https://api.bing.microsoft.com/v7.0/news/search?q=tesla",
                {
                    headers: {
                        "Ocp-Apim-Subscription-Key": process.env.BING_NEWS_API_KEY,
                    },
                }
            );
            const news = response.data.value;
            await this.saveNewsToElasticsearch(news);

        } catch (error: any) {
            console.error("Error fetching news:", error.message);
        }
    }

        async saveNewsToElasticsearch(news: any[]) {
            var body = news.flatMap((doc) => [
                { update: { _index: "news", _id: doc.url+doc.datePublished } },
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
}
