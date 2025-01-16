import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { OpenAI } from "https://esm.sh/openai@4.20.1"

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
    const { message, channelContext = true } = await req.json()
    console.log('Received request:', { message, channelContext })

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch recent messages for context
    const { data: recentMessages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (messagesError) {
      throw messagesError
    }

    // Format messages for context
    const messageHistory = recentMessages
      .map(msg => `${msg.sender_id}: ${msg.content}`)
      .reverse()
      .join('\n')

    // Create system message
    const systemMessage = `You are Genie, a helpful AI assistant in a chat application. 
    You have access to recent message history for context.
    Always be friendly and concise in your responses.
    
    Recent chat history:
    ${messageHistory}`

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
    })

    const aiResponse = completion.choices[0].message.content

    // Store AI response in messages
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        content: aiResponse,
        sender_id: '00000000-0000-0000-0000-000000000000', // Special ID for Genie
        channel: 'ask-ai',
        is_dm: false
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