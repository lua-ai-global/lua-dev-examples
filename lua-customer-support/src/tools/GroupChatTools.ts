import { LuaTool, Lua, Channels } from "lua-cli";
import { z } from "zod";

// Hands a request to a colleague in the same Microsoft Teams group chat.
// Lua.request.conversation is set on a group turn (a Teams group chat or a
// desktop room) and lists everyone in it, current speaker first; it is
// undefined in a one-to-one chat, so the tool refuses there.
export class HandOffToColleagueTool implements LuaTool {
  name = "hand_off_to_colleague";
  description =
    "In a group chat, ask a named colleague to take over the current request";

  inputSchema = z.object({
    colleagueName: z.string().describe("First or last name as it appears in the chat"),
    summary: z.string().describe("One line on what the colleague should pick up"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const conversation = Lua.request.conversation;
    if (!conversation) {
      return { handedOff: false, reason: "This only works in a group chat" };
    }

    const wanted = input.colleagueName.trim().toLowerCase();
    const colleague = conversation.participants.find(
      (person) => !person.isCurrentSpeaker && person.displayName.toLowerCase().includes(wanted)
    );
    if (!colleague) {
      return {
        handedOff: false,
        reason: `Nobody called ${input.colleagueName} is in this chat`,
        peopleHere: conversation.participants.map((person) => person.displayName),
      };
    }

    const speaker = conversation.participants.find((person) => person.isCurrentSpeaker);
    // On Teams the conversation id is what Channels.send takes to write to the whole chat.
    if (conversation.channel === "teams" && conversation.externalId) {
      await Channels.send({
        channel: "teams",
        to: { conversationId: conversation.externalId },
        text: `${colleague.displayName}, ${speaker?.displayName ?? "a colleague"} asked you to take this over: ${input.summary}`,
      });
    }

    return {
      handedOff: true,
      to: { userId: colleague.userId, name: colleague.displayName, email: colleague.channelIdentity?.email },
    };
  }
}
