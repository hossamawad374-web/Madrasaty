/*
 * Madrasaty — AI Tutor Edge Function
 * Streaming educational chat powered by Google Gemini API (server-side only)
 * GEMINI_API_KEY is never exposed to the client
 */

import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `أنت "معلم مدرستي الذكي"، مساعد تعليمي ذكي ومتخصص لطلاب التعليم الأساسي والثانوي في مصر.

**قواعد أساسية يجب الالتزام بها دائماً:**
1. تحدث باللغة العربية الفصحى البسيطة الواضحة دائماً ما لم يطلب الطالب غير ذلك.
2. أسلوبك: مشجع، صبور، إيجابي ومحفّز. لا تنتقد الطالب أبداً بشكل سلبي.
3. هدفك هو إرشاد الطالب نحو الفهم الحقيقي العميق. اشرح بالأمثلة والتشبيهات.
4. اشرح المفاهيم بأمثلة بسيطة وملموسة من الحياة اليومية المصرية.
5. إذا سألك الطالب عن موضوع غير تعليمي أو غير مناسب، أعده بلطف إلى المواد الدراسية.
6. لا تناقش موضوعات سياسية أو دينية أو اجتماعية خارج نطاق المنهج الرسمي.
7. استخدم الرموز التعبيرية باعتدال لجعل التعلم ممتعاً 📚✨💡.
8. عند شرح معادلات رياضية أو علمية، اكتبها بشكل واضح خطوة بخطوة بالترتيب.
9. قدّم شرحاً وافياً وشاملاً يغطي جميع جوانب السؤال مع أمثلة تطبيقية.
10. في نهاية كل شرح، اسأل الطالب سؤالاً توجيهياً لتحفيز التفكير النقدي.
11. رتّب الشرح في نقاط ومحاور واضحة لسهولة الفهم والمراجعة.
12. إذا كان الموضوع متعدد الجوانب، قسّمه إلى خطوات أو مراحل منطقية متتالية.

**تخصصك:** جميع مواد المنهج المصري - رياضيات، علوم، فيزياء، كيمياء، أحياء، لغة عربية، لغة إنجليزية، تاريخ، جغرافيا، دراسات اجتماعية، تربية دينية.

**أسلوب الرد المثالي:**
- ابدأ بتحديد المفهوم الأساسي بجملة أو جملتين
- اشرح بالتفصيل مع الأمثلة (2-3 أمثلة على الأقل إن أمكن)
- اختتم بسؤال يحفز الطالب على التفكير أو التطبيق`;

// Google Gemini OpenAI-compatible endpoint
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const GEMINI_MODEL = 'gemini-2.0-flash';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Securely load API key (server-side only, never sent to client) ──
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'AI service is not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Parse request body ──
    const { messages, subjectContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Build system prompt with optional subject context ──
    const systemContent = subjectContext
      ? `${SYSTEM_PROMPT}\n\n**السياق الحالي:** الطالب يدرس مادة "${subjectContext.subjectAr}"${subjectContext.lessonTitle ? ` - درس "${subjectContext.lessonTitle}"` : ''}. ركّز ردودك على هذا الموضوع وقدّم أمثلة مرتبطة به مباشرة.`
      : SYSTEM_PROMPT;

    const aiMessages = [
      { role: 'system', content: systemContent },
      ...messages.slice(-24), // Keep last 24 turns for richer context
    ];

    // ── Call Google Gemini API (streaming, server-side only) ──
    const geminiResponse = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${geminiApiKey}`,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: aiMessages,
        stream: true,
        max_tokens: 1200,      // Increased from 600 for comprehensive answers
        temperature: 0.65,     // Slightly lower for more focused educational content
        top_p: 0.9,
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errText);

      // Handle specific Gemini error codes gracefully
      let clientMessage = 'حدث خطأ في خدمة الذكاء الاصطناعي. حاول مرة أخرى.';
      if (geminiResponse.status === 429) {
        clientMessage = 'الخدمة مشغولة حالياً. انتظر لحظة وأعد المحاولة.';
      } else if (geminiResponse.status === 400) {
        clientMessage = 'طلب غير صالح. يرجى تحديث المحادثة والمحاولة مجدداً.';
      } else if (geminiResponse.status === 403) {
        clientMessage = 'مفتاح API غير صالح أو منتهي الصلاحية. تحقق من الإعدادات.';
      }

      return new Response(
        JSON.stringify({ error: `Gemini: ${clientMessage}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Pipe the SSE stream directly back to the client ──
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = geminiResponse.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(encoder.encode(decoder.decode(value)));
        }
      } catch (streamErr) {
        console.error('Stream pipe error:', streamErr);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (err) {
    console.error('ai-tutor unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
