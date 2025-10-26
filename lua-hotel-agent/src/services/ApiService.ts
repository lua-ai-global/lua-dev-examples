import axios from "axios";

export default class ApiService {
    baseUrl: string;
    timeout: number;
    
    constructor() {
        this.baseUrl = "https://httpbin.org";
        this.timeout = 5000;
    }

    async fetchUserData(userId: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/get`, {
                params: { userId },
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Lua-Skill/1.0'
                }
            });
            
            return {
                id: userId,
                name: response.data.args.userId || 'Unknown',
                url: response.data.url,
                status: 'success',
                timestamp: new Date().toISOString()
            };
        } catch (error: any) {
            return {
                id: userId,
                name: 'Unknown',
                url: null,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async createPost(title: string, content: string) {
        try {
            const response = await axios.post(`${this.baseUrl}/post`, {
                title,
                content,
                publishedAt: new Date().toISOString()
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            return {
                id: response.data.json.title || 'generated-id',
                title: response.data.json.title,
                status: 'created',
                url: response.data.url
            };
        } catch (error: any) {
            return {
                id: null,
                title,
                status: 'error',
                error: error.message,
                url: null
            };
        }
    }
}