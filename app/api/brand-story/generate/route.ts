import { NextRequest, NextResponse } from 'next/server';
import { BrandStoryAgent } from '@/lib/brand-story/Agent';
import { db } from '@/lib/db/drizzle';
import { stories } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productName, productDesc, targetUser, productFeatures,
      template, tone, brandId, provider, apiKey, baseUrl, model
    } = body;

    if (!productName || !productDesc) {
      return NextResponse.json({ error: '产品名称和描述为必填项' }, { status: 400 });
    }

    const agent = new BrandStoryAgent({
      provider: provider || process.env.AI_PROVIDER || 'mock',
      apiKey: apiKey || process.env.AI_API_KEY,
      baseUrl: baseUrl || process.env.AI_BASE_URL,
      model: model || process.env.AI_MODEL,
    });

    const result = await agent.createBrandStory({
      productInfo: {
        name: productName,
        description: productDesc,
        features: productFeatures || [],
        category: template || undefined,
      },
      brandPositioning: {
        tone: tone || 'warm_professional',
        values: [],
        channels: ['微信公众号', '小红书'],
      },
      targetAudience: {
        description: targetUser || '追求品质生活的都市白领',
        demographics: {},
        psychographics: {},
      },
    });

    try {
      const team = await db.query.teamMembers.findFirst({
        where: (tm: any, { eq }: any) => eq(tm.userId, user.id),
      });

      if (team) {
        await db.insert(stories).values({
          teamId: team.teamId,
          brandId: brandId || null,
          title: `${productName} - 品牌故事`,
          content: result.brandStory?.content || '',
          style: template || 'brand_story',
          status: 'draft',
        });
      }
    } catch (dbError) {
      console.error('保存到数据库失败（不影响返回结果）:', dbError);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('品牌故事生成失败:', error);
    return NextResponse.json({ error: error.message || '生成失败' }, { status: 500 });
  }
}
