import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from 'https://esm.sh/openai@4.20.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, senderId } = await req.json()
    console.log('Received message:', message)

    if (!senderId) {
      throw new Error('senderId is required')
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate embeddings for query
    console.log('Generating embeddings for query:', message)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding

    // Perform semantic search with a lower threshold
    console.log('Performing semantic search')
    const { data: relevantMessages, error: searchError } = await supabaseClient.rpc(
      'match_messages',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // Lowered from 0.3 to get more matches
        match_count: 50 // Increased from 20 to get more context
      }
    )

    if (searchError) {
      console.error('Error in semantic search:', searchError)
      throw searchError
    }

    console.log('Found relevant messages:', relevantMessages?.length || 0)
    
    // Log the actual messages for debugging
    if (relevantMessages) {
      console.log('Message contents:', relevantMessages.map(msg => ({
        content: msg.content,
        similarity: msg.similarity
      })))
    }

    // Format context from relevant messages
    const messageHistory = relevantMessages
      ?.map(msg => `Message: ${msg.content} (Similarity: ${msg.similarity.toFixed(2)})`)
      .join('\n')

    console.log('Using semantically relevant messages for context')

    // Generate AI response with more explicit instructions
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful AI assistant in a chat application. You have access to the chat history through semantic search.
                   The following are relevant messages from previous conversations in this chat:
                   ${messageHistory}
                   
                   Use this context to answer questions about conversations that happened in the app.
                   If you find relevant information in the context, use it in your response.
                   If you don't find relevant information, acknowledge that you don't see any relevant messages about the topic.` 
        },
        { role: "user", content: message }
      ],
    })

    const aiResponse = completion.choices[0].message.content

    // Generate embedding for AI response
    const responseEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: aiResponse,
    })

    // Store AI response with embedding
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        content: aiResponse,
        sender_id: senderId,
        channel: 'ask-ai',
        embedding: responseEmbedding.data[0].embedding
      })

    if (insertError) {
      console.error('Error storing AI response:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})