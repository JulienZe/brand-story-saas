import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { stories, brands } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const team = await db.query.teamMembers.findFirst({
      where: (tm: any, { eq }: any) => eq(tm.userId, user.id),
    });

    if (!team) {
      return NextResponse.json({ stories: [], brands: [] });
    }

    const storyList = await db
      .select()
      .from(stories)
      .where(eq(stories.teamId, team.teamId))
      .orderBy(desc(stories.createdAt));

    const brandList = await db
      .select()
      .from(brands)
      .where(eq(brands.teamId, team.teamId))
      .orderBy(desc(brands.createdAt));

    return NextResponse.json({ stories: storyList, brands: brandList });
  } catch (error: any) {
    console.error('获取品牌故事列表失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { name, industry, description, values, tone, targetAudience } = body;

    if (!name) {
      return NextResponse.json({ error: '品牌名称为必填项' }, { status: 400 });
    }

    const team = await db.query.teamMembers.findFirst({
      where: (tm: any, { eq }: any) => eq(tm.userId, user.id),
    });

    if (!team) {
      return NextResponse.json({ error: '未找到团队' }, { status: 404 });
    }

    const [brand] = await db
      .insert(brands)
      .values({
        teamId: team.teamId,
        name,
        industry: industry || null,
        description: description || null,
        values: values ? JSON.stringify(values) : null,
        tone: tone || null,
        targetAudience: targetAudience || null,
      })
      .returning();

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    console.error('创建品牌失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
