import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { originalText } = await req.json();

    if (!originalText || typeof originalText !== 'string') {
      return NextResponse.json({ error: '리뷰 텍스트가 필요합니다.' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY is not set. Returning mock summary.');
      return NextResponse.json({ 
        summary: "너무 핏도 예쁘고 마음에 쏙 들어요! 완전 강추입니다 ✨", 
        subText: "만족도 100% 고객 리뷰" 
      });
    }

    // 공식 SDK 초기화
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `너는 쇼핑몰 리뷰 전문 카피라이터야. 고객의 길고 두서없는 리뷰 텍스트를 인스타그램 카드뉴스에 들어갈 아주 짧고 소구력 있는 1줄짜리 감성 문구(이모지 포함)로 요약해줘. \n반드시 아래 JSON 포맷으로만 응답해. 백틱(\`\`\`)이나 마크다운은 절대 쓰지 마.\n{"summary": "요약된 1줄 문구", "subText": "고객 닉네임이나 짧은 강조 해시태그"}\n\n리뷰 원본: ${originalText}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText || "{}");

    return NextResponse.json({
      summary: parsed.summary || "요약에 실패했습니다.",
      subText: parsed.subText || "고객 리뷰"
    }, { status: 200 });

  } catch (err: any) {
    console.error('Summarize Error with SDK:', err);
    return NextResponse.json({ error: err.message || 'AI 요약 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

