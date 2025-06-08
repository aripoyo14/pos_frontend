import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    const apiUrl = process.env.API_URL;
    const response = await fetch(`${apiUrl}/api/barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: '商品が見つかりません' },
          { status: 404 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Barcode API error:', error);
    return NextResponse.json(
      { error: '商品情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 