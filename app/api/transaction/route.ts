import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const transactionData = await request.json();

    const apiUrl = process.env.API_URL;
    const response = await fetch(`${apiUrl}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Transaction API error:', error);
    return NextResponse.json(
      { error: '取引処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 