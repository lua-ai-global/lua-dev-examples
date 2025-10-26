import { LuaTool, User } from "lua-cli";
import { z } from "zod";


export class GetUserDataTool implements LuaTool {
    name = "get_user_data";
    description = "Get the user data for a given user id";
    inputSchema = z.object({ });

    constructor() {}

    async execute(input: z.infer<typeof this.inputSchema>) {
        return User.get();
    }
}

export class UpdateUserDataTool implements LuaTool {
    name = "update_user_data";
    description = "Update the user data for a given user id";
    inputSchema = z.object({ 
        data: z.object({
            name: z.string().optional(),
            age: z.number().optional()
        })
    });

    constructor() {}

    async execute(input: z.infer<typeof this.inputSchema>) {
        const user = await User.get(); //get instance of user
        return await user.update(input.data);
    }
}