import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { originalText } = await req.json();

    if (!originalText || typeof originalText !== 'string') {
      return NextResponse.json({ error: '리뷰 텍스트가 필요합니다.' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // API Key가 없는 경우 테스트용 목업 응답 반환 (Vibe Coding 용)
      console.warn('OPENAI_API_KEY is not set. Returning mock summary.');
      return NextResponse.json({ 
        summary: "너무 핏도 예쁘고 마음에 쏙 들어요! 완전 강추입니다 ✨", 
        subText: "만족도 100% 고객 리뷰" 
      });
    }

    // 실제 OpenAI API 호출 로직
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "너는 쇼핑몰 리뷰 전문 카피라이터야. 고객의 길고 두서없는 리뷰 텍스트를 인스타그램 카드뉴스에 들어갈 아주 짧고 소구력 있는 1줄짜리 감성 문구(이모지 포함)로 요약해줘. JSON 포맷으로 { \"summary\": \"요약된 1줄 문구\", \"subText\": \"고객 닉네임이나 짧은 강조 해시태그\" } 로만 반환해."
          },
          {
            role: "user",
            content: originalText
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultContent = data.choices[0]?.message?.content;
    const parsed = JSON.parse(resultContent || "{}");

    return NextResponse.json({
      summary: parsed.summary || "요약에 실패했습니다.",
      subText: parsed.subText || "고객 리뷰"
    }, { status: 200 });

  } catch (err: any) {
    console.error('Summarize Error:', err);
    return NextResponse.json({ error: 'AI 요약 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
