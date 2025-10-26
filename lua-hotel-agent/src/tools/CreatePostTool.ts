import { LuaTool } from "lua-cli/skill";
import { z } from "zod";
import ApiService from "../services/ApiService";


export default class CreatePostTool implements LuaTool {
    name = "create_post";
    description = "Create a new post";
    inputSchema = z.object({ 
        title: z.string(), 
        content: z.string() 
    });
    outputSchema = z.object({ 
        id: z.string().nullable(), 
        title: z.string(), 
        status: z.string(), 
        error: z.string().optional(), 
        url: z.string().nullable() 
    });
    
    apiService: ApiService;
    
    constructor() {
        this.apiService = new ApiService();
    }
    
    async execute(input: z.infer<typeof this.inputSchema>) {
        return this.apiService.createPost(input.title, input.content);
    }
}