import { NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/settings';

// GET Route
export async function GET() {
  try {
    const settings = await getSiteSettings(); // <--- Clean function call
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// POST Route
export async function POST(request) {
  try {
    const body = await request.json();
    await updateSiteSettings(body); // <--- Clean function call
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}