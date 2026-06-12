import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { originalText } = await req.json();

    if (!originalText || typeof originalText !== 'string') {
      return NextResponse.json({ error: '리뷰 텍스트가 필요합니다.' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      // API Key가 없는 경우 테스트용 목업 응답 반환
      console.warn('GEMINI_API_KEY is not set. Returning mock summary.');
      return NextResponse.json({ 
        summary: "너무 핏도 예쁘고 마음에 쏙 들어요! 완전 강추입니다 ✨", 
        subText: "만족도 100% 고객 리뷰" 
      });
    }

    // Google Gemini API 호출 로직 (gemini-1.5-flash 모델)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    // 프롬프트 구성 (JSON 형식 강제)
    const prompt = `너는 쇼핑몰 리뷰 전문 카피라이터야. 고객의 길고 두서없는 리뷰 텍스트를 인스타그램 카드뉴스에 들어갈 아주 짧고 소구력 있는 1줄짜리 감성 문구(이모지 포함)로 요약해줘. \n반드시 아래 JSON 포맷으로만 응답해. 백틱(\`\`\`)이나 마크다운은 절대 쓰지 마.\n{"summary": "요약된 1줄 문구", "subText": "고객 닉네임이나 짧은 강조 해시태그"}\n\n리뷰 원본: ${originalText}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
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

