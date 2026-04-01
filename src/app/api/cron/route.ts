import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const results: string[] = [];

    // --- 1️⃣ 큐넷(Q-Net) ---
    try {
      const qnetResponse = await fetch('https://www.q-net.or.kr/man001.do?gSite=Q&gIntro=Y');
      const qnetHtml = await qnetResponse.text();
      const $ = cheerio.load(qnetHtml);

      $('a').each((index, element) => {
        const text = $(element).text().trim();
        const link = $(element).attr('href');
        if (text && link) {
          const fullLink = link.startsWith('http') ? link : `https://www.q-net.or.kr${link}`;
          results.push(`- **[Q-Net 메뉴]** [${text}](${fullLink})`);
        }
      });
    } catch (e) {
      results.push('- ⚠️ 큐넷 정보 가져오기 실패');
    }

    // --- 2️⃣ 한국데이터산업진흥원 (보내주신 최신 사진의 20260106 주소 적용!) ---
    try {
      const dataApiKey = process.env.PUBLIC_DATA_API_KEY;
      const dataApiUrl = `https://api.odcloud.kr/api/15062838/v1/uddi:203e0beb-5aa5-448d-a167-c6e3f0cf2f4d?page=1&perPage=10&serviceKey=${dataApiKey}`;

      const response1 = await fetch(dataApiUrl);
      const output1 = await response1.json();

      results.push(`\n### 📊 한국데이터산업진흥원 시험 일정 정보\n`);

      if (output1.data && output1.data.length > 0) {
        // 공공데이터 값 중에서 핵심만 뽑기 (어떤 열림 이름인지 몰라서 안전하게 값을 붙임)
        output1.data.slice(0, 5).forEach((item: any) => {
          const info = Object.values(item).slice(0, 3).join(' / ');
          results.push(`- ✨ ${info}`);
        });
      } else {
        results.push(`- (아직 이번 달 시험 일정이 없습니다)`);
      }
    } catch (e) {
      results.push('- ⚠️ 데이터산업진흥원 오류 (키 값이나 서비스 점검시간일 수 있어요)');
    }

    // --- 3️⃣ 한국방송통신전파진흥원(KCA) 공지사항 ---
    try {
      const dataApiKey = process.env.PUBLIC_DATA_API_KEY;
      const kcaApiUrl = `https://apis.data.go.kr/B552729/kcaApiService_cq1/getCqNotice?serviceKey=${dataApiKey}&pageNo=1&numOfRows=5&_type=json`;

      const response2 = await fetch(kcaApiUrl);
      const output2 = await response2.json();

      results.push(`\n### 📡 한국방송통신전파진흥원 공지사항\n`);

      const items = output2?.response?.body?.items?.item || [];
      if (items.length > 0) {
        items.forEach((item: any) => {
          const title = item.title || item.subject || '제목없음';
          results.push(`- 📌 ${title}`);
        });
      } else {
        results.push(`- (새로운 공지사항이 없습니다)`);
      }
    } catch (e) {
      results.push('- ⚠️ KCA 공지사항 오류 (API 연동 신청 승인 대기 중일 수 있어요)');
    }

    // --- 4️⃣ 모아온 정보를 바탕으로 블로그 글 쓰기 ---
    const dateStr = new Date().toISOString().split('T')[0];

    const blogContent = `---
title: "🤖 [자동화] 큐넷 + 공공데이터(시험/공지) 3종 뉴스 종합판!"
date: "${dateStr}"
summary: "Q-Net, 한국데이터산업진흥원, 방송통신전파진흥원의 최신 소식을 심부름꾼 봇이 한 번에 모았습니다."
category: "정보"
tags: ["자격증일정", "공공데이터", "큐넷", "자동화"]
---

안녕하세요! 오늘은 무려 **3곳의 자격증 기관**에서 소식을 자동으로 긁어온 종합 선물 세트입니다. 🎁
이 글은 모두 자동으로 작성되었어요!

${results.join('\n')}

> 드디어 3가지 퍼즐이 모두 모여 최고의 심부름꾼이 탄생했습니다! 수고 많으셨습니다! 🎉
`;

    // 블로그에 파일 쓰기 (내 컴퓨터에서만 작동, 버셀에서는 무시됨)
    const folderPath = path.join(process.cwd(), 'src', 'content', 'posts');
    const fileName = `${dateStr}-auto-all-certs.md`;
    const filePath = path.join(folderPath, fileName);

    let fileCreated = false;
    try {
      // 버셀(Vercel) 서버는 읽기 전용이라 여기서 막힙니다. 에러가 나면 그냥 통과합니다.
      fs.writeFileSync(filePath, blogContent, 'utf-8');
      fileCreated = true;
    } catch (e) {
      console.log('버셀 환경이므로 파일 생성을 건너뜁니다.');
    }

    return new NextResponse(blogContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: '정보 통합 중 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}
