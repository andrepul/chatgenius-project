import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    console.log('Received message:', message)

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate embeddings for the query
    console.log('Generating embeddings for query:', message)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding

    // Perform semantic search using embeddings
    console.log('Performing semantic search')
    const { data: relevantMessages, error: searchError } = await supabaseClient.rpc(
      'match_messages',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Adjust this threshold as needed
        match_count: 10 // Number of relevant messages to retrieve
      }
    )

    if (searchError) {
      console.error('Error in semantic search:', searchError)
      throw searchError
    }

    // Format relevant messages for context
    const messageHistory = relevantMessages
      ?.map(msg => `${msg.sender_id}: ${msg.content}`)
      .join('\n')

    console.log('Using semantically relevant messages for context')

    // Create system message with relevant context
    const systemMessage = `You are Genie, a helpful AI assistant in a chat application. 
    You have access to semantically relevant messages from the chat history.
    Always be friendly and concise in your responses.
    
    Relevant chat context:
    ${messageHistory}`

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
    })

    const aiResponse = completion.choices[0].message.content

    // Get the sender ID of the original message sender
    const { data: senderData, error: senderError } = await supabaseClient
      .from('messages')
      .select('sender_id')
      .eq('content', message)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (senderError) {
      throw senderError
    }

    // Generate embedding for AI response
    const responseEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: aiResponse,
    })

    // Store AI response in messages with embedding
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        content: aiResponse,
        sender_id: senderData.sender_id,
        channel: 'ask-ai',
        is_dm: false,
        embedding: responseEmbedding.data[0].embedding
      })

    if (insertError) {
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