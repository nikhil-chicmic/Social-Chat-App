import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useState, useEffect } from "react";

export const useChatNavigation = () => {
  const navigation = useNavigation<any>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const handleMessageUser = async (targetUser: any) => {
    if (!currentUserId) return;
    
    // Check if conversation already exists
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);
      
    let existingConvId = null;
    
    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map(c => c.conversation_id);
      const { data: theirConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUser.id)
        .in("conversation_id", convIds);
        
      if (theirConvs && theirConvs.length > 0) {
        existingConvId = theirConvs[0].conversation_id;
      }
    }
    
    if (existingConvId) {
      // Go to existing chat
      navigation.navigate("ChatRoom", {
        conversationId: existingConvId,
        otherUser: targetUser
      });
    } else {
      // Create new conversation
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();
        
      if (newConv && !convErr) {
        // Add both participants
        await supabase.from("conversation_participants").insert([
          { conversation_id: newConv.id, user_id: currentUserId },
          { conversation_id: newConv.id, user_id: targetUser.id }
        ]);
        
        // Go to new chat
        navigation.navigate("ChatRoom", {
          conversationId: newConv.id,
          otherUser: targetUser
        });
      }
    }
  };

  return { handleMessageUser };
};
