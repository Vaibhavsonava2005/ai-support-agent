import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const audioData = await request.arrayBuffer();

    if (!audioData || audioData.byteLength === 0) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&punctuate=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm',
        },
        body: audioData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram STT error:', errorText);
      return NextResponse.json({ error: 'Speech-to-text failed' }, { status: 500 });
    }

    const result = await response.json();

    const transcript =
      result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence =
      result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return NextResponse.json({
      transcript,
      confidence,
      words: result.results?.channels?.[0]?.alternatives?.[0]?.words || [],
    });
  } catch (error: any) {
    console.error('STT API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
