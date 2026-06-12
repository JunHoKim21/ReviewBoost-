import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, originalText, summarizedText, templateStyle } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // 1. Supabase RPC 함수 호출을 통해 원자적(Atomic) 크레딧 차감 시도
    // (동시 다발적인 다운로드 요청 엣지 케이스 방어)
    const { data: success, error: rpcError } = await supabase.rpc('use_credit', {
      user_uuid: userId
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!success) {
      // 크레딧 소진
      return NextResponse.json({ error: '크레딧이 부족합니다.' }, { status: 403 });
    }

    // 2. 크레딧 차감에 성공했으므로, 리뷰 생성 로그 저장
    const { error: insertError } = await supabase
      .from('review_cards')
      .insert([
        {
          user_id: userId,
          original_text: originalText,
          summarized_text: summarizedText,
          template_style: templateStyle
        }
      ]);

    if (insertError) {
      console.error('Insert Error:', insertError);
      // 로그 저장 실패 시 대처 (실무에선 크레딧 롤백 등을 처리하지만 MVP이므로 로그만 남김)
      return NextResponse.json({ error: '로그 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '크레딧 차감 및 로그 저장 완료' }, { status: 200 });
    
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
