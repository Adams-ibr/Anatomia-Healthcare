
import { interactionStorage } from "../server/interaction-storage";
import { supabase } from "../server/db";
import { users, members } from "../shared/schema"; // Assuming I can import table definitions if needed, or just use raw supabase

// Valid UUIDs for testing - we will try to create real users or use existing ones if possible
// To avoid polluting the DB too much, let's try to create 2 test users with unique-ish emails
const TEST_EMAIL_1 = `test_user_1_${Date.now()}@example.com`;
const TEST_EMAIL_2 = `test_user_2_${Date.now()}@example.com`;

async function testInteractionStorage() {
    console.log("Starting InteractionStorage test...");

    let member1Id: string | null = null;
    let member2Id: string | null = null;
    let createdConversationId: string | null = null;

    try {
        // 1. Create Test Users (Members)
        // We need to create 'users' and 'members' because they are likely linked.
        // However, looking at interaction-storage, it joins on 'members'. 
        // Let's see if we can just insert into 'members' directly or if we need 'users' auth first.
        // Usually 'members' table is linked to auth.users or public.users.

        // Let's try inserting into 'members' directly for simplicity if RLS allows or if it's just a table.
        // Inspecting schema would be good, but I'll assume standard setup.
        // Wait, I don't have the schema file content for 'members' table yet.
        // I'll try to insert using supabase client.

        console.log("Creating test members...");

        // Create Member 1
        const m1Payload = {
            email: TEST_EMAIL_1,
            first_name: "Test",
            last_name: "One",
            password: "password123", // required field
            membership_tier: "bronze"
        };

        const { data: m1, error: e1 } = await supabase
            .from("members")
            .insert(m1Payload)
            .select()
            .single();

        if (e1) throw new Error(`Failed to create member 1: ${e1.message}`);
        member1Id = m1.id;
        console.log("Created Member 1:", member1Id);

        // Create Member 2
        const m2Payload = {
            email: TEST_EMAIL_2,
            first_name: "Test",
            last_name: "Two",
            password: "password123",
            membership_tier: "bronze"
        };

        const { data: m2, error: e2 } = await supabase
            .from("members")
            .insert(m2Payload)
            .select()
            .single();

        if (e2) throw new Error(`Failed to create member 2: ${e2.message}`);
        member2Id = m2.id;
        console.log("Created Member 2:", member2Id);

        if (!member1Id || !member2Id) throw new Error("Failed to get member IDs");

        // 2. Test getOrCreateDirectConversation
        console.log("Testing getOrCreateDirectConversation...");
        const conversation = await interactionStorage.getOrCreateDirectConversation(member1Id, member2Id);
        createdConversationId = conversation.id;
        console.log("Created/Retrieved Conversation:", conversation.id);

        // 3. Test createMessage
        console.log("Testing createMessage...");
        const message = await interactionStorage.createMessage({
            conversationId: conversation.id,
            senderId: member1Id,
            content: "Hello from Test User 1",
            // other fields optional/handled by default
        });
        console.log("Created Message:", message.id);

        // 4. Test getConversationsByMemberId
        console.log("Testing getConversationsByMemberId...");
        const conversations = await interactionStorage.getConversationsByMemberId(member1Id);
        console.log(`Found ${conversations.length} conversations for Member 1`);
        const foundConv = conversations.find(c => c.id === conversation.id);
        if (!foundConv) throw new Error("Created conversation not found for Member 1");
        console.log("Verified conversation existence in list.");
        console.log("Last message content:", foundConv.lastMessage?.content);

        // 5. Test getMessagesByConversationId
        console.log("Testing getMessagesByConversationId...");
        const messages = await interactionStorage.getMessagesByConversationId(conversation.id);
        console.log(`Found ${messages.length} messages in conversation`);
        if (messages.length === 0) throw new Error("No messages found in conversation");
        if (messages[0].content !== "Hello from Test User 1") throw new Error("Message content mismatch");
        console.log("Verified message content.");

    } catch (error) {
        console.error("Test Failed:", error);
        process.exit(1);
    } finally {
        // Cleanup
        console.log("Cleaning up...");
        if (createdConversationId) {
            // Delete messages first (cascade usually handles this but let's be safe if no cascade)
            await supabase.from("messages").delete().eq("conversation_id", createdConversationId);
            // Delete participants
            await supabase.from("conversation_participants").delete().eq("conversation_id", createdConversationId);
            // Delete conversation
            await supabase.from("conversations").delete().eq("id", createdConversationId);
        }
        if (member1Id) await supabase.from("members").delete().eq("id", member1Id);
        if (member2Id) await supabase.from("members").delete().eq("id", member2Id);
        console.log("Cleanup complete.");
    }
}

testInteractionStorage();
