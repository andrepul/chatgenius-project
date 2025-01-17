import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from 'https://esm.sh/openai@4.20.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Use a fixed UUID for the AI assistant
const AI_ASSISTANT_ID = "00000000-0000-0000-0000-000000000000"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json()
    console.log('Received message:', message)

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, ensure the AI assistant profile exists
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: AI_ASSISTANT_ID,
        username: 'AI Assistant',
        status: 'online'
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Error ensuring AI profile:', profileError)
      throw profileError
    }

    // Generate embeddings for query
    console.log('Generating embeddings for query:', message)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding

    // Perform semantic search
    console.log('Performing semantic search')
    const { data: relevantMessages, error: searchError } = await supabaseClient.rpc(
      'match_messages',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 20
      }
    )

    if (searchError) {
      console.error('Error in semantic search:', searchError)
      throw searchError
    }

    console.log('Found messages:', relevantMessages?.length || 0)

    // Format context from relevant messages
    const messageHistory = relevantMessages
      ?.map(msg => `Message: ${msg.content} (Similarity: ${msg.similarity.toFixed(2)})`)
      .join('\n')

    console.log('Using semantically relevant messages for context')

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful AI assistant in a chat application. You have access to the chat history through semantic search.
                   Use the provided chat context to answer questions about conversations that happened in the app.
                   Here are the most relevant messages from the chat history:
                   ${messageHistory}` 
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
        sender_id: AI_ASSISTANT_ID,
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